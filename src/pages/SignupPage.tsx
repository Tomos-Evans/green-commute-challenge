import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useGroup } from '../context/GroupContext'
import { joinGroupByPin } from '../lib/groups'
import type { TransportMode } from '../types/database'

export function SignupPage() {
  const [searchParams] = useSearchParams()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [normalModeId, setNormalModeId] = useState<string>('')
  const [groupPin, setGroupPin] = useState(searchParams.get('pin') ?? '')
  const [groupJoinWarning, setGroupJoinWarning] = useState<string | null>(null)
  const [modes, setModes] = useState<TransportMode[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checkEmail, setCheckEmail] = useState(false)
  const { refreshProfile } = useAuth()
  const { refreshGroups } = useGroup()
  const navigate = useNavigate()

  useEffect(() => {
    supabase
      .from('transport_modes')
      .select('*')
      .order('points_per_mile', { ascending: false })
      .then(({ data }) => {
        const modes = data as TransportMode[] | null
        if (modes) {
          setModes(modes)
          setNormalModeId(modes[0]?.id ?? '')
        }
      })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const trimmedName = displayName.trim()
    if (!trimmedName) {
      setError('Please enter a display name.')
      return
    }
    if (trimmedName.length < 2 || trimmedName.length > 32) {
      setError('Display name must be between 2 and 32 characters.')
      return
    }

    setLoading(true)

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })
      if (authError) throw authError

      if (!authData.session) {
        // Email confirmation required — can't create profile yet
        setCheckEmail(true)
        setLoading(false)
        return
      }

      // 2. Assign discriminator
      const { data: disc, error: rpcError } = await supabase.rpc(
        'get_next_discriminator',
        { base_name: trimmedName },
      )
      if (rpcError) throw rpcError

      // 3. Insert profile
      const { error: profileError } = await supabase.from('profiles').insert([
        {
          id: authData.user!.id,
          display_name: trimmedName,
          discriminator: disc as number,
          normal_commute_mode_id: normalModeId || null,
        },
      ])
      if (profileError) throw profileError

      const trimmedPin = groupPin.trim()
      let joinWarning: string | null = null
      if (trimmedPin) {
        try {
          await joinGroupByPin(trimmedPin)
          await refreshGroups()
        } catch {
          joinWarning = "Couldn't join with that PIN — you can try again from your profile."
        }
      }

      await refreshProfile(authData.user!.id)

      if (joinWarning) {
        setGroupJoinWarning(joinWarning)
        setLoading(false)
      } else {
        navigate('/leaderboard')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setLoading(false)
    }
  }

  if (groupJoinWarning) {
    return (
      <div className="min-h-screen bg-[#f5f0e8] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-md overflow-hidden text-center">
          <div className="h-1 bg-[#c8102e]" />
          <div className="p-8">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-[#1a2b5e] mb-2">Account created</h2>
            <p className="text-amber-700 text-sm bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
              {groupJoinWarning}
            </p>
            <button
              onClick={() => navigate('/leaderboard')}
              className="w-full bg-[#1a2b5e] hover:bg-[#142248] text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (checkEmail) {
    return (
      <div className="min-h-screen bg-[#f5f0e8] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-md overflow-hidden text-center">
          <div className="h-1 bg-[#c8102e]" />
          <div className="p-8">
            <div className="text-4xl mb-4">📬</div>
            <h2 className="text-xl font-semibold text-[#1a2b5e] mb-2">Check your email</h2>
            <p className="text-gray-500 text-sm">
              We've sent a confirmation link to <strong>{email}</strong>. Click it to activate
              your account, then{' '}
              <Link to="/login" className="text-[#1a2b5e] font-semibold hover:underline">
                sign in
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f0e8] flex flex-col items-center justify-center p-4">
      {/* Branding */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-[#1a2b5e] flex items-center justify-center text-white text-2xl mx-auto mb-3">
          🏆
        </div>
        <h1 className="text-2xl font-bold text-[#1a2b5e]">Green Commute Challenge</h1>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-md overflow-hidden">
        <div className="h-1 bg-[#c8102e]" />
        <div className="p-8">
          <h2 className="text-xl font-semibold text-[#1a2b5e] mb-6">Create account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Display name */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Display name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                placeholder=""
                maxLength={32}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2b5e]/30 focus:border-[#1a2b5e] transition-colors"
              />
              <p className="text-xs text-gray-400 mt-1">
                This is publicly visible to other users.
              </p>
            </div>

            {/* Normal commute mode */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                How do you normally commute?
              </label>
              <select
                value={normalModeId}
                onChange={(e) => setNormalModeId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2b5e]/30 focus:border-[#1a2b5e] transition-colors bg-white"
              >
                {modes.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.emoji} {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Group PIN */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Group PIN (optional)
              </label>
              <input
                type="text"
                value={groupPin}
                onChange={(e) => setGroupPin(e.target.value)}
                placeholder="e.g. ABC123"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2b5e]/30 focus:border-[#1a2b5e] transition-colors"
              />
              <p className="text-xs text-gray-400 mt-1">
                Got a PIN from your team? Enter it to join their leaderboard.
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2b5e]/30 focus:border-[#1a2b5e] transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                minLength={8}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2b5e]/30 focus:border-[#1a2b5e] transition-colors"
              />
              <p className="text-xs text-gray-400 mt-1">Minimum 8 characters, including at least one uppercase letter, one lowercase letter, one number, and one special character.</p>
            </div>

            {error && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1a2b5e] hover:bg-[#142248] disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors mt-2"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-[#1a2b5e] font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
