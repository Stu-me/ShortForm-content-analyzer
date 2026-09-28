// ─────────────────────────────────────────────────────────────────────────────
// Instagram handler
//
// Requires:  cookies.txt  (Netscape format) in the backend root.
//            Without it yt-dlp can still fetch public Reels but will fail on
//            age-gated or private content.
//
// Known issues:
//   - CDN URLs contain a ?oe=<hex> expiry timestamp (~10 min window).
//     The pipeline checks this before sending to Gemini.
//   - Cookie files expire every ~30-90 days — refresh them when you see
//     "login required" errors in the logs.
// ─────────────────────────────────────────────────────────────────────────────

import path from "node:path"
import fs   from "node:fs"
import type { PlatformHandler, YtdlpOptions } from "./types.js"

const COOKIE_FILE = path.resolve(process.cwd(), "cookies.txt")

export const instagramHandler: PlatformHandler = {
  buildOptions(_url: string): YtdlpOptions {
    const options: YtdlpOptions = {
      dumpSingleJson:    true,
      preferFreeFormats: true,
      noWarnings:        true,
      // Instagram requires a browser-like referer and user-agent or it returns 403
      addHeader: [
        "referer:https://www.instagram.com/",
        "user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      ],
    }

    // Attach cookie file only if it exists — gracefully skip if not present
    if (fs.existsSync(COOKIE_FILE)) {
      options.cookies = COOKIE_FILE
    }

    return options
  },
}
