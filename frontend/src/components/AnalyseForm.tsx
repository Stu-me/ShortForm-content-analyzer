import { useState } from 'react'
import { UrlSchema } from '../validate/auth.validate'
import { Button } from './ui/Button'

import tiktokLogo    from '../assets/tiktok.png'
import instaLogo     from '../assets/insta.jpeg'
import youtubeLogo   from '../assets/youtubelogo.jpeg'
import facebookLogo  from '../assets/facebook.png'
import snapchatLogo  from '../assets/snapchat.jpeg'
import redditLogo    from '../assets/reddit.png'
import pinterestLogo from '../assets/pinterest.png'
import xLogo         from '../assets/x.png'

// ── Platform definitions ─────────────────────────────────────────────────────

interface Platform {
  id: string
  label: string
  logo: string | null   // image import — null = icon fallback (YouTube)
  icon: string          // fallback text icon
  color: string
  placeholder: string
  stars: number
  note: string
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
  onSubmit: (url: string) => void
  loading: boolean
}

export const AnalyseForm = ({ onSubmit, loading }: Props) => {
  const [url, setUrl]                     = useState('')
  const [error, setError]                 = useState('')
  const [activePlatform, setActivePlatform] = useState<Platform>(PLATFORMS[1]) // Instagram default

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const parse = UrlSchema.safeParse({ url })
    if (!parse.success) { setError(parse.error.issues[0].message); return }
    setError('')
    onSubmit(parse.data.url)
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

      {/* ── Platform grid ── */}
      <div style={{ marginTop: 24 }}>
        <p style={{
          fontSize: 10,
          color: 'var(--muted)',
          letterSpacing: '.09em',
          textTransform: 'uppercase',
          fontWeight: 600,
          marginBottom: 12,
        }}>
          Supported platforms
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: 10,
        }}>
          {PLATFORMS.map((p) => {
            const isActive = activePlatform.id === p.id
            return (
              <button
                key={p.id}
                onClick={() => { setActivePlatform(p); setError('') }}
                type="button"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '14px 14px 12px',
                  /* glassmorphism */
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
                  transition: 'border-color .18s, background .18s, box-shadow .18s, transform .12s',
                  outline: 'none',
                  textAlign: 'left',
                  width: '100%',
                }}
                onMouseEnter={(e) => {
                  if (isActive) return
                  e.currentTarget.style.borderColor = p.color + '60'
                  e.currentTarget.style.background   = `${p.color}12`
                  e.currentTarget.style.transform    = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow    = `0 6px 16px ${p.color}18, inset 0 1px 0 rgba(255,255,255,0.10)`
                }}
                onMouseLeave={(e) => {
                  if (isActive) return
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'
                  e.currentTarget.style.background   = 'rgba(255,255,255,0.04)'
                  e.currentTarget.style.transform    = 'translateY(0)'
                  e.currentTarget.style.boxShadow    = '0 2px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.06)'
                }}
              >
                {/* Logo / icon */}
                {p.logo ? (
                  <img
                    src={p.logo}
                    alt={p.label}
                    style={{
                      width: 32,
                      height: 32,
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

          {/* Coming soon card */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 10,
              padding: '14px 14px 12px',
              background: 'rgba(255,255,255,0.02)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1.5px dashed rgba(255,255,255,0.12)',
              borderRadius: 12,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
              width: '100%',
              cursor: 'default',
            }}
          >
            {/* Animated dots icon */}
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(255,255,255,0.06)',
              border: '1.5px dashed rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              flexShrink: 0,
            }}>
              ✦
            </div>

            {/* Text */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--muted)',
                letterSpacing: '.01em',
              }}>
                More coming
              </span>
              <span style={{
                fontSize: 10,
                color: 'var(--muted)',
                lineHeight: 1.4,
              }}>
                Fighting doom scroll,<br />one platform at a time
              </span>
              <span style={{
                fontSize: 9,
                color: 'var(--accent)',
                fontWeight: 600,
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                marginTop: 2,
              }}>
                Stay tuned ↗
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
