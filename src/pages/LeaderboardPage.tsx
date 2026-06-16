import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { WEATHER_WARRIOR_MULTIPLIER } from '../lib/constants'
import type { LeaderboardRow, RankedEntry } from '../types/database'

function buildRanking(rows: LeaderboardRow[]): RankedEntry[] {
  const scored = rows.map((r) => ({
    ...r,
    total_points:
      r.total_non_warrior_points +
      r.total_warrior_base_points * WEATHER_WARRIOR_MULTIPLIER,
    rank: 0,
  }))

  scored.sort((a, b) => b.total_points - a.total_points)

  // Assign ranks (tied scores share a rank)
  let currentRank = 1
  for (let i = 0; i < scored.length; i++) {
    if (i > 0 && scored[i].total_points < scored[i - 1].total_points) {
      currentRank = i + 1
    }
    scored[i].rank = currentRank
  }

  return scored
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-white font-bold text-sm shrink-0">
        1
      </div>
    )
  if (rank === 2)
    return (
      <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white font-bold text-sm shrink-0">
        2
      </div>
    )
  if (rank === 3)
    return (
      <div className="w-8 h-8 rounded-full bg-amber-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
        3
      </div>
    )
  return (
    <div className="w-8 h-8 flex items-center justify-center text-gray-400 font-semibold text-sm shrink-0">
      {rank}
    </div>
  )
}

function LeaderboardRow({
  entry,
  isCurrentUser,
}: {
  entry: RankedEntry
  isCurrentUser: boolean
}) {
  return (
    <div
      className={`flex items-center gap-4 px-5 py-3.5 ${
        isCurrentUser ? 'bg-[#1a2b5e]/5 border-l-4 border-[#1a2b5e]' : 'border-l-4 border-transparent'
      }`}
    >
      <RankBadge rank={entry.rank} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-semibold text-sm ${isCurrentUser ? 'text-[#1a2b5e]' : 'text-gray-800'}`}>
            {entry.display_name}
            <span className="text-gray-400 font-normal">#{entry.discriminator}</span>
          </span>
          {entry.warrior_commute_count > 0 && (
            <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
              ☔ Warrior
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{entry.total_miles.toFixed(1)} mi</p>
      </div>

      <div className="text-right shrink-0">
        <span className="text-lg font-bold text-[#1a2b5e]">
          {entry.total_points.toFixed(1)}
        </span>
        <span className="text-xs text-gray-400 ml-1">pts</span>
      </div>
    </div>
  )
}

export function LeaderboardPage() {
  const { user } = useAuth()
  const [ranked, setRanked] = useState<RankedEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLeaderboard = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_leaderboard')
    if (error) {
      setError(error.message)
    } else {
      setRanked(buildRanking((data as LeaderboardRow[]) ?? []))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

  const top10 = ranked.slice(0, 10)
  const currentUserEntry = ranked.find((r) => r.user_id === user?.id)
  const currentUserInTop10 = top10.some((r) => r.user_id === user?.id)

  const totalParticipants = ranked.length
  const totalMiles = ranked.reduce((sum, r) => sum + r.total_miles, 0)

  return (
    <div>
      {/* Stats strip */}
      <div className="bg-[#1a2b5e] border-t border-white/10">
        <div className="max-w-3xl mx-auto px-4 py-5 flex gap-8">
          <div>
            <p className="text-2xl font-bold text-white">{totalParticipants}</p>
            <p className="text-xs tracking-widest text-white/50 uppercase mt-0.5">Participants</p>
          </div>
          <div className="border-l border-white/20 pl-8">
            <p className="text-2xl font-bold text-white">{totalMiles.toFixed(1)}</p>
            <p className="text-xs tracking-widest text-white/50 uppercase mt-0.5">Miles logged</p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-3xl mx-auto px-4 py-8 pb-28">
        <div className="flex items-baseline justify-between mb-6">
          <h1 className="text-3xl font-bold text-[#1a2b5e]">
            🏆{' '}
            <span className="relative inline-block">
              Leaderboard
              <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-[#c8102e]" />
            </span>
          </h1>
          <Link
            to="/share"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-[#1a2b5e] border border-[#1a2b5e]/20 rounded-lg hover:bg-[#1a2b5e]/5 transition-colors shrink-0"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <span>Share</span>
          </Link>
        </div>

        {loading && (
          <div className="text-center py-16 text-gray-400">Loading…</div>
        )}

        {error && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        {!loading && !error && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {top10.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-4xl mb-3">🏆</p>
                <p className="font-medium">No journeys logged yet.</p>
                <p className="text-sm mt-1">Be the first to log a commute!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {top10.map((entry) => (
                  <LeaderboardRow
                    key={entry.user_id}
                    entry={entry}
                    isCurrentUser={entry.user_id === user?.id}
                  />
                ))}
              </div>
            )}

            {/* Current user outside top 10 */}
            {!currentUserInTop10 && currentUserEntry && (
              <>
                <div className="flex items-center gap-3 px-5 py-2 border-t border-gray-100 bg-gray-50">
                  <div className="flex-1 border-t border-dashed border-gray-300" />
                  <span className="text-xs text-gray-400 font-medium uppercase tracking-wider shrink-0">
                    Your position
                  </span>
                  <div className="flex-1 border-t border-dashed border-gray-300" />
                </div>
                <LeaderboardRow
                  entry={currentUserEntry}
                  isCurrentUser
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
