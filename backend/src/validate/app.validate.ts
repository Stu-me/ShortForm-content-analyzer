import { z } from "zod";

// ── Supported platform domains ────────────────────────────────────────────────

const SUPPORTED_DOMAINS: Record<string, string> = {
  "instagram.com":  "Instagram Reel",
  "youtube.com":    "YouTube Short",
  "youtu.be":       "YouTube Short",
  "tiktok.com":     "TikTok video",
  "vm.tiktok.com":  "TikTok video",
  "reddit.com":     "Reddit video",
  "v.redd.it":      "Reddit video",
  "pinterest.com":  "Pinterest video",
  "pin.it":         "Pinterest video",
  "facebook.com":   "Facebook Reel",
  "fb.watch":       "Facebook Reel",
  "snapchat.com":   "Snapchat Spotlight",
  "twitter.com":    "X video",
  "x.com":          "X video",
}

function getSupportedDomain(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "")
    return SUPPORTED_DOMAINS[hostname] ?? null
  } catch {
    return null
  }
}

// ── Schema ────────────────────────────────────────────────────────────────────

export const AnalyzeSchema = z.object({
  url: z
    .string()
    .min(1, "URL is required")
    .url("That doesn't look like a valid URL — make sure it starts with https://")
    .superRefine((v, ctx) => {
      if (getSupportedDomain(v) !== null) return

      let hostname = "this site"
      try { hostname = `"${new URL(v).hostname.replace(/^www\./, "")}"` } catch { /* ignore */ }

      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${hostname} isn't supported yet. Paste a link from Instagram, YouTube, TikTok, Reddit, Pinterest, Facebook, Snapchat or X.`,
      })
    }),
})

export type AnalyzeInput = z.infer<typeof AnalyzeSchema>;
