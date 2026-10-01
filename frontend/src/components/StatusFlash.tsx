import { useEffect, useState } from 'react'

interface StatusFlashProps {
  /**
   * The HTTP status code returned from the latest request.
   * 200 = success, anything else = error/failure.
   */
  statusCode: number | null

  /**
   * How long the flash remains visible.
   * Keep it short so it feels like a crisp response pulse, not a full overlay.
   */
  durationMs?: number
}

/**
 * Full-screen response flash.
 *
 * This is intentionally a tiny, reusable UI primitive:
 * - it listens to a status code
 * - fades the entire viewport in red or green
 * - automatically clears itself after a short duration
 *
 * The component is decoupled from the request logic, which keeps it easier to
 * reuse anywhere else in the app.
 */
export const StatusFlash = ({ statusCode, durationMs = 700 }: StatusFlashProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const [activeStatus, setActiveStatus] = useState<number | null>(null)

  useEffect(() => {
    if (statusCode === null) {
      setIsVisible(false)
      return
    }

    setActiveStatus(statusCode)
    setIsVisible(true)

    const timeoutId = window.setTimeout(() => {
      setIsVisible(false)
    }, durationMs)

    return () => window.clearTimeout(timeoutId)
  }, [statusCode, durationMs])

  if (activeStatus === null || !isVisible) return null

  const isSuccess = activeStatus >= 200 && activeStatus < 300

  return (
    <div
      aria-hidden="true"
      className={`status-flash ${isSuccess ? 'success' : 'error'} ${isVisible ? 'visible' : ''}`}
    />
  )
}
