import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // No app route in the hash here — Supabase appends the recovery token as
    // its own URL fragment, and a URL can only carry one. We land on the
    // bare app root and redirect to /reset-password once the token is parsed
    // (see PasswordRecoveryRedirect in App.tsx).
    const redirectTo = `${window.location.origin}${window.location.pathname}`
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-[#f5f0e8] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-md overflow-hidden text-center">
          <div className="h-1 bg-[#c8102e]" />
          <div className="p-8">
            <div className="text-4xl mb-4">📬</div>
            <h2 className="text-xl font-semibold text-[#1a2b5e] mb-2">Check your email</h2>
            <p className="text-gray-500 text-sm">
              If an account exists for <strong>{email}</strong>, we've sent a link to reset your
              password.
            </p>
            <Link
              to="/login"
              className="inline-block text-[#1a2b5e] font-semibold hover:underline mt-6 text-sm"
            >
              Back to sign in
            </Link>
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
          <h2 className="text-xl font-semibold text-[#1a2b5e] mb-2">Reset your password</h2>
          <p className="text-sm text-gray-500 mb-6">
            Enter your email and we'll send you a link to reset your password.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
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
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Remembered your password?{' '}
            <Link to="/login" className="text-[#1a2b5e] font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
