import { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { PublicOnlyRoute } from './components/PublicOnlyRoute'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { LeaderboardPage } from './pages/LeaderboardPage'
import { LogJourneyPage } from './pages/LogJourneyPage'
import { ProfilePage } from './pages/ProfilePage'
import { SharePage } from './pages/SharePage'

// Supabase delivers the recovery token as a URL fragment once auth.ts has
// parsed and stored it. Force a redirect here rather than via a route match,
// since HashRouter has already consumed/cleared that fragment by then.
function PasswordRecoveryRedirect() {
  const { passwordRecovery } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (passwordRecovery && location.pathname !== '/reset-password') {
      navigate('/reset-password', { replace: true })
    }
  }, [passwordRecovery, location.pathname, navigate])

  return null
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <PasswordRecoveryRedirect />
        <Routes>
          {/* Public — redirect to leaderboard if already logged in */}
          <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
          <Route path="/signup" element={<PublicOnlyRoute><SignupPage /></PublicOnlyRoute>} />
          <Route
            path="/forgot-password"
            element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>}
          />
          {/* Not PublicOnlyRoute — Supabase signs the user in during recovery */}
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected */}
          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <LeaderboardPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/log"
            element={
              <ProtectedRoute>
                <Layout>
                  <LogJourneyPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout>
                  <ProfilePage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/share"
            element={
              <ProtectedRoute>
                <Layout>
                  <SharePage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Default */}
          <Route path="*" element={<Navigate to="/leaderboard" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  )
}
