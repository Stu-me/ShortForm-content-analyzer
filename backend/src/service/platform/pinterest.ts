// ─────────────────────────────────────────────────────────────────────────────
// Pinterest handler
//
// No cookie file needed for public pins.
// Pinterest video pins serve mp4 directly — yt-dlp handles them cleanly.
//
// Note: Pinterest image pins (no video) will cause yt-dlp to fail with
// "no video formats found". The error surfaces as a 422 from extractCdnUrl().
// ─────────────────────────────────────────────────────────────────────────────

import type { PlatformHandler, YtdlpOptions } from "./types.js"

export const pinterestHandler: PlatformHandler = {
  buildOptions(_url: string): YtdlpOptions {
    return {
      dumpSingleJson:    true,
      preferFreeFormats: true,
      noWarnings:        true,
    }
  },
}
