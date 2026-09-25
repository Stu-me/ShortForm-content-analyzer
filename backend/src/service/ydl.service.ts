import YTD from "yt-dlp-exec";
import { analyzeVideo, type Analysis } from './summery.LLM.service.js';

import { logger } from "../utility/logger.utility.js";
import { AppError } from "../errors/AppErrors.errors.js";
import path from "node:path";
import fs from "node:fs";



export const download = async (URL: string) => {



  // const options: any = {
  //   preferFreeFormats: true,
  //   dumpSingleJson: true,   
  //   noWarnings: true,
  //   cookies: URL.includes("instagram")=== true ?'/app/cookies.txt': null,
  //   addHeader: ['referer:instagram.com',
  //     'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'] as any
  // };

  const isInstagram = URL.includes("instagram.com");
  const isYouTube = URL.includes("youtube.com") || URL.includes("youtu.be");



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






