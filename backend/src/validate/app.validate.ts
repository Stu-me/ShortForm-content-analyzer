import { z } from "zod";
import {
  PLATFORM_DEFINITIONS,
  getPlatformDefinitionByUrl,
  getSupportedPlatformList,
  normalizeHostname,
} from "../service/platform/catalog.js";

// ── Schema ────────────────────────────────────────────────────────────────────

export const AnalyzeSchema = z.object({
  url: z
    .string()
    .min(1, "URL is required")
    .url("That doesn't look like a valid URL — make sure it starts with https://")
    .superRefine((v, ctx) => {
      if (getPlatformDefinitionByUrl(v) !== null) return

      let hostname = "this site"
      try { hostname = `"${normalizeHostname(v)}"` } catch { /* ignore */ }

      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${hostname} isn't supported yet. Paste a link from ${getSupportedPlatformList()}.`,
      })
    }),
  platform: z.string().min(1, "Platform is required").refine(
    (platform) => PLATFORM_DEFINITIONS.some((definition) => definition.platform === platform),
    "Unsupported platform",
  ),
}).superRefine(({ url, platform }, ctx) => {
  const detectedPlatform = getPlatformDefinitionByUrl(url)?.platform
  if (detectedPlatform === platform) return

  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    path: ["platform"],
    message: `The selected platform does not match this URL. This URL belongs to ${detectedPlatform ?? "an unsupported platform"}.`,
  })
})

export type AnalyzeInput = z.infer<typeof AnalyzeSchema>;
