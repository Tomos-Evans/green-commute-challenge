import { useState, useEffect } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useGroup } from '../context/GroupContext'
import { Layout } from '../components/Layout'
import { joinGroupByPin } from '../lib/groups'

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f0e8] flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-[#1a2b5e] flex items-center justify-center text-white text-2xl mx-auto mb-3">
          🏆
        </div>
        <h1 className="text-2xl font-bold text-[#1a2b5e]">Green Commute Challenge</h1>
      </div>
      <div className="w-full max-w-md bg-white rounded-xl shadow-md overflow-hidden">
        <div className="h-1 bg-[#c8102e]" />
        <div className="p-8 text-center">{children}</div>
      </div>
    </div>
  )
}

function LoggedInJoin({ pin }: { pin: string }) {
  const { refreshGroups } = useGroup()
  const [status, setStatus] = useState<'joining' | 'success' | 'error'>('joining')
  const [groupName, setGroupName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    joinGroupByPin(pin)
      .then((group) => {
        setGroupName(group?.name ?? null)
        setStatus('success')
        return refreshGroups()
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Something went wrong.')
        setStatus('error')
      })
  }, [pin, refreshGroups])

  return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden text-center">
          <div className="p-8">
            {status === 'joining' && (
              <p className="text-gray-400">Joining group…</p>
            )}
            {status === 'success' && (
              <>
                <div className="text-4xl mb-4">🎉</div>
                <h2 className="text-xl font-semibold text-[#1a2b5e] mb-2">
                  You've joined {groupName ?? 'the group'}!
                </h2>
                <div className="flex gap-2 justify-center mt-4">
                  <Link
                    to="/leaderboard"
                    className="px-4 py-2 text-sm font-semibold text-white bg-[#1a2b5e] rounded-lg hover:bg-[#142248] transition-colors"
                  >
                    View leaderboard
                  </Link>
                  <Link
                    to="/profile"
                    className="px-4 py-2 text-sm font-semibold text-[#1a2b5e] border border-[#1a2b5e]/20 rounded-lg hover:bg-[#1a2b5e]/5 transition-colors"
                  >
                    View profile
                  </Link>
                </div>
              </>
            )}
            {status === 'error' && (
              <>
                <h2 className="text-xl font-semibold text-[#1a2b5e] mb-2">Couldn't join group</h2>
                <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2 inline-block">
                  {error}
                </p>
                <div className="mt-4">
                  <Link to="/profile" className="text-[#1a2b5e] font-semibold hover:underline text-sm">
                    Go to profile
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

function LoggedOutJoin({ pin }: { pin: string }) {
  return (
    <Card>
      <h2 className="text-xl font-semibold text-[#1a2b5e] mb-2">Join this group</h2>
      <p className="text-gray-500 text-sm mb-6">
        Create an account or log in to add this group to your profile.
      </p>
      <div className="flex flex-col gap-2">
        <Link
          to={`/signup?pin=${encodeURIComponent(pin)}`}
          className="w-full bg-[#1a2b5e] hover:bg-[#142248] text-white font-semibold py-2.5 rounded-lg transition-colors"
        >
          Create account
        </Link>
        <Link
          to={`/login?pin=${encodeURIComponent(pin)}`}
          className="w-full border border-[#1a2b5e]/20 text-[#1a2b5e] font-semibold py-2.5 rounded-lg hover:bg-[#1a2b5e]/5 transition-colors"
        >
          Log in
        </Link>
      </div>
    </Card>
  )
}

export function JoinPage() {
  const [searchParams] = useSearchParams()
  const { user, loading } = useAuth()
  const pin = searchParams.get('pin')

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f0e8] flex items-center justify-center">
        <div className="text-[#1a2b5e] text-lg">Loading…</div>
      </div>
    )
  }

  if (!pin) {
    return <Navigate to={user ? '/leaderboard' : '/login'} replace />
  }

  return user ? <LoggedInJoin pin={pin} /> : <LoggedOutJoin pin={pin} />
}
