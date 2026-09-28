// ─────────────────────────────────────────────────────────────────────────────
// Shared types for the platform handler system.
//
// Every platform file exports one `PlatformHandler` object.
// The pipeline in ydl.service.ts calls `getHandler(platform)` to get it,
// then calls `buildOptions(url)` to get the yt-dlp config.
// ─────────────────────────────────────────────────────────────────────────────

/** All platforms the app is aware of (detection) */
export type Platform =
  | 'instagram'
  | 'youtube'
  | 'tiktok'
  | 'reddit'
  | 'pinterest'
  | 'facebook'
  | 'snapchat'
  | 'x'

/** yt-dlp options we care about — keeps handlers type-safe */
export interface YtdlpOptions {
  preferFreeFormats?: boolean
  dumpSingleJson: true          // always true — we never download, only inspect
  noWarnings?: boolean
  cookies?: string              // absolute path to a Netscape cookie file
  addHeader?: string[]          // extra HTTP headers e.g. Referer, User-Agent
  format?: string               // yt-dlp format selector string
}

/**
 * A single platform handler.
 *
 * `buildOptions(url)` returns yt-dlp options tailored for this platform.
 * It receives the URL in case a handler needs to inspect it (e.g. Shorts vs
 * long video on YouTube).
 */
export interface PlatformHandler {
  buildOptions(url: string): YtdlpOptions
}
