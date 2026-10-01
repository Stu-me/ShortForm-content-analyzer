// import axios from "axios"

// export const api = axios.create({
//   baseURL: 'https://kb-api.flashhub.net/api',
//   withCredentials: true, // must be true for cookies
// })

// let refreshTimeout: ReturnType<typeof setTimeout>

// function scheduleRefresh() {
//   clearTimeout(refreshTimeout)
//   // refresh 1 min before 15min expiry
//   refreshTimeout = setTimeout(async () => {
//     try {
//       await api.post("/auth/refresh")
//       scheduleRefresh() // schedule next refresh
//     } catch {
//       window.location.href = "/auth" // token expired, force login
//     }
//   }, 14 * 60 * 1000) //  14 minutes
// }

// // Start scheduling after login
// export function startTokenRefresh() {
//   scheduleRefresh()
// }


// api.interceptors.response.use(null, async (error) => {
//   const originalRequest = error.config

//   if (error.response?.status === 401 && !originalRequest._retry) {
//     originalRequest._retry = true  // ← prevents infinite loop
//     try {
//       await api.post("/auth/refresh")
//       return api(originalRequest)
//     } catch {
//       // refresh failed, redirect to login
//       window.location.href = '/#/auth'
//       return Promise.reject(error)
//     }
//   }

//   return Promise.reject(error)
// })

import axios from "axios"

export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  withCredentials: true,
})


import type { AppError, ErrorKind } from '../types'

function buildAppError(error: unknown): AppError {
  // No response at all — network / CORS / server down
  if (!isAxiosError(error) || !error.response) {
    return {
      kind: 'network',
      title: 'Cannot reach the server',
      detail: 'Check your internet connection or try again in a moment.',
      status: 0,
    }
  }

  const status = error.response.status
  const data = error.response.data as Record<string, unknown> | null | undefined
  const nestedError = data?.error as Record<string, unknown> | undefined
  const serverMessage: string | undefined =
    (typeof nestedError?.message === 'string' ? nestedError.message : undefined) ??
    (typeof data?.message === 'string' ? data.message as string : undefined) ??
    (typeof data?.msg === 'string' ? data.msg as string : undefined)

  // Map status codes → ErrorKind + user-friendly copy
  const map: Record<number, { kind: ErrorKind; title: string; detail: string }> = {
    429: {
      kind: 'rate_limited',
      title: 'Too many requests',
      detail: 'You\'ve hit the rate limit. Wait a minute before trying again.',
    },
    503: {
      kind: 'overloaded',
      title: 'Service is under high demand',
      detail: serverMessage ?? 'The AI model is temporarily overwhelmed. Spikes are usually short — please try again in a few seconds.',
    },
    502: {
      kind: 'overloaded',
      title: 'Service temporarily unavailable',
      detail: serverMessage ?? 'The server returned a bad gateway. This is usually temporary.',
    },
    404: {
      kind: 'not_found',
      title: 'Content not found',
      detail: serverMessage ?? 'The URL you submitted couldn\'t be found or isn\'t supported yet.',
    },
    401: {
      kind: 'auth',
      title: 'Session expired',
      detail: 'You\'ve been signed out. Please log in again.',
    },
    403: {
      kind: 'auth',
      title: 'Access denied',
      detail: serverMessage ?? 'You don\'t have permission to perform this action.',
    },
  }

  const matched = map[status]
  if (matched) {
    return {
      ...matched,
      status,
    }
  }

  // 5xx catchall
  if (status >= 500) {
    return {
      kind: 'unknown',
      title: `Server error (${status})`,
      detail: serverMessage ?? 'Something went wrong on our end. Please try again shortly.',
      status,
    }
  }

  // 4xx catchall
  return {
    kind: 'unknown',
    title: `Request error (${status})`,
    detail: serverMessage ?? 'The request could not be completed. Check the URL and try again.',
    status,
  }
}

function isAxiosError(err: unknown): err is import('axios').AxiosError {
  return typeof err === 'object' && err !== null && (err as Record<string, unknown>).isAxiosError === true
}

api.interceptors.response.use(null, (error) => {
  if (isAxiosError(error) && error.response?.status === 401) {
    window.location.href = '/auth'
  }
  return Promise.reject(buildAppError(error))
})


// let refreshTimeout: ReturnType<typeof setTimeout>

// function scheduleRefresh() {
//   clearTimeout(refreshTimeout)
//   refreshTimeout = setTimeout(async () => {
//     try {
//       await api.post("/auth/refresh")
//       scheduleRefresh()
//     } catch {
//       window.location.href = '/auth'
//     }
//   }, 14 * 60 * 1000)
// }

// export function startTokenRefresh() {
//   scheduleRefresh()
// }

// ✅ Fixed interceptor — skip refresh routes to prevent loop
// api.interceptors.response.use(null, async (error) => {
//   const originalRequest = error.config

//   // Never retry refresh or auth routes — would cause infinite loop
//   const isAuthRoute = originalRequest.url?.includes('/auth/')

//   if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
//     originalRequest._retry = true
//     try {
//       await api.post("/auth/refresh")
//       scheduleRefresh() // restart the timer after successful refresh
//       return api(originalRequest)
//     } catch {
//       window.location.href = '/auth'
//       return Promise.reject(error)
//     }
//   }

//   return Promise.reject(error)
// })

