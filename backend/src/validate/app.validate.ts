import { z } from "zod";
import {
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
})

export type AnalyzeInput = z.infer<typeof AnalyzeSchema>;
