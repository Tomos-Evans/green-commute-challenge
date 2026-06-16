import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { calculatePoints } from '../lib/points'
import { WEATHER_WARRIOR_MULTIPLIER } from '../lib/constants'
import { BadgeCard } from '../components/BadgeCard'
import type { LeaderboardRow } from '../types/database'

interface TransportModeSummary {
  id: string
  name: string
  emoji: string | null
}

interface CommuteWithMode {
  id: string
  distance_miles: number
  commute_date: string
  weather_warrior: boolean
  transport_mode_id: string
  transport_modes: TransportModeSummary & { points_per_mile: number }
}

interface ModeBreakdown {
  mode: TransportModeSummary
  journeys: number
  miles: number
}

function computeStreak(commutes: CommuteWithMode[]): number {
  if (commutes.length === 0) return 0

  const dates = new Set(commutes.map((c) => c.commute_date))
  let streak = 0

  // Walk backwards from today
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    if (dates.has(dateStr)) {
      streak++
    } else {
      break
    }
  }

  return streak
}

function getModeBreakdown(commutes: CommuteWithMode[]): ModeBreakdown[] {
  const map = new Map<string, ModeBreakdown>()
  for (const c of commutes) {
    const existing = map.get(c.transport_mode_id)
    if (existing) {
      existing.journeys++
      existing.miles += c.distance_miles
    } else {
      map.set(c.transport_mode_id, {
        mode: c.transport_modes,
        journeys: 1,
        miles: c.distance_miles,
      })
    }
  }
  return Array.from(map.values()).sort((a, b) => b.miles - a.miles)
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function StatCard({
  emoji,
  value,
  label,
  borderColor,
}: {
  emoji: string
  value: string | number
  label: string
  borderColor: string
}) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 border-t-4 ${borderColor}`}>
      <div className="text-2xl mb-2">{emoji}</div>
      <div className="text-3xl font-bold text-[#1a2b5e]">{value}</div>
      <div className="text-xs tracking-widest text-gray-400 uppercase mt-1">{label}</div>
    </div>
  )
}

export function ProfilePage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [commutes, setCommutes] = useState<CommuteWithMode[]>([])
  const [rank, setRank] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    async function load() {
      // Fetch user's commutes with transport mode details
      const { data: commuteData } = await supabase
        .from('commutes')
        .select('id, distance_miles, commute_date, weather_warrior, transport_mode_id, transport_modes(id, name, emoji, points_per_mile)')
        .eq('user_id', user!.id)
        .order('commute_date', { ascending: false })

      setCommutes((commuteData as unknown as CommuteWithMode[]) ?? [])

      // Fetch leaderboard to get rank
      const { data: lb } = await supabase.rpc('get_leaderboard')
      if (lb) {
        const rows = (lb as LeaderboardRow[])
          .map((r) => ({
            ...r,
            total_points:
              r.total_non_warrior_points +
              r.total_warrior_base_points * WEATHER_WARRIOR_MULTIPLIER,
          }))
          .sort((a, b) => b.total_points - a.total_points)

        const pos = rows.findIndex((r) => r.user_id === user!.id)
        setRank(pos >= 0 ? pos + 1 : null)
      }

      setLoading(false)
    }

    load()
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">Loading…</div>
    )
  }

  const totalMiles = commutes.reduce((s, c) => s + c.distance_miles, 0)
  const totalPoints = commutes.reduce(
    (s, c) =>
      s + calculatePoints(c.distance_miles, c.transport_modes.points_per_mile, c.weather_warrior),
    0,
  )
  const dayStreak = computeStreak(commutes)
  const journeyCount = commutes.length
  const warriorCount = commutes.filter((c) => c.weather_warrior).length
  const breakdown = getModeBreakdown(commutes)

  const badges = [
    { emoji: '🌱', name: 'First Step', unlocked: journeyCount >= 1 },
    { emoji: '🔥', name: '5-Day Streak', unlocked: dayStreak >= 5 },
    { emoji: '⚡', name: '10-Day Streak', unlocked: dayStreak >= 10 },
    { emoji: '☔', name: 'Weather Warrior', unlocked: warriorCount >= 1 },
    { emoji: '🥈', name: '50 Miles', unlocked: totalMiles >= 50 },
    { emoji: '🥇', name: '100 Miles', unlocked: totalMiles >= 100 },
    { emoji: '🏆', name: 'Top 10', unlocked: rank !== null && rank <= 10 },
  ]

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Profile header */}
      <div className="relative bg-[#1a2b5e] rounded-2xl overflow-hidden p-5 sm:p-7 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left">
        {/* Decorative circle */}
        <div className="absolute right-0 top-0 w-56 h-56 rounded-full border-[40px] border-white/5 translate-x-16 -translate-y-16 pointer-events-none" />

        {/* Avatar */}
        <div className="w-20 h-20 rounded-full bg-[#c8102e] flex items-center justify-center text-white text-2xl font-bold shrink-0">
          {profile ? initials(profile.display_name) : '?'}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-white break-words">
            {profile?.display_name}
            <span className="text-white/50 font-normal text-lg">#{profile?.discriminator}</span>
          </h1>
          <div className="flex items-center justify-center sm:justify-start gap-3 mt-1 text-white/60 text-sm flex-wrap">
            <span>
              Rank{' '}
              <span className="text-white font-semibold">
                {rank !== null ? `#${rank}` : '—'}
              </span>
            </span>
            <span className="text-white/30">·</span>
            <span>
              <span className="text-white font-semibold">{dayStreak}</span> day streak
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 shrink-0 w-full sm:w-auto">
          <button
            onClick={() => navigate('/log')}
            className="flex-1 sm:flex-initial px-4 py-2 text-sm font-semibold text-white border border-white/30 rounded-lg hover:bg-white/10 transition-colors whitespace-nowrap"
          >
            + Log Journey
          </button>
          <button
            onClick={handleSignOut}
            className="flex-1 sm:flex-initial px-4 py-2 text-sm font-semibold text-white border border-white/30 rounded-lg hover:bg-white/10 transition-colors whitespace-nowrap"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard emoji="🏆" value={totalPoints.toFixed(1)} label="Total points" borderColor="border-t-blue-500" />
        <StatCard emoji="📍" value={totalMiles.toFixed(1)} label="Total miles" borderColor="border-t-green-500" />
        <StatCard emoji="🔥" value={dayStreak} label="Day streak" borderColor="border-t-red-500" />
        <StatCard emoji="🚀" value={journeyCount} label="Journeys" borderColor="border-t-amber-400" />
      </div>

      {/* Mode breakdown + Badges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mode breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-bold text-[#1a2b5e] mb-4 relative inline-block">
            Mode Breakdown
            <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-[#c8102e]" />
          </h2>

          {breakdown.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-sm">No journeys yet</p>
            </div>
          ) : (
            <div className="space-y-3 mt-5">
              {breakdown.map(({ mode, journeys, miles }) => (
                <div key={mode.id} className="flex items-center gap-3">
                  <span className="text-xl w-7 text-center">{mode.emoji ?? '🚗'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm font-medium text-gray-700">{mode.name}</span>
                      <span className="text-xs text-gray-400">{miles.toFixed(1)} mi</span>
                    </div>
                    <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1a2b5e] rounded-full"
                        style={{
                          width: `${totalMiles > 0 ? (miles / totalMiles) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {journeys} {journeys === 1 ? 'journey' : 'journeys'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-bold text-[#1a2b5e] mb-4 relative inline-block">
            Badges
            <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-[#c8102e]" />
          </h2>
          <div className="grid grid-cols-3 gap-1 mt-5">
            {badges.map((b) => (
              <BadgeCard key={b.name} {...b} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
