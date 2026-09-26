export interface TranscriptionEntry {
  timestamp: string
  text: string
}

export interface AnalysisResult {
  title: string
  summary: {
    overview: string
    keyPoints: string[]
  }
  transcription: TranscriptionEntry[]
  verification: {
    factCheckReport: string
    verdict: 'accurate' | 'inaccurate' | 'partially accurate'
  }
  resources: {
    platform: string
    url: string
    relevance: string
  }[]
}

export interface HistoryItem {
  id: string
  url: string
  result: AnalysisResult
  createdAt: string
}

export interface ApiError {
  msg: string
}

export type ErrorKind =
  | 'overloaded'   // 503 — model / service under heavy load
  | 'rate_limited' // 429 — too many requests from this client
  | 'not_found'    // 404 — bad URL / resource missing
  | 'auth'         // 401/403 — session expired
  | 'network'      // no response at all
  | 'unknown'      // anything else

export interface AppError {
  kind: ErrorKind
  title: string
  detail: string
}
