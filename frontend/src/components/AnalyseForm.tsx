import { useState } from 'react'
import { UrlSchema } from '../validate/auth.validate'
import { Button } from './ui/Button'

import tiktokLogo    from '../assets/tiktok.png'
import instaLogo     from '../assets/insta.jpeg'
import youtubeLogo   from '../assets/youtubelogo.jpg'
import facebookLogo  from '../assets/facebook.png'
import snapchatLogo  from '../assets/snapchat.jpeg'
import redditLogo    from '../assets/reddit.png'
import pinterestLogo from '../assets/pinterest.webp'
import xLogo         from '../assets/x.png'
import tiktokMeme    from '../assets/tiktokMeme.png'

// ── Platform definitions ─────────────────────────────────────────────────────

interface Platform {
  id: PlatformId
  label: string
  logo: string | null   // image import — null = icon fallback (YouTube)
  icon: string          // fallback text icon
  color: string
  placeholder: string
  stars: number
  note: string
}

type PlatformId = 'tiktok' | 'instagram' | 'youtube' | 'snapchat' | 'facebook' | 'x' | 'reddit' | 'pinterest'

const PLATFORM_HOSTS: Record<PlatformId, string[]> = {
  tiktok: ['tiktok.com', 'vm.tiktok.com'],
  instagram: ['instagram.com'],
  youtube: ['youtube.com', 'youtu.be'],
  snapchat: ['snapchat.com'],
  facebook: ['facebook.com', 'fb.watch'],
  x: ['x.com', 'twitter.com'],
  reddit: ['reddit.com', 'v.redd.it'],
  pinterest: ['pinterest.com', 'pin.it'],
}

const PLATFORMS: Platform[] = [
  {
    id: 'tiktok',
    label: 'TikTok',
    logo: tiktokLogo,
    icon: '♪',
    color: '#69C9D0',
    placeholder: 'Paste a TikTok URL…',
    stars: 5,
    note: 'Short video',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    logo: instaLogo,
    icon: '◈',
    color: '#E1306C',
    placeholder: 'Paste an Instagram Reel URL…',
    stars: 5,
    note: 'Reels & Stories',
  },
  {
    id: 'youtube',
    label: 'YouTube',
    logo: youtubeLogo,
    icon: '▶',
    color: '#FF0000',
    placeholder: 'Paste a YouTube Short URL…',
    stars: 5,
    note: 'Shorts & Videos',
  },
  {
    id: 'snapchat',
    label: 'Snapchat',
    logo: snapchatLogo,
    icon: '👻',
    color: '#FFFC00',
    placeholder: 'Paste a Snapchat Spotlight URL…',
    stars: 4,
    note: 'Stories & Spotlight',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    logo: facebookLogo,
    icon: 'f',
    color: '#1877F2',
    placeholder: 'Paste a Facebook Reel URL…',
    stars: 4,
    note: 'Reels & Feed',
  },
  {
    id: 'x',
    label: 'X',
    logo: xLogo,
    icon: '✕',
    color: '#E7E9EA',
    placeholder: 'Paste an X (Twitter) video URL…',
    stars: 3,
    note: 'Posts & Videos',
  },
  {
    id: 'reddit',
    label: 'Reddit',
    logo: redditLogo,
    icon: '⬆',
    color: '#FF4500',
    placeholder: 'Paste a Reddit video URL…',
    stars: 2,
    note: 'Posts & Videos',
  },
  {
    id: 'pinterest',
    label: 'Pinterest',
    logo: pinterestLogo,
    icon: '⊕',
    color: '#E60023',
    placeholder: 'Paste a Pinterest video URL…',
    stars: 3,
    note: 'Short Video',
  },
]

// ── Stars helper ─────────────────────────────────────────────────────────────

const Stars = ({ count, color }: { count: number; color: string }) => (
  <span style={{ fontSize: 9, letterSpacing: 1.5 }}>
    {Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{ color: i < count ? color : 'var(--border2)', transition: 'color .15s' }}>
        ★
      </span>
    ))}
  </span>
)

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  onSubmit: (url: string, platform: PlatformId) => void
  loading: boolean
}

