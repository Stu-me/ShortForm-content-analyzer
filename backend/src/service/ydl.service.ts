// ─────────────────────────────────────────────────────────────────────────────
// Video download pipeline
//
// This is the single entry point for all video analysis requests.
// It orchestrates the full sequence:
//
//   1. detectPlatform   — parse domain, return platform slug
//   2. getHandler       — get platform-specific yt-dlp config (feature-gated)
//   3. yt-dlp           — fetch video metadata (no actual download)
//   4. extractCdnUrl    — pick best audio+video format
//   5. enforceSizeLimit — reject media above configured size limit
//   6. checkUrlAge      — reject expired CDN URLs before sending to Gemini
//   7. analyzeVideo     — send CDN URL to Gemini for analysis
// ─────────────────────────────────────────────────────────────────────────────

import YTD               from "yt-dlp-exec"
import { analyzeVideo }  from "./summery.LLM.service.js"
import type { Analysis } from "./summery.LLM.service.js"
import { logger }        from "../utility/logger.utility.js"
import { AppError }      from "../errors/AppErrors.errors.js"
import { EnvConfig }     from "../config/env.config.js"
import { getHandler }    from "./platform/index.js"
import type { Platform } from "./platform/types.js"
import { toYoutubeWatchUrl } from "./platform/youtube.js"
import {
  getPlatformDefinitionByUrl,
  getPlatformLabel,
  getSupportedPlatformList,
  normalizeHostname,
} from "./platform/catalog.js"

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const MAX_FILESIZE_BYTES = EnvConfig.MEDIA_MAX_FILESIZE_MB * 1024 * 1024
const CDN_URL_MAX_AGE_MS = 5 * 60 * 1000 // 5 minutes

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 — Platform detection
// ─────────────────────────────────────────────────────────────────────────────

