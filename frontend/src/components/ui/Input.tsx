import { useState, type InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = ({ label, error, id, style, type, ...rest }: Props) => {
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'

  return (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    {label && (
      <label htmlFor={id} style={{ fontSize: 12, color: 'var(--muted2)', letterSpacing: '.02em' }}>
        {label}
      </label>
    )}
    <div style={{ position: 'relative' }}>
      <input
        id={id}
        type={isPassword && visible ? 'text' : type}
        style={{
          background: 'var(--surface)',
          border: `1px solid ${error ? '#ef444450' : 'var(--border)'}`,
          borderRadius: 6,
          padding: isPassword ? '0 58px 0 12px' : '0 12px',
          height: 38,
          fontSize: 13,
          color: 'var(--text)',
          outline: 'none',
          width: '100%',
          transition: 'border-color .15s',
          ...style,
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = error ? '#ef4444' : '#333' }}
        onBlur={(e) => { e.currentTarget.style.borderColor = error ? '#ef444450' : 'var(--border)' }}
        {...rest}
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          style={{
            position: 'absolute',
            top: 0,
            right: 8,
            height: '100%',
            border: 0,
            background: 'transparent',
            color: 'var(--muted2)',
            fontSize: 11,
            padding: '0 4px',
          }}
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      )}
    </div>
    {error && <span style={{ fontSize: 11, color: 'var(--red)' }}>{error}</span>}
  </div>
  )
}
