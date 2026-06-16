import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const { passwordRecovery, clearPasswordRecovery } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    await supabase.auth.signOut()
    clearPasswordRecovery()
    setDone(true)
    setLoading(false)
  }

  if (!passwordRecovery && !done) {
    return (
      <div className="min-h-screen bg-[#f5f0e8] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-md overflow-hidden text-center">
          <div className="h-1 bg-[#c8102e]" />
          <div className="p-8">
            <h2 className="text-xl font-semibold text-[#1a2b5e] mb-2">Link expired</h2>
            <p className="text-gray-500 text-sm">
              This password reset link is invalid or has expired.
            </p>
            <Link
              to="/forgot-password"
              className="inline-block text-[#1a2b5e] font-semibold hover:underline mt-6 text-sm"
            >
              Request a new link
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#f5f0e8] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-md overflow-hidden text-center">
          <div className="h-1 bg-[#c8102e]" />
          <div className="p-8">
            <div className="text-4xl mb-4">✅</div>
            <h2 className="text-xl font-semibold text-[#1a2b5e] mb-2">Password updated</h2>
            <p className="text-gray-500 text-sm mb-6">
              You can now sign in with your new password.
            </p>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="w-full bg-[#1a2b5e] hover:bg-[#142248] text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              Go to sign in
            </button>
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
          <h2 className="text-xl font-semibold text-[#1a2b5e] mb-6">Choose a new password</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                New password
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
              <p className="text-xs text-gray-400 mt-1">
                Minimum 8 characters, including at least one uppercase letter, one lowercase
                letter, one number, and one special character.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Confirm new password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                minLength={8}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2b5e]/30 focus:border-[#1a2b5e] transition-colors"
              />
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
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
