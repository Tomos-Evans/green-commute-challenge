import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f0e8] flex items-center justify-center">
        <div className="text-[#1a2b5e] text-lg">Loading…</div>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/leaderboard" replace />
  }

  return <>{children}</>
}
