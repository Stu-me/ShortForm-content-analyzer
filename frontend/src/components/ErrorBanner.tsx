import type { AppError, ErrorKind } from '../types'

// ── per-kind config ─────────────────────────────────────────────────────────

interface KindMeta {
  icon: string
  accent: string        // CSS color for icon + title
  bg: string            // background
  border: string        // border
}

const KIND_META: Record<ErrorKind, KindMeta> = {
  overloaded: {
    icon: '⏳',
    accent: '#f59e0b',
    bg: 'rgba(245,158,11,0.07)',
    border: 'rgba(245,158,11,0.30)',
  },
  rate_limited: {
    icon: '🚦',
    accent: '#f59e0b',
    bg: 'rgba(245,158,11,0.07)',
    border: 'rgba(245,158,11,0.30)',
  },
  not_found: {
    icon: '🔍',
    accent: 'var(--accent)',
    bg: 'var(--accent-bg)',
    border: 'rgba(217,119,87,0.30)',
  },
  auth: {
    icon: '🔒',
    accent: 'var(--accent)',
    bg: 'var(--accent-bg)',
    border: 'rgba(217,119,87,0.30)',
  },
  network: {
    icon: '📡',
    accent: 'var(--red)',
    bg: 'var(--red-bg)',
    border: 'rgba(185,64,64,0.28)',
  },
  unknown: {
    icon: '⚠︎',
    accent: 'var(--red)',
    bg: 'var(--red-bg)',
    border: 'rgba(185,64,64,0.28)',
  },
}

// ── component ────────────────────────────────────────────────────────────────

interface Props {
  error: AppError
}

export const ErrorBanner = ({ error }: Props) => {
  const meta = KIND_META[error.kind]

  return (
    <div
      role="alert"
      style={{
        marginTop: 24,
        padding: '14px 18px',
        background: meta.bg,
        border: `1px solid ${meta.border}`,
        borderRadius: 10,
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start',
        animation: 'fadeIn .2s ease',
      }}
    >
      {/* Icon */}
      <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>
        {meta.icon}
      </span>

      {/* Text */}
      <div style={{ minWidth: 0 }}>
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: meta.accent,
            letterSpacing: '.05em',
            textTransform: 'uppercase',
            marginBottom: 4,
          }}
        >
          {error.title}
        </p>
        <p
          style={{
            fontSize: 13,
            color: 'var(--muted)',
            lineHeight: 1.6,
            wordBreak: 'break-word',
          }}
        >
          {error.detail}
        </p>
      </div>
    </div>
  )
}