export const AnalyseForm = ({ onSubmit, loading }: Props) => {
  const [url, setUrl]                     = useState('')
  const [error, setError]                 = useState('')
  const [activePlatform, setActivePlatform] = useState<Platform>(PLATFORMS[1]) // Instagram default
  const [marqueeOffset, setMarqueeOffset] = useState(0)
  const [showTiktokMeme, setShowTiktokMeme] = useState(false)

  // Duplicate the list so the marquee can loop without a visible jump when the user
  // navigates left/right with the arrow controls.
  const marqueePlatforms = [...PLATFORMS, ...PLATFORMS]

  // We move by roughly one card at a time so the motion feels deliberate and not chaotic.
  const MARQUEE_STEP = 210

  const moveMarquee = (direction: 'left' | 'right', event?: React.MouseEvent<HTMLButtonElement>) => {
    event?.preventDefault()
    event?.stopPropagation()

    const step = direction === 'left' ? -MARQUEE_STEP : MARQUEE_STEP
    const maxOffset = MARQUEE_STEP * (marqueePlatforms.length / 2)

    setMarqueeOffset((current) => {
      const next = current + step

      // Wrap the movement so the track stays continuous and never drifts out of bounds.
      if (next < 0) return maxOffset
      if (next > maxOffset) return 0
      return next
    })
  }

  const handleMoveLeft = (event: React.MouseEvent<HTMLButtonElement>) => {
    moveMarquee('left', event)
  }

  const handleMoveRight = (event: React.MouseEvent<HTMLButtonElement>) => {
    moveMarquee('right', event)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const parse = UrlSchema.safeParse({ url })
    if (!parse.success) { setError(parse.error.issues[0].message); return }

    const hostname = new URL(parse.data.url).hostname.replace(/^www\./, '')
    const matchesSelection = PLATFORM_HOSTS[activePlatform.id].some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
    )
    if (!matchesSelection) {
      setError(`This URL is not a ${activePlatform.label} link. Select the matching platform.`)
      return
    }

    setError('')
    onSubmit(parse.data.url, activePlatform.id)
  }

  return (
    <div>
      {/* ── URL input ── */}
      <form onSubmit={submit}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <input
              value={url}
              onChange={(e) => { setUrl(e.target.value); setError('') }}
              placeholder={activePlatform.placeholder}
              disabled={loading}
              style={{
                width: '100%',
                background: 'var(--surface)',
                border: `1px solid ${error ? '#ef444450' : 'var(--border)'}`,
                borderRadius: 8,
                padding: '0 16px',
                height: 46,
                fontSize: 13,
                color: 'var(--text)',
                outline: 'none',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '-.01em',
                transition: 'border-color .2s',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = error ? '#ef4444' : activePlatform.color + '90' }}
              onBlur={(e)  => { e.currentTarget.style.borderColor = error ? '#ef444450' : 'var(--border)' }}
            />
            {error && <p style={{ fontSize: 11, color: 'var(--red)', marginTop: 6 }}>{error}</p>}
          </div>
          <Button type="submit" loading={loading} style={{ height: 46, padding: '0 20px' }}>
            Analyse
          </Button>
        </div>
      </form>

      {/* ── Platform marquee ── */}
      <div style={{ marginTop: 24 }}>
        <p style={{
          fontSize:20,
          color: 'var(--muted)',
          letterSpacing: '.09em',
          textTransform: 'uppercase',
          fontWeight: 600,
          marginBottom: 18,
        }}>
          Select platforms to analyze
        </p>

        {/* The controls are placed inside the same carousel panel so the user can nudge the
            moving platform cards from the left and right edges, without creating a separate UI block. */}
        <div style={{ position: 'relative', width: '100%' }}>
          <button
            type="button"
            aria-label="Scroll platforms left"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleMoveLeft}
            style={{
              position: 'absolute',
              left: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 2,
              width: 30,
              height: 30,
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.04)',
              color: 'var(--muted)',
              fontSize: 18,
              lineHeight: 1,
              cursor: 'pointer',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
              transition: 'background .18s ease, border-color .18s ease, color .18s ease',
            }}
          >
            ‹
          </button>

          {/* The track is duplicated so the marquee can loop smoothly without a visible jump. */}
          <div className="platform-marquee" style={{ overflow: 'hidden', width: '100%', borderRadius: 12, paddingLeft: 48, paddingRight: 48 }}>
            <div
              className="platform-marquee-track"
              style={{
                display: 'flex',
                gap: 10,
                width: 'max-content',
                alignItems: 'stretch',
                transform: `translateX(-${marqueeOffset}px)`,
                transition: 'transform 0.45s ease',
              }}
            >
              {marqueePlatforms.map((p, index) => {
                const isActive = activePlatform.id === p.id
                return (
                  <button
                    key={`${p.id}-${index}`}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setActivePlatform(p)
                      setError('')
                      if (p.id === 'tiktok') setShowTiktokMeme(true)
                    }}
                    type="button"
                    className="platform-marquee-card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: '14px 14px 12px',
                      background: isActive
                        ? `${p.color}20`
                        : 'rgba(255,255,255,0.04)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      border: `1.5px solid ${isActive ? p.color + 'aa' : 'rgba(255,255,255,0.10)'}`,
                      borderRadius: 12,
                      boxShadow: isActive
                        ? `0 4px 20px ${p.color}22, inset 0 1px 0 rgba(255,255,255,0.12)`
                        : '0 2px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.06)',
                      cursor: 'pointer',
                      transition: 'border-color .18s ease, background .18s ease, box-shadow .18s ease, transform .18s ease, filter .18s ease',
                      outline: 'none',
                      textAlign: 'left',
                      width: 200,
                      minWidth: 200,
                      height: '100%',
                      justifyContent: 'flex-start',
                      transform: 'translateY(0)',
                      filter: isActive ? 'saturate(1.05)' : 'saturate(0.9)',
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = p.color + 'cc'
                      e.currentTarget.style.background   = `${p.color}18`
                      e.currentTarget.style.transform    = 'translateY(-3px)'
                      e.currentTarget.style.boxShadow    = `0 10px 22px ${p.color}26, inset 0 1px 0 rgba(255,255,255,0.12)`
                      e.currentTarget.style.filter       = 'saturate(1.2)'
                    }}
                    onMouseLeave={(e) => {
                      if (isActive) {
                        e.currentTarget.style.borderColor = p.color + 'aa'
                        e.currentTarget.style.background   = `${p.color}20`
                        e.currentTarget.style.transform    = 'translateY(0)'
                        e.currentTarget.style.boxShadow    = `0 4px 20px ${p.color}22, inset 0 1px 0 rgba(255,255,255,0.12)`
                        e.currentTarget.style.filter       = 'saturate(1.05)'
                        return
                      }

                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'
                      e.currentTarget.style.background   = 'rgba(255,255,255,0.04)'
                      e.currentTarget.style.transform    = 'translateY(0)'
                      e.currentTarget.style.boxShadow    = '0 2px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.06)'
                      e.currentTarget.style.filter       = 'saturate(0.9)'
                    }}
                  >
                    {/* Logo / icon */}
                    {p.logo ? (
                      <img
                        src={p.logo}
                        alt={p.label}
                        style={{
                          width: 150,
                          height: 120,
                          borderRadius: 8,
                          objectFit: 'cover',
                          filter: isActive ? 'none' : 'grayscale(30%)',
                          transition: 'filter .15s',
                          flexShrink: 0,
                        }}
                      />
                    ) : null}

                    {/* Text block */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0, width: '100%' }}>
                      <span style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: isActive ? 'var(--text)' : 'var(--muted)',
                        transition: 'color .15s',
                        letterSpacing: '.01em',
                      }}>
                        {p.label}
                      </span>
                      <span style={{
                        fontSize: 10,
                        color: 'var(--muted)',
                        lineHeight: 1.3,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {p.note}
                      </span>
                      <Stars count={p.stars} color={isActive ? p.color : 'var(--muted2)'} />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <button
            type="button"
            aria-label="Scroll platforms right"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleMoveRight}
            style={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 2,
              width: 30,
              height: 30,
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.04)',
              color: 'var(--muted)',
              fontSize: 18,
              lineHeight: 1,
              cursor: 'pointer',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
              transition: 'background .18s ease, border-color .18s ease, color .18s ease',
            }}
          >
            ›
          </button>
        </div>
      </div>

      {showTiktokMeme && (
        <div
          className="tiktok-meme-overlay"
          role="presentation"
          onClick={() => setShowTiktokMeme(false)}
        >
          <div
            className="tiktok-meme-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="TikTok meme"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close TikTok meme"
              className="tiktok-meme-close"
              onClick={() => setShowTiktokMeme(false)}
            >
              ×
            </button>
            <img src={tiktokMeme} alt="TikTok meme" />
          </div>
        </div>
      )}
    </div>
  )
}
