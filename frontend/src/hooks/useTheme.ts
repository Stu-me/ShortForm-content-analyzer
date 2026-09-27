import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'sfca-theme'

function getInitial(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

/** Largest circle radius that covers the full viewport from point (x, y). */
function maxRadius(x: number, y: number): number {
  const w = window.innerWidth
  const h = window.innerHeight
  return Math.hypot(Math.max(x, w - x), Math.max(y, h - y))
}

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const t = getInitial()
    applyTheme(t)
    return t
  })

  // Keep data-theme attribute in sync whenever theme state changes
  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggle = (e?: React.MouseEvent) => {
    const x = e?.clientX ?? window.innerWidth / 2
    const y = e?.clientY ?? window.innerHeight / 2
    const r = maxRadius(x, y)
    const next: Theme = theme === 'dark' ? 'light' : 'dark'

    // No View Transition support — instant swap
    if (!document.startViewTransition) {
      setTheme(next)
      return
    }

    // startViewTransition captures the CURRENT page as the "old" snapshot,
    // then calls our callback to mutate the DOM into the "new" state.
    // We must NOT call applyTheme() here manually — setTheme triggers the
    // useEffect which calls applyTheme(), which is exactly what the API needs.
    const transition = document.startViewTransition(() => {
      setTheme(next)
    })

    // Once both snapshots are ready and the pseudo-elements exist, animate
    // the new snapshot expanding as a circle from the click origin.
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
