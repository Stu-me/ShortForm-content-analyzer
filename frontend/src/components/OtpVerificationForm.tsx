import { useState } from 'react'
import { OtpSchema } from '../validate/auth.validate'
import { Button } from './ui/Button'
import { Input } from './ui/Input'

interface Props {
  email: string
  title: string
  description: string
  submitLabel: string
  loading?: boolean
  serverError?: string
  onSubmit: (otp: string) => Promise<void>
  onBack: () => void
}

export const OtpVerificationForm = ({
  email,
  title,
  description,
  submitLabel,
  loading = false,
  serverError,
  onSubmit,
  onBack,
}: Props) => {
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    const result = OtpSchema.shape.otp.safeParse(otp)
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Enter the six-digit code.')
      return
    }

    try {
      await onSubmit(result.data)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to verify the code.')
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: 360 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 18, fontWeight: 500, color: 'var(--accent)', marginBottom: 4 }}>{title}</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>{description}</p>
        <p style={{ fontSize: 12, color: 'var(--muted2)', marginTop: 10 }}>{email}</p>
      </div>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input
          id="otp"
          label="Verification code"
          value={otp}
          onChange={(event) => {
            setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))
            setError('')
          }}
          error={error}
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
        />

        {(serverError || error) && !error && (
          <p style={{ fontSize: 12, color: 'var(--red)', padding: '8px 12px', background: '#ef444410', borderRadius: 6, border: '1px solid #ef444420' }}>
            {serverError}
          </p>
        )}

        <Button type="submit" loading={loading} style={{ marginTop: 4, height: 40 }}>
          {submitLabel}
        </Button>
        <Button type="button" variant="ghost" onClick={onBack} disabled={loading}>
          Back
        </Button>
      </form>
    </div>
  )
}
