import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { GroupProvider } from './context/GroupContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { PublicOnlyRoute } from './components/PublicOnlyRoute'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { LeaderboardPage } from './pages/LeaderboardPage'
import { LogJourneyPage } from './pages/LogJourneyPage'
import { ProfilePage } from './pages/ProfilePage'
import { SharePage } from './pages/SharePage'
import { JoinPage } from './pages/JoinPage'

export default function App() {
  return (
    <AuthProvider>
      <GroupProvider>
        <HashRouter>
          <Routes>
            {/* Public — redirect to leaderboard if already logged in */}
            <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
            <Route path="/signup" element={<PublicOnlyRoute><SignupPage /></PublicOnlyRoute>} />

            {/* Works for both logged-in and logged-out visitors (e.g. a join-PIN QR code) */}
            <Route path="/join" element={<JoinPage />} />

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
      </GroupProvider>
    </AuthProvider>
  )
}
