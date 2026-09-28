import type { AnalysisResult } from '../types'

const VERDICT_STYLE: Record<string, React.CSSProperties> = {
  true: { color: '#22c55e', background: '#22c55e12', borderColor: '#22c55e25' },
  false: { color: '#ef4444', background: '#ef444412', borderColor: '#ef444425' },
  misleading: { color: '#eab308', background: '#eab30812', borderColor: '#eab30825' },
  unverified: { color: '#94a3b8', background: '#94a3b812', borderColor: '#94a3b825' },
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 20 }}>
    <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 12 }}>
      {title}
    </p>
    {children}
  </div>
)

export const ResultCard = ({ result }: { result: AnalysisResult }) => {
  const firstClaimVerdict = result.verification.claims[0]?.verdict ?? 'unverified'
  const vs = VERDICT_STYLE[firstClaimVerdict] ?? VERDICT_STYLE.unverified

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 24 }}>

      {/* Title */}
      <h2 style={{ fontSize: 16, fontWeight: 500, color: 'var(--accent)', lineHeight: 1.4, marginBottom: 4 }}>
        {result.title}
      </h2>

      {/* Overview */}
      <p style={{ fontSize: 13, color: 'var(--muted2)', lineHeight: 1.7 }}>
        {result.summary.overview}
      </p>

      <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 10 }}>
        {result.source.platform} · {result.source.contentType}
      </p>

      {/* Key points */}
      {result.summary.keyPoints.length > 0 && (
        <Section title="Key points">
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 6, listStyle: 'none' }}>
            {result.summary.keyPoints.map((p, i) => (
              <li key={i} style={{ display: 'flex', gap: 10, fontSize: 13, color: 'var(--text)' }}>
                <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 11, paddingTop: 2, flexShrink: 0 }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                {p}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Verification */}
      <Section title="Fact check">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 20, border: '1px solid', ...vs }}>
            {result.verification.overallVerdict}
          </span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--muted2)', lineHeight: 1.7 }}>
          {result.verification.factCheckReport}
        </p>
        {result.verification.claims.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {result.verification.claims.map((claim, i) => (
              <div key={i} style={{ padding: '10px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 20, border: '1px solid', ...VERDICT_STYLE[claim.verdict] }}>
                  {claim.verdict}
                </span>
                <p style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6, marginTop: 8 }}>{claim.claim}</p>
                <p style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.6, marginTop: 4 }}>{claim.explanation}</p>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Transcription */}
      {result.transcription.length > 0 && (
        <Section title="Transcript">
          <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {result.transcription.map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: 12 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', flexShrink: 0, paddingTop: 2 }}>
                  {t.timestamp}
                </span>
                <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{t.text}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Resources */}
      {result.resources.length > 0 && (
        <Section title="Sources">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {result.resources.map((r, i) => (
              <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, transition: 'border-color .15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border2)' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
              >
                <div>
                  <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>{r.title}</p>
                  <p style={{ fontSize: 11, color: 'var(--muted)' }}>{r.relevance}</p>
                </div>
                <span style={{ fontSize: 11, color: 'var(--muted)', flexShrink: 0 }}>↗</span>
              </a>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}
