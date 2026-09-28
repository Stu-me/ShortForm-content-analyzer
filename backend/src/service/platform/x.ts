// ─────────────────────────────────────────────────────────────────────────────
// X (Twitter) handler
//
// Requires:  xck.txt  (Netscape format) in backend root.
//
// ⚠️  WARNING:
//   - X rate-limits aggressively. Without cookies, most video requests fail.
//   - Even with cookies, bursts of requests can trigger a temporary block.
//   - Public videos on x.com sometimes work without cookies, but it's unreliable.
//
// Cookie file name: xck.txt
// ─────────────────────────────────────────────────────────────────────────────

import path from "node:path"
import fs   from "node:fs"
import type { PlatformHandler, YtdlpOptions } from "./types.js"

const COOKIE_FILE = path.resolve(process.cwd(), "xck.txt")

export const xHandler: PlatformHandler = {
  buildOptions(_url: string): YtdlpOptions {
    const options: YtdlpOptions = {
      dumpSingleJson:    true,
      preferFreeFormats: true,
      noWarnings:        true,
      addHeader: [
        "referer:https://x.com/",
        "user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      ],
    }

    if (fs.existsSync(COOKIE_FILE)) {
      options.cookies = COOKIE_FILE
    }

    return options
  },
}
