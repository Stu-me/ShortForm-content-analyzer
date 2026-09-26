import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'sfca-theme'

function getInitial(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function apply(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

/** Largest circle that covers the whole viewport from a given point. */
function maxRadius(x: number, y: number): number {
  const w = window.innerWidth
  const h = window.innerHeight
  return Math.hypot(Math.max(x, w - x), Math.max(y, h - y))
}

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const t = getInitial()
    apply(t)
    return t
  })

  useEffect(() => {
    apply(theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  /**
   * Pass the click MouseEvent so the ripple originates from the button.
   * Falls back gracefully when the View Transition API isn't available.
   */
  const toggle = (e?: React.MouseEvent) => {
    const x = e?.clientX ?? window.innerWidth / 2
    const y = e?.clientY ?? window.innerHeight / 2
    const r = maxRadius(x, y)

    const next: Theme = theme === 'dark' ? 'light' : 'dark'

    // View Transition API not supported — just swap instantly
    if (!document.startViewTransition) {
      setTheme(next)
      return
    }

    const transition = document.startViewTransition(() => {
      setTheme(next)
      apply(next)
    })

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${r}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 500,
          easing: 'ease-in-out',
          pseudoElement: '::view-transition-new(root)',
        },
      )
    })
  }

  return { theme, toggle }
}
