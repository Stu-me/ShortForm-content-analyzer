import type { Platform } from "./types.js"

export interface PlatformDefinition {
  platform: Platform
  label: string
  supportedDomains: readonly string[]
}

export const PLATFORM_DEFINITIONS = [
  {
    platform: "instagram",
    label: "Instagram Reel",
    supportedDomains: ["instagram.com"],
  },
  {
    platform: "youtube",
    label: "YouTube Short",
    supportedDomains: ["youtube.com", "youtu.be"],
  },
  {
    platform: "tiktok",
    label: "TikTok video",
    supportedDomains: ["tiktok.com", "vm.tiktok.com"],
  },
  {
    platform: "reddit",
    label: "Reddit video",
    supportedDomains: ["reddit.com", "v.redd.it"],
  },
  {
    platform: "pinterest",
    label: "Pinterest video",
    supportedDomains: ["pinterest.com", "pin.it"],
  },
  {
    platform: "facebook",
    label: "Facebook Reel",
    supportedDomains: ["facebook.com", "fb.watch"],
  },
  {
    platform: "snapchat",
    label: "Snapchat Spotlight",
    supportedDomains: ["snapchat.com"],
  },
  {
    platform: "x",
    label: "X video",
    supportedDomains: ["twitter.com", "x.com"],
  },
] as const satisfies readonly PlatformDefinition[]

const DOMAIN_TO_DEFINITION = new Map<string, PlatformDefinition>(
  PLATFORM_DEFINITIONS.flatMap((definition) =>
    definition.supportedDomains.map((domain) => [domain, definition] as const)
  )
)

export function normalizeHostname(url: string): string {
  return new URL(url).hostname.replace(/^www\./, "")
}

export function getPlatformDefinitionByUrl(url: string): PlatformDefinition | null {
  try {
    return DOMAIN_TO_DEFINITION.get(normalizeHostname(url)) ?? null
  } catch {
    return null
  }
}

export function getPlatformLabel(platform: Platform): string {
  return PLATFORM_DEFINITIONS.find((definition) => definition.platform === platform)?.label ?? platform
}

export function getSupportedPlatformList(): string {
  return PLATFORM_DEFINITIONS.map((definition) => definition.label).join(", ")
}
