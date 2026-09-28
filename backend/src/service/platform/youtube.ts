// ─────────────────────────────────────────────────────────────────────────────
// YouTube handler
//
// Requires:  ytck.txt  (Netscape format) in the backend root — optional.
//            YouTube Shorts work without cookies for public content.
//            Cookies help with age-gated videos and reduce bot-detection blocks.
//
// Format selection (metadata-only via dumpSingleJson):
//   Shorts and most YouTube videos expose separate DASH video + audio streams.
//   The "video+audio" merge operator only produces one file when yt-dlp downloads
//   with ffmpeg — not when we only dump JSON. When no single muxed stream exists,
//   the pipeline sends a canonical watch URL to Gemini (native YouTube ingestion).
// ─────────────────────────────────────────────────────────────────────────────

import path from "node:path"
import fs   from "node:fs"
import { AppError } from "../../errors/AppErrors.errors.js"
import type { PlatformHandler, YtdlpOptions } from "./types.js"

/** Normalize Shorts / youtu.be / watch URLs for Gemini's YouTube fileUri support. */
export function toYoutubeWatchUrl(rawUrl: string): string {
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    throw new AppError("That doesn't look like a valid YouTube link.", 422)
  }

  const host = parsed.hostname.replace(/^www\./, "")
  let videoId: string | null = null

  if (host === "youtu.be") {
    videoId = parsed.pathname.replace(/^\//, "").split("/")[0] || null
  } else if (host.endsWith("youtube.com")) {
    if (parsed.pathname.startsWith("/shorts/")) {
      videoId = parsed.pathname.split("/")[2] ?? null
    } else {
      videoId = parsed.searchParams.get("v")
    }
  }

  if (!videoId) {
    throw new AppError("Could not read a YouTube video id from this link.", 422)
  }

  return `https://www.youtube.com/watch?v=${videoId}`
}

const COOKIE_FILE = path.resolve(process.cwd(), "ytck.txt")

export const youtubeHandler: PlatformHandler = {
  buildOptions(_url: string): YtdlpOptions {
    const options: YtdlpOptions = {
      dumpSingleJson:    true,
      preferFreeFormats: true,
      noWarnings:        true,
      // Prefer mp4 ≤ 720p to stay well under the 80MB size limit
      format: "bestvideo[ext=mp4][height<=720]+bestaudio[ext=m4a]/best[ext=mp4][height<=720]/best",
    }

    if (fs.existsSync(COOKIE_FILE)) {
      options.cookies = COOKIE_FILE
    }

    return options
  },
}
