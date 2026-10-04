// import { AuthForm } from '../components/AuthForm'
// import logo from "../assets/logo.png"

// export const AuthPage = () => (
//   <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
//     <div style={{ width: '100%', maxWidth: 360 }}>
//       <div style={{ marginBottom: 40, textAlign: 'center' }}>
//         <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
//           {/* <span style={{ fontSize: 20 }}>◈</span> */}
//           <img style={{ width: 50 }} src={logo} alt="logo" />
//           <span style={{ fontSize: 30, fontWeight: 500, color: 'var(--accent)', letterSpacing: '-.02em' }}>ShortForm Content Analyzer</span>
//         </div>
//       </div>
//       <AuthForm />
//     </div>
//   </div>
// )


import { useState } from 'react'
import { AuthForm } from '../components/AuthForm'
import { ForgotPasswordForm } from '../components/ForgotPasswordForm'
import { OtpVerificationForm } from '../components/OtpVerificationForm'
import { useAuthStore } from '../store/auth.store'
import logo from "../assets/logo.png"

type AuthFlow = 'credentials' | 'registration-otp' | 'forgot-password'

export const AuthPage = () => {
  const [flow, setFlow] = useState<AuthFlow>('credentials')
  const [registrationEmail, setRegistrationEmail] = useState('')
  const verifyRegistrationOtp = useAuthStore((state) => state.verifyRegistrationOtp)
  const reason = new URLSearchParams(window.location.search).get('reason')
  const sessionExpired = reason === 'session_expired'

  // The page coordinates the temporary auth stages while the store remains focused on session state.
  const content = flow === 'credentials' ? (
    <AuthForm
      onSignUpRequested={(email) => {
        setRegistrationEmail(email)
        setFlow('registration-otp')
      }}
      onForgotPassword={() => setFlow('forgot-password')}
    />
  ) : flow === 'registration-otp' ? (
    <OtpVerificationForm
      email={registrationEmail}
      title="Verify your email"
      description="Enter the code we sent to complete registration."
      submitLabel="Complete registration"
      onSubmit={(otp) => verifyRegistrationOtp({ email: registrationEmail, otp })}
      onBack={() => setFlow('credentials')}
    />
  ) : (
    <ForgotPasswordForm
      onComplete={() => setFlow('credentials')}
      onBack={() => setFlow('credentials')}
    />
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 360 }}>

        {/* Session expired banner */}
        {sessionExpired && (
          <div style={{
            marginBottom: 20,
            padding: '10px 14px',
            background: '#f59e0b18',
            border: '1px solid #f59e0b40',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span style={{ fontSize: 15 }}>⏱</span>
            <p style={{ fontSize: 13, color: '#f59e0b', margin: 0 }}>
              Your session expired. Please sign in again.
            </p>
          </div>
        )}

        <div style={{ marginBottom: 40, textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <img style={{ width: 50 }} src={logo} alt="logo" />
            <span style={{ fontSize: 24, fontWeight: 500, color: 'var(--accent)', letterSpacing: '-.02em' }}>ShortForm Content Analyzer</span>
          </div>
        </div>
        {content}
      </div>
    </div>
  )
}