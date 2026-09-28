// ─────────────────────────────────────────────────────────────────────────────
// Facebook handler
//
// Requires:  fbck.txt  (Netscape format) in backend root.
//
// ⚠️  WARNING — Most fragile platform:
//   - Facebook actively fights scrapers at infrastructure level.
//   - Cookie files expire in ~30 days.
//   - When cookies go stale, ALL Facebook requests fail with HTTP 403.
//   - Treat this as experimental — monitor logs closely after enabling.
//
// Status: enabled but cookie-dependent. If fbck.txt is missing, yt-dlp will
// attempt public access but most Reels will fail.
// ─────────────────────────────────────────────────────────────────────────────

import path from "node:path"
import fs   from "node:fs"
import type { PlatformHandler, YtdlpOptions } from "./types.js"

const COOKIE_FILE = path.resolve(process.cwd(), "fbck.txt")

export const facebookHandler: PlatformHandler = {
  buildOptions(_url: string): YtdlpOptions {
    const options: YtdlpOptions = {
      dumpSingleJson:    true,
      preferFreeFormats: true,
      noWarnings:        true,
      addHeader: [
        "referer:https://www.facebook.com/",
        "user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      ],
    }

    if (fs.existsSync(COOKIE_FILE)) {
      options.cookies = COOKIE_FILE
    }

    return options
  },
}
