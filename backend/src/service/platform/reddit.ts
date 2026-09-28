// ─────────────────────────────────────────────────────────────────────────────
// Reddit handler
//
// No cookie file needed — Reddit video (v.redd.it) is publicly accessible.
//
// Known issue:
//   Reddit stores audio and video as separate streams. yt-dlp handles merging
//   automatically when you request "best" format, but the merged URL won't be
//   a single CDN link — yt-dlp will pick the best single-file format instead.
//   This means quality may be slightly lower than what you see in the browser.
// ─────────────────────────────────────────────────────────────────────────────

import type { PlatformHandler, YtdlpOptions } from "./types.js"

export const redditHandler: PlatformHandler = {
  buildOptions(_url: string): YtdlpOptions {
    return {
      dumpSingleJson:    true,
      preferFreeFormats: true,
      noWarnings:        true,
      // Request a single-file format (no separate audio/video streams)
      // so we get a direct CDN URL we can pass to Gemini
      format: "best[ext=mp4]/best",
    }
  },
}
