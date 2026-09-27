// import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
// import { useAuthStore } from './store/auth.store'
// import { AuthPage } from './pages/AuthPage'
// import { HomePage } from './pages/HomePage'

// const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
//   const isAuth = useAuthStore((s) => s.isAuth)
//   return isAuth ? <>{children}</> : <Navigate to="/auth" replace />
// }

// const PublicRoute = ({ children }: { children: React.ReactNode }) => {
//   const isAuth = useAuthStore((s) => s.isAuth)
//   return isAuth ? <Navigate to="/" replace /> : <>{children}</>
// }

// export const App = () => (
//   <HashRouter>
//     <Routes>
//       <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />
//       <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
//       <Route path="*" element={<Navigate to="/" replace />} />
//     </Routes>
//   </HashRouter>
// )



import { useEffect, useState } from 'react'
import { useAuthStore } from './store/auth.store'
import { api } from './api/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthPage } from './pages/AuthPage'
import { BufferingPage } from './pages/BufferingPage'
import { HomePage } from './pages/HomePage'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuth = useAuthStore((s) => s.isAuth)
  return isAuth ? <>{children}</> : <Navigate to="/auth" replace />
}

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuth = useAuthStore((s) => s.isAuth)
  return isAuth ? <Navigate to="/" replace /> : <>{children}</>
}


export const App = () => {
  const [serverReady, setServerReady] = useState(false)

  useEffect(() => {
    let active = true
    let retryTimer: ReturnType<typeof setTimeout>

    const checkServer = async () => {
      try {
        await api.get('/health')
        if (active) setServerReady(true)
      } catch {
        if (active) retryTimer = setTimeout(checkServer, 2000)
      }
    }

    checkServer()
    return () => {
      active = false
      clearTimeout(retryTimer)
    }
  }, [])

  if (!serverReady) return <BufferingPage />

  return < BrowserRouter >
    <Routes>
      <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter >
}