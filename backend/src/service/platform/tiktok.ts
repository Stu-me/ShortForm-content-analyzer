// ─────────────────────────────────────────────────────────────────────────────
// TikTok handler
//
// Requires:  ttck.txt  (Netscape format) in backend root — optional.
//
// Warning:
//   TikTok has aggressive bot detection. Works reliably in development but
//   may fail on a fresh production server without cookies from a real session.
//   If you see "Unable to download webpage" errors, add fresh cookies.
//
//   Also: TikTok CDN URLs are typically short-lived (~5 min).
//   The pipeline's checkUrlAge() handles this.
// ─────────────────────────────────────────────────────────────────────────────

import path from "node:path"
import fs   from "node:fs"
import type { PlatformHandler, YtdlpOptions } from "./types.js"

const COOKIE_FILE = path.resolve(process.cwd(), "ttck.txt")

export const tiktokHandler: PlatformHandler = {
  buildOptions(_url: string): YtdlpOptions {
    const options: YtdlpOptions = {
      dumpSingleJson:    true,
      preferFreeFormats: true,
      noWarnings:        true,
      // TikTok requires a realistic browser user-agent or it returns 0-byte videos
      addHeader: [
        "referer:https://www.tiktok.com/",
        "user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      ],
    }

    if (fs.existsSync(COOKIE_FILE)) {
      options.cookies = COOKIE_FILE
    }

    return options
  },
}
