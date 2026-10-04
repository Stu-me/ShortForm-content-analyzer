import { useState } from 'react'
import { authApi } from '../api/auth'
import { ForgotPasswordSchema, ResetPasswordSchema } from '../validate/auth.validate'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { OtpVerificationForm } from './OtpVerificationForm'

type Step = 'email' | 'otp' | 'password'

interface Props {
  onComplete: () => void
  onBack: () => void
}

export const ForgotPasswordForm = ({ onComplete, onBack }: Props) => {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [loading, setLoading] = useState(false)

  const requestOtp = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setFieldError('')

    const result = ForgotPasswordSchema.safeParse({ email })
    if (!result.success) {
      setFieldError(result.error.issues[0]?.message ?? 'Enter a valid email.')
      return
    }

    setLoading(true)
    try {
      await authApi.requestPasswordReset(result.data)
      setStep('otp')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to send the verification code.')
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async (otp: string) => {
    setError('')
    setLoading(true)
    try {
      const result = await authApi.verifyPasswordResetOtp({ email, otp })
      // Keep the one-time reset token in component state instead of persisted auth state.
      setResetToken(result.resetToken)
      setStep('password')
    } catch (verificationError) {
      setError(verificationError instanceof Error ? verificationError.message : 'Unable to verify the code.')
    } finally {
      setLoading(false)
    }
  }

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setFieldError('')

    const result = ResetPasswordSchema.safeParse({ resetToken, newPassword })
    if (!result.success) {
      setFieldError(result.error.issues[0]?.message ?? 'Enter a valid new password.')
      return
    }

    setLoading(true)
    try {
      await authApi.resetPassword(result.data)
      onComplete()
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : 'Unable to reset the password.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'otp') {
    return (
      <OtpVerificationForm
        email={email}
        title="Check your email"
        description="Enter the code we sent to continue."
        submitLabel="Verify code"
        loading={loading}
        serverError={error}
        onSubmit={verifyOtp}
        onBack={() => setStep('email')}
      />
    )
  }

  if (step === 'password') {
    return (
      <div style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 18, fontWeight: 500, color: 'var(--accent)', marginBottom: 4 }}>Choose a new password</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>Your verification code was accepted.</p>
        </div>

        <form onSubmit={changePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input
            id="new-password"
            label="New password"
            type="password"
            value={newPassword}
            onChange={(event) => {
              setNewPassword(event.target.value)
              setFieldError('')
            }}
            error={fieldError}
            autoComplete="new-password"
            autoFocus
          />
          {error && (
            <p style={{ fontSize: 12, color: 'var(--red)', padding: '8px 12px', background: '#ef444410', borderRadius: 6, border: '1px solid #ef444420' }}>
              {error}
            </p>
          )}
          <Button type="submit" loading={loading} style={{ marginTop: 4, height: 40 }}>Reset password</Button>
        </form>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', maxWidth: 360 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 18, fontWeight: 500, color: 'var(--accent)', marginBottom: 4 }}>Forgot password?</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>We will email you a verification code.</p>
      </div>

      <form onSubmit={requestOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input
          id="recovery-email"
          label="Email"
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            setFieldError('')
          }}
          error={fieldError}
          autoComplete="email"
          autoFocus
        />
        {error && (
          <p style={{ fontSize: 12, color: 'var(--red)', padding: '8px 12px', background: '#ef444410', borderRadius: 6, border: '1px solid #ef444420' }}>
            {error}
          </p>
        )}
        <Button type="submit" loading={loading} style={{ marginTop: 4, height: 40 }}>Send code</Button>
        <Button type="button" variant="ghost" onClick={onBack} disabled={loading}>Back to sign in</Button>
      </form>
    </div>
  )
}
