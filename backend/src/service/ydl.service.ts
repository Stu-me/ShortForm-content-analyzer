import YTD from "yt-dlp-exec";
import { analyzeVideo, type Analysis } from './summery.LLM.service.js';
import { logger } from "../utility/logger.utility.js";
import { AppError } from "../errors/AppErrors.errors.js";
import path from "node:path";
import fs from "node:fs";

// ── Platform detection ────────────────────────────────────────────────────────

type Platform =
  | 'instagram' | 'youtube' | 'tiktok'
  | 'reddit'    | 'pinterest' | 'facebook'
  | 'snapchat'  | 'x'

const DOMAIN_MAP: Record<string, Platform> = {
  'instagram.com':  'instagram',
  'youtube.com':    'youtube',
  'youtu.be':       'youtube',
  'tiktok.com':     'tiktok',
  'vm.tiktok.com':  'tiktok',
  'reddit.com':     'reddit',
  'v.redd.it':      'reddit',
  'pinterest.com':  'pinterest',
  'pin.it':         'pinterest',
  'facebook.com':   'facebook',
  'fb.watch':       'facebook',
  'snapchat.com':   'snapchat',
  'twitter.com':    'x',
  'x.com':          'x',
}

function detectPlatform(url: string): Platform {
  let hostname: string
  try {
    hostname = new URL(url).hostname.replace(/^www\./, '')
  } catch {
    throw new AppError('Invalid URL — could not parse the link.', 422)
  }

  const platform = DOMAIN_MAP[hostname]
  if (!platform) {
    throw new AppError(
      `"${hostname}" isn't supported yet. Paste a link from Instagram, YouTube, TikTok, Reddit, Pinterest, Facebook, Snapchat or X.`,
      422
    )
  }

  return platform
}



export const download = async (URL: string) => {

  // ── 1. Detect & validate platform ────────────────────────────────────────
  const platform = detectPlatform(URL)
  logger.info(`Platform detected: ${platform}`)

  const isInstagram = platform === 'instagram'
  const isYouTube   = platform === 'youtube'



  const options: any = {
    preferFreeFormats: true,
    dumpSingleJson: true,
    noWarnings: true,
  };


// Check if cookie files exist in your backend root
const instaCookie = path.resolve(process.cwd(), "cookies.txt");
const ytCookie = path.resolve(process.cwd(), "ytck.txt");

if (isInstagram && fs.existsSync(instaCookie)) {
  options.cookies = instaCookie;
} else if (isYouTube) {
  if (fs.existsSync(ytCookie)) options.cookies = ytCookie;
}

  const info = await YTD(URL, options);
  const cdnURL = info.url ?? info.formats?.at(-1)?.url
  if (!cdnURL) throw new AppError("Could not extract a media URL from the provided link.", 422);
  const summery: Analysis = await analyzeVideo(cdnURL);

  return summery;
}






