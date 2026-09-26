
import { useState } from 'react'
import { analyseApi } from '../api/analyse'
import type { AnalysisResult, AppError } from '../types'

function isAppError(err: unknown): err is AppError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'kind' in err &&
    'title' in err &&
    'detail' in err
  )
}

export const useAnalyse = () => {
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AppError | null>(null)

  const analyse = async (url: string) => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await analyseApi.analyse(url)
      setResult(data)
    } catch (err) {
      if (isAppError(err)) {
        setError(err)
      } else {
        // Fallback for anything that slips past the interceptor
        setError({
          kind: 'unknown',
          title: 'Something went wrong',
          detail: err instanceof Error ? err.message : 'An unexpected error occurred.',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return { result, loading, error, analyse, reset: () => setResult(null) }
}