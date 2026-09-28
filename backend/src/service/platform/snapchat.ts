// ─────────────────────────────────────────────────────────────────────────────
// Snapchat handler
//
// Only public Spotlight links work. Stories require authentication and
// yt-dlp has no cookie-based auth path for Snapchat.
//
// Note: Snapchat Spotlight URLs look like:
//   https://www.snapchat.com/spotlight/<id>
// Direct story links (snap.com/add/...) will fail — surface a 422 to the user.
// ─────────────────────────────────────────────────────────────────────────────

import type { PlatformHandler, YtdlpOptions } from "./types.js"

export const snapchatHandler: PlatformHandler = {
  buildOptions(_url: string): YtdlpOptions {
    return {
      dumpSingleJson:    true,
      preferFreeFormats: true,
      noWarnings:        true,
      addHeader: [
        "user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      ],
    }
  },
}