function detectPlatform(url: string): Platform {
  const definition = getPlatformDefinitionByUrl(url)
  if (definition) return definition.platform

  let hostname = "this site"
  try { hostname = `"${normalizeHostname(url)}"` } catch { /* ignore */ }

  throw new AppError(
    `${hostname} isn't supported yet. Paste a link from ${getSupportedPlatformList()}.`,
    422
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 4 — CDN URL extraction + size check
// ─────────────────────────────────────────────────────────────────────────────

interface YtdlpMediaMetadata {
  url?:              string
  filesize?:         number | null
  filesize_approx?:  number | null
  vcodec?:           string
  acodec?:           string
  height?:           number | null
  tbr?:              number | null
}

interface YtdlpFormat extends YtdlpMediaMetadata {
  ext?: string
}

interface YtdlpInfo extends YtdlpMediaMetadata {
  formats?: YtdlpFormat[]
}

interface SelectedMedia {
  url: string
  metadata: YtdlpMediaMetadata
}

function hasVideo(metadata: YtdlpMediaMetadata): boolean {
  return Boolean(metadata.vcodec && metadata.vcodec !== "none")
}

function hasAudio(metadata: YtdlpMediaMetadata): boolean {
  return Boolean(metadata.acodec && metadata.acodec !== "none")
}

function hasAudioAndVideo(metadata: YtdlpMediaMetadata): boolean {
  return hasVideo(metadata) && hasAudio(metadata)
}

/** True when yt-dlp metadata includes at least one progressive (muxed) stream URL. */
function infoHasMuxedStream(info: YtdlpInfo): boolean {
  if (info.url) {
    if (info.vcodec && !hasVideo(info)) return false
    if (info.acodec && !hasAudio(info)) return false
    if (!info.vcodec || !info.acodec) return true
    return hasAudioAndVideo(info)
  }

  return (info.formats ?? []).some((format) => format.url && hasAudioAndVideo(format))
}

function getKnownFileSizeBytes(metadata: YtdlpMediaMetadata): number | null {
  if (typeof metadata.filesize === "number") return metadata.filesize
  if (typeof metadata.filesize_approx === "number") return metadata.filesize_approx
  return null
}

function assertUnderSizeLimit(sizeBytes: number, source: string): void {
  if (sizeBytes <= MAX_FILESIZE_BYTES) return

  throw new AppError(
    `This video exceeds the ${EnvConfig.MEDIA_MAX_FILESIZE_MB} MB size limit. Try a shorter clip or raise MEDIA_MAX_FILESIZE_MB if your deployment can handle larger files.`,
    413
  )
}

async function fetchRemoteFileSizeBytes(url: string): Promise<number | null> {
  try {
    const response = await fetch(url, { method: "HEAD" })
    const contentLength = response.headers.get("content-length")
    if (!contentLength) return null

    const parsed = Number(contentLength)
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
  } catch (err) {
    logger.warn({ err }, "Could not verify remote media size with HEAD request")
    return null
  }
}

async function enforceSizeLimit(selected: SelectedMedia): Promise<void> {
  const knownSize = getKnownFileSizeBytes(selected.metadata)
  if (knownSize !== null) {
    assertUnderSizeLimit(knownSize, "yt-dlp metadata")
    return
  }

  const remoteSize = await fetchRemoteFileSizeBytes(selected.url)
  if (remoteSize !== null) {
    assertUnderSizeLimit(remoteSize, "remote content-length")
    return
  }

  logger.warn(
    { limitMb: EnvConfig.MEDIA_MAX_FILESIZE_MB },
    "Media size is unknown from yt-dlp metadata and remote headers; allowing request through"
  )
}

function pickBestFormat(candidates: YtdlpFormat[]): YtdlpFormat {
  const first = candidates[0]
  if (!first) {
    throw new AppError("Could not extract a media URL from the provided link.", 422)
  }

  return candidates.reduce((prev, curr) => {
    const prevH = prev.height ?? 0
    const currH = curr.height ?? 0
    if (currH !== prevH) return currH > prevH ? curr : prev

    const prevBitrate = prev.tbr ?? 0
    const currBitrate = curr.tbr ?? 0
    return currBitrate > prevBitrate ? curr : prev
  }, first)
}

function extractCdnUrl(info: YtdlpInfo): SelectedMedia {
  // Case 1: single-format response — yt-dlp puts the URL at the top level.
  // If codec metadata is present, enforce that it is an audio+video stream.
  if (info.url) {
    if (info.vcodec && !hasVideo(info)) {
      throw new AppError("No video stream found. The link may point to audio-only or unsupported content.", 422)
    }

    if (info.acodec && !hasAudio(info)) {
      throw new AppError("No audio stream found. The selected media is video-only and cannot be transcribed.", 422)
    }

    if (!info.vcodec || !info.acodec) {
      logger.debug("yt-dlp returned a single-format URL without full codec metadata; treating it as combined media")
    }

    return { url: info.url, metadata: info }
  }

  const formats = info.formats ?? []
  if (formats.length === 0) {
    throw new AppError(
      "Could not extract a media URL from this link. The content may be private or unavailable.",
      422
    )
  }

  const mediaFormats = formats.filter((format) => format.url)
  const audioVideoFormats = mediaFormats.filter(hasAudioAndVideo)

  if (audioVideoFormats.length === 0) {
    const videoOnly = mediaFormats.some((format) => hasVideo(format) && !hasAudio(format))
    if (videoOnly) {
      throw new AppError(
        "No combined audio+video stream found. The selected media is video-only and cannot be transcribed.",
        422
      )
    }

    throw new AppError(
      "No video stream found. The link may point to an image or unsupported content.",
      422
    )
  }

  const sizeKnown = audioVideoFormats.filter((format) => getKnownFileSizeBytes(format) !== null)
  const underLimit = sizeKnown.filter((format) => {
    const size = getKnownFileSizeBytes(format)
    return size !== null && size <= MAX_FILESIZE_BYTES
  })

  if (sizeKnown.length > 0 && underLimit.length === 0) {
    throw new AppError(
      `This video exceeds the ${EnvConfig.MEDIA_MAX_FILESIZE_MB} MB size limit. Try a shorter clip or raise MEDIA_MAX_FILESIZE_MB if your deployment can handle larger files.`,
      413
    )
  }

  const unknownSize = audioVideoFormats.filter((format) => getKnownFileSizeBytes(format) === null)
  const candidates = underLimit.length > 0 ? underLimit : unknownSize

  if (underLimit.length === 0 && unknownSize.length > 0) {
    logger.warn(
      { limitMb: EnvConfig.MEDIA_MAX_FILESIZE_MB },
      "Audio+video formats have unknown size; selected URL will be checked with remote HEAD when possible"
    )
  }

  const best = pickBestFormat(candidates)
  if (!best.url) {
    throw new AppError("Could not extract a media URL from the provided link.", 422)
  }

  logger.debug({
    height: best.height,
    bitrate: best.tbr,
    filesize: best.filesize,
    filesize_approx: best.filesize_approx,
    acodec: best.acodec,
    vcodec: best.vcodec,
  }, "Selected audio+video format")

  return { url: best.url, metadata: best }
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 5 — URL age / expiry check
// ─────────────────────────────────────────────────────────────────────────────

function parseInstagramExpiry(url: string): Date | null {
  try {
    const oe = new URL(url).searchParams.get("oe")
    if (!oe) return null
    const expiryUnix = parseInt(oe, 16)
    if (isNaN(expiryUnix)) return null
    return new Date(expiryUnix * 1000)
  } catch {
    return null
  }
}

function checkUrlAge(cdnUrl: string, fetchedAt: Date): void {
  const now = Date.now()

  const instagramExpiry = parseInstagramExpiry(cdnUrl)
  if (instagramExpiry) {
    if (now >= instagramExpiry.getTime()) {
      throw new AppError(
        "The video URL expired before analysis could begin — Gemini is likely under high load. Wait a moment and try again.",
        503
      )
    }

    const remainingMs = instagramExpiry.getTime() - now
    logger.debug(`Instagram CDN URL expires in ${Math.round(remainingMs / 1000)}s`)
    return
  }

  const ageMs = now - fetchedAt.getTime()
  if (ageMs > CDN_URL_MAX_AGE_MS) {
    throw new AppError(
      "The video URL expired before analysis could begin — Gemini is likely under high load. Wait a moment and try again.",
      503
    )
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export — the full pipeline
// ─────────────────────────────────────────────────────────────────────────────

export const download = async (url: string): Promise<Analysis> => {
  const platform = detectPlatform(url)
  logger.info(`[pipeline] platform=${platform}`)

  const handler = getHandler(platform)

  const options = handler.buildOptions(url)
  logger.info(`[pipeline] fetching metadata via yt-dlp`)

  const fetchedAt = new Date()
  const info = await YTD(url, options as object) as YtdlpInfo

  let mediaUri: string

  if (platform === "youtube" && !infoHasMuxedStream(info)) {
    mediaUri = toYoutubeWatchUrl(url)
    logger.info("[pipeline] YouTube DASH-only streams; using watch URL for Gemini")
  } else {
    const selected = extractCdnUrl(info)
    mediaUri = selected.url
    logger.info(`[pipeline] cdnUrl extracted`)

    await enforceSizeLimit(selected)
    logger.info(`[pipeline] media size check passed`)

    checkUrlAge(mediaUri, fetchedAt)
    logger.info(`[pipeline] URL age check passed`)
  }

  logger.info(`[pipeline] sending to Gemini`)
  const result = await analyzeVideo(mediaUri, {
    originalUrl: url,
    platform: getPlatformLabel(platform),
  })
  logger.info(`[pipeline] analysis complete`)

  return result
}
