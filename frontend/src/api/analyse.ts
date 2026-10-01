import { api } from './client'
import type { AnalysisResult } from '../types'

export const analyseApi = {
  analyse: async (url: string, platform: string) => {
    const res = await api.post<{ success: boolean; data: AnalysisResult }>('/analyze', { url, platform })
    return res.data.data
  },
}
