import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { TransportModeButton } from '../components/TransportModeButton'
import { calculatePoints } from '../lib/points'
import type { TransportMode } from '../types/database'

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export function LogJourneyPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [modes, setModes] = useState<TransportMode[]>([])
  const [selectedModeId, setSelectedModeId] = useState<string | null>(null)
  const [date, setDate] = useState(todayISO())
  const [miles, setMiles] = useState<string>('')
  const [weatherWarrior, setWeatherWarrior] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    supabase
      .from('transport_modes')
      .select('*')
      .order('points_per_mile', { ascending: false })
      .then(({ data }) => {
        const rows = data as TransportMode[] | null
        if (rows) setModes(rows)
      })
  }, [])

  const selectedMode = modes.find((m) => m.id === selectedModeId) ?? null
  const showWeatherWarrior = selectedMode?.weather_warrior_eligible ?? false
  const milesNum = parseFloat(miles)
  const previewPoints =
    selectedMode && milesNum > 0
      ? calculatePoints(milesNum, selectedMode.points_per_mile, weatherWarrior)
      : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!selectedModeId) {
      setError('Please select a transport mode.')
      return
    }
    if (!milesNum || milesNum <= 0) {
      setError('Please enter a valid distance.')
      return
    }

    setSubmitting(true)
    const { error: insertError } = await supabase.from('commutes').insert([
      {
        user_id: user!.id,
        transport_mode_id: selectedModeId,
        distance_miles: milesNum,
        commute_date: date,
        weather_warrior: weatherWarrior,
      },
    ])

    if (insertError) {
      setError(insertError.message)
      setSubmitting(false)
      return
    }

    setSuccess(true)
    setSubmitting(false)
  }

  function handleSelectMode(mode: TransportMode) {
    setSelectedModeId(mode.id)
    if (!mode.weather_warrior_eligible) setWeatherWarrior(false)
  }

  function handleLogAnother() {
    setSuccess(false)
    setSelectedModeId(null)
    setMiles('')
    setWeatherWarrior(false)
    setDate(todayISO())
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-[#1a2b5e] mb-2">Journey logged!</h2>
          {previewPoints !== null && (
            <p className="text-gray-500 mb-6">
              You earned{' '}
              <span className="font-bold text-[#1a2b5e]">
                {previewPoints.toFixed(1)} points
              </span>
              {weatherWarrior && ' including your Weather Warrior bonus'}.
            </p>
          )}
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleLogAnother}
              className="px-5 py-2.5 bg-[#1a2b5e] hover:bg-[#142248] text-white font-semibold rounded-lg transition-colors text-sm"
            >
              Log another
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="px-5 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg transition-colors text-sm"
            >
              View profile
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Page heading */}
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#1a2b5e] relative inline-block">
            Add a Journey
            <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-[#c8102e]" />
          </h1>
        </div>
        <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
          Earn your points
        </span>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-7">

          {/* Date + Miles row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold tracking-widest text-gray-500 uppercase mb-2">
                Date
              </label>
              <input
                type="date"
                value={date}
                max={todayISO()}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2b5e]/30 focus:border-[#1a2b5e] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold tracking-widest text-gray-500 uppercase mb-2">
                Miles travelled
              </label>
              <input
                type="number"
                value={miles}
                onChange={(e) => setMiles(e.target.value)}
                min="0.1"
                step="0.1"
                placeholder="e.g. 3.5"
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2b5e]/30 focus:border-[#1a2b5e] transition-colors"
              />
            </div>
          </div>

          {/* Transport mode */}
          <div>
            <label className="block text-xs font-bold tracking-widest text-gray-500 uppercase mb-3">
              Transport mode
            </label>
            {modes.length === 0 ? (
              <p className="text-sm text-gray-400">Loading modes…</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {modes.map((mode) => (
                  <TransportModeButton
                    key={mode.id}
                    mode={mode}
                    selected={selectedModeId === mode.id}
                    onClick={() => handleSelectMode(mode)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Weather Warrior — only for modes exposed to the weather */}
          {showWeatherWarrior && (
            <div>
              <label className="block text-xs font-bold tracking-widest text-gray-500 uppercase mb-3">
                Weather conditions
              </label>
              <label className="flex items-center justify-between bg-gray-50 rounded-xl px-5 py-4 cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xl">☔</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Weather Warrior</p>
                    <p className="text-xs text-gray-500">Commuted in adverse weather conditions</p>
                  </div>
                </div>
                {/* Toggle */}
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={weatherWarrior}
                    onChange={(e) => setWeatherWarrior(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-checked:bg-[#1a2b5e] rounded-full transition-colors" />
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
                </div>
              </label>
            </div>
          )}

          {/* Points preview */}
          {previewPoints !== null && (
            <div className="flex items-center justify-between bg-[#1a2b5e]/5 border border-[#1a2b5e]/10 rounded-xl px-5 py-3">
              <span className="text-sm text-[#1a2b5e] font-medium">Points you'll earn</span>
              <span className="text-lg font-bold text-[#1a2b5e]">
                {previewPoints.toFixed(1)} pts
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#1a2b5e] hover:bg-[#142248] disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {submitting ? 'Logging…' : 'Log journey'}
          </button>
        </div>
      </form>
    </div>
  )
}
