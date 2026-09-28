// ─────────────────────────────────────────────────────────────────────────────
// Platform router
//
// Single entry point: getHandler(platform) returns the correct handler.
//
// To add a new platform:
//   1. Create its handler file (e.g. newplatform.ts)
//   2. Import it here
//   3. Add it to HANDLERS map
//   4. Add its domain to DOMAIN_MAP in ydl.service.ts
//   5. Add it to ENABLED_PLATFORMS if it's ready for production
//
// ENABLED_PLATFORMS acts as a feature gate — a platform can be fully
// implemented but disabled until you've tested it on production.
// Override via env: ENABLED_PLATFORMS=instagram,youtube,tiktok
// ─────────────────────────────────────────────────────────────────────────────

import { AppError }        from "../../errors/AppErrors.errors.js"
import type { Platform, PlatformHandler } from "./types.js"

import { instagramHandler } from "./instagram.js"
import { youtubeHandler }   from "./youtube.js"
import { tiktokHandler }    from "./tiktok.js"
import { redditHandler }    from "./reddit.js"
import { pinterestHandler } from "./pinterest.js"
import { facebookHandler }  from "./facebook.js"
import { snapchatHandler }  from "./snapchat.js"
import { xHandler }         from "./x.js"

// ── Handler registry ──────────────────────────────────────────────────────────
// Every known platform must have an entry here.

const HANDLERS: Record<Platform, PlatformHandler> = {
  instagram: instagramHandler,
  youtube:   youtubeHandler,
  tiktok:    tiktokHandler,
  reddit:    redditHandler,
  pinterest: pinterestHandler,
  facebook:  facebookHandler,
  snapchat:  snapchatHandler,
  x:         xHandler,
}

// ── Feature gate ──────────────────────────────────────────────────────────────
// Controls which platforms are live. Start conservative — only enable a
// platform once you've confirmed it works on your production server.
// Override via environment variable for easy toggling without code changes.

const DEFAULT_ENABLED: Platform[] = ["instagram", "youtube", "tiktok", "reddit", "pinterest"]

function parseEnabledPlatforms(): Set<Platform> {
  const env = process.env.ENABLED_PLATFORMS
  if (!env) return new Set(DEFAULT_ENABLED)

  const parsed = env
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is Platform => s in HANDLERS)

  return new Set(parsed.length > 0 ? parsed : DEFAULT_ENABLED)
}

// Evaluated once at startup — no per-request overhead
const ENABLED_PLATFORMS = parseEnabledPlatforms()

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns the platform handler for the given platform slug.
 * Throws AppError(422) if the platform is not yet enabled.
 */
export function getHandler(platform: Platform): PlatformHandler {
  if (!ENABLED_PLATFORMS.has(platform)) {
    const enabled = [...ENABLED_PLATFORMS].join(", ")
    throw new AppError(
      `"${platform}" support is coming soon. Currently enabled: ${enabled}.`,
      422
    )
  }

  return HANDLERS[platform]
}

/** Expose enabled set for logging purposes */
export { ENABLED_PLATFORMS }
