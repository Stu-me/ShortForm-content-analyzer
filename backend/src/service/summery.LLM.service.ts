
// const PROMPT = `You are a Web Content & Video Analysis AI. Your job is to deeply analyze the content at the provided URL.

// STEP 1 — Use the Google Search tool to:
// - Search for the exact URL to find metadata, titles, descriptions
// - Search for the video/post title + "transcript" or "full transcript"
// - Search for the video/post title + "summary" or "explained"
// - Search for any fact-checking articles related to the claims made
// - Collect as much detail as possible before composing your response

// STEP 2 — Compose your response.

// ABSOLUTE RULE — YOUR ENTIRE RESPONSE MUST BE A SINGLE RAW VALID JSON OBJECT.
// - Do NOT write anything before the opening {
// - Do NOT write anything after the closing }
// - Do NOT use markdown, backticks, or \`\`\`json fences
// - Do NOT add explanations outside the JSON
// - CRITICAL: All internal double quotes (") inside your string values MUST be escaped as \\" to ensure valid JSON syntax. Newlines must be escaped as \\n.

// Return this exact structure:
// {
//   "title": "string with 1 relevant emoji at start — use the actual video/post title",
//   "source": {
//     "url": "the original URL provided",
//     "platform": "detected platform (e.g. Instagram, YouTube, Twitter, Reddit, Article)",
//     "contentType": "video | image | article | post | other",
//     "author": "channel name, username, or author if found",
//     "publishedAt": "publication date if found, else empty string"
//   },
//   "summary": {
//     "overview": "3-5 sentence detailed overview covering the main topic, context, and conclusion of the content",
//     "keyPoints": ["detailed point 1", "detailed point 2", "detailed point 3", "detailed point 4", "detailed point 5"]
//   },
//   "transcription": [
//     {
//       "timestamp": "MM:SS",
//       "text": "Full verbatim or near-verbatim transcript segment. Include as many entries as needed to cover the ENTIRE content — do not truncate or summarize here. For non-video content use 00:00 for all entries."
//     }
//   ],
//   "verification": {
//     "claims": [
//       {
//         "claim": "specific claim made in the content",
//         "verdict": "true | false | misleading | unverified",
//         "explanation": "evidence or reasoning from search results"
//       }
//     ],
//     "overallVerdict": "accurate | inaccurate | partially accurate | unverified",
//     "factCheckReport": "comprehensive paragraph summarizing which claims are confirmed, corrected, or need context based on search results"
//   },
//   "resources": [
//     {
//       "platform": "source name",
//       "url": "full URL",
//       "relevance": "one line why this matters"
//     }
//   ]
// }`;



// STEP 1 — Watch the video fully to extract metadata, visual context, and audio cues.
// STEP 2 — Transcribe the spoken audio verbatim with accurate timestamps.
// STEP 3 — Compose your response based strictly on the video content.

// ABSOLUTE RULE — YOUR ENTIRE RESPONSE MUST BE CONTAINED WITHIN A MARKDOWN JSON CODE BLOCK.
// - You MUST wrap your entire response inside \`\`\`json and \`\`\` fences.
// - Do NOT write any conversational text or explanations outside the code block.
// - Ensure the contents are a single, fully valid JSON object matching the requested schema.
// - CRITICAL: All internal double quotes (") inside your string values MUST be escaped as \\" to ensure valid JSON syntax. Newlines must be escaped as \\n.

// STEP 1 — Watch the video fully to extract metadata, visual context, and audio cues.
// STEP 2 — Transcribe the spoken audio verbatim with accurate timestamps.
// STEP 3 — Compose your response based strictly on the video content.

// ABSOLUTE RULE — YOUR ENTIRE RESPONSE MUST BE CONTAINED WITHIN A MARKDOWN JSON CODE BLOCK.
// - You MUST wrap your entire response inside \`\`\`json and \`\`\` fences.
// - Do NOT write any conversational text or explanations outside the code block.
// - Ensure the contents are a single, fully valid JSON object matching the requested schema.
// - CRITICAL: All internal double quotes (") inside your string values MUST be escaped as \\" to ensure valid JSON syntax. Newlines must be escaped as \\n.


import { GoogleGenAI } from "@google/genai";
import { EnvConfig } from "../config/env.config.js";
import { AppError } from "../errors/AppErrors.errors.js";
import { logger } from "../utility/logger.utility.js";

export interface Analysis {
  title: string;
  source: { url: string; platform: string; contentType: string; author: string; publishedAt: string; };
  summary: { overview: string; keyPoints: string[]; };
  transcription: Array<{ timestamp: string; text: string; }>;
  verification: {
    claims: Array<{
      claim: string;
      verdict: "true" | "false" | "misleading" | "unverified";
      explanation: string;
    }>;
    overallVerdict: string;
    factCheckReport: string;
  };
  resources: Array<{
    title: string;
    url: string;
    relevance: string;
  }>;
}

const apiKey = EnvConfig.GEMINI_KEY;
if (!apiKey) {
  throw new Error("CRITICAL: GEMINI_API_KEY environment variable is missing.");
}
const ai = new GoogleGenAI({ apiKey });
const geminiModels = EnvConfig.GEMINI_MODELS.split(",").map((model) => model.trim()).filter(Boolean);

function getProviderStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;

  const providerError = error as {
    status?: unknown;
    error?: { code?: unknown };
    message?: unknown;
  };

  if (typeof providerError.status === "number") return providerError.status;
  if (typeof providerError.error?.code === "number") return providerError.error.code;

  if (typeof providerError.message === "string") {
    try {
      const parsed = JSON.parse(providerError.message) as { error?: { code?: unknown } };
      return typeof parsed.error?.code === "number" ? parsed.error.code : undefined;
    } catch {
      return undefined;
    }
  }

  return undefined;
}

function isRetryableProviderStatus(status: number | undefined): boolean {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export interface AnalysisSourceContext {
  originalUrl: string
  platform: string
}

export async function analyzeVideo(cdnURL: string, source: AnalysisSourceContext): Promise<Analysis> {
  const sourceUrlJson = JSON.stringify(source.originalUrl)
  const sourcePlatformJson = JSON.stringify(source.platform)

  // CRITICAL: We rewrite the prompt to FORBADE the model from skipping fact checking.
  const promptText = `You are a Web Content & Video Analysis AI. Your job is to deeply analyze the provided video.

STEP 1 — Watch the video fully to extract metadata, visual context, and audio cues.
STEP 2 — Transcribe the spoken audio verbatim with accurate timestamps.
STEP 3 — Extract and critically analyze any claims made, including pseudo-scientific assertions, supernatural claims, or factual statements about individuals/celebrities.

CRITICAL FACT-CHECKING RULES:
- Do NOT skip fact-checking. Treat pseudo-scientific claims (like palmistry changing a future path) or factual claims about celebrities using palmistry as testable assertions.
- Provide scientific refutations, consensus knowledge, or relevant reports based on known facts.
- Populate the "verification.claims" array with at least 1-2 distinct claims found in the transcript.
- Populate the "resources" array with reference topics or reliable sources regarding the claims. Never leave "resources" empty if unverified or false claims are present.

ABSOLUTE RULE — YOUR ENTIRE RESPONSE MUST BE CONTAINED WITHIN A MARKDOWN JSON CODE BLOCK FENCED WITH \`\`\`json AND \`\`\`.

Return this exact structure:
{
  "title": "string with 1 relevant emoji at start",
  "source": { "url": ${sourceUrlJson}, "platform": ${sourcePlatformJson}, "contentType": "video", "author": "unknown", "publishedAt": "" },
  "summary": { "overview": "3-5 sentence detailed overview", "keyPoints": [] },
  "transcription": [{ "timestamp": "MM:SS", "text": "verbatim text" }],
  "verification": {
    "claims": [
      {
        "claim": "The specific statement made in the video",
        "verdict": "false", 
        "explanation": "Detailed scientific or factual reason explaining why this claim is false, misleading, or unverified."
      }
    ],
    "overallVerdict": "A single word summarizing the video veracity (e.g., Pseudoscience, Misleading, True)",
    "factCheckReport": "A concise analytical summary of your verification findings."
  },
  "resources": [
    {
      "title": "Title of the supporting article/resource found via search",
      "url": "Full HTTP URL path to the reference article",
      "relevance": "Why this link helps the user understand the facts."
    }
  ]
}`;

  const isYoutubeWatchUri =
    /youtube\.com\/watch\?v=|youtu\.be\//i.test(cdnURL)

  const contents = [
    isYoutubeWatchUri
      ? { fileData: { fileUri: cdnURL } }
      : { fileData: { fileUri: cdnURL, mimeType: "video/mp4" } },
    { text: promptText }
  ];

  // Retry temporary provider capacity failures, then try the next configured model.
  for (const model of geminiModels) {
    for (let attempt = 0; attempt <= EnvConfig.GEMINI_MAX_RETRIES; attempt += 1) {
      try {
        const response = await ai.models.generateContent({ model, contents });
        const rawText: string = response.text ?? "";
        if (!rawText) {
          throw new Error("LLM provider returned an empty or undefined response text.");
        }

        const jsonMatch = rawText.match(/```json([\s\S]*?)```/);
        const cleanJsonText = jsonMatch && jsonMatch[1] ? jsonMatch[1].trim() : rawText.trim();
        return JSON.parse(cleanJsonText) as Analysis;
      } catch (error) {
        const status = getProviderStatus(error);
        const canRetry = isRetryableProviderStatus(status) && attempt < EnvConfig.GEMINI_MAX_RETRIES;

        if (!canRetry) {
          if (isRetryableProviderStatus(status)) {
            logger.warn({ model, status }, "Gemini model exhausted retries");
            break;
          }
          throw error;
        }

        const delay = 1000 * 2 ** attempt;
        logger.warn({ model, status, attempt: attempt + 1, delay }, "Retrying Gemini request");
        await wait(delay);
      }
    }
  }

  throw new AppError(
    "The AI service is temporarily overloaded. Please try again in a few moments.",
    503,
  );
}




