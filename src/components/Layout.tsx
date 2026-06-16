import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useGroup } from '../context/GroupContext'
import { supabase } from '../lib/supabase'
import { daysRemaining } from '../lib/waves'
import type { Wave } from '../types/database'

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth()
  const { selectedGroupId } = useGroup()
  const location = useLocation()
  const [activeWave, setActiveWave] = useState<Wave | null>(null)

  useEffect(() => {
    if (!profile || !selectedGroupId) {
      setActiveWave(null)
      return
    }
    supabase
      .from('waves')
      .select('id, group_id, start_date, finish_date, is_active')
      .eq('group_id', selectedGroupId)
      .eq('is_active', true)
      .maybeSingle()
      .then(({ data }) => setActiveWave((data as Wave | null) ?? null))
  }, [profile, selectedGroupId])

  return (
    <div className="min-h-screen bg-[#f5f0e8] flex flex-col">
      {/* Nav */}
      <header className="bg-[#1a2b5e] shadow-md">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-1 sm:gap-4">
          {/* Logo — also acts as the link to the leaderboard */}
          <NavLink
            to="/leaderboard"
            className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 rounded-lg px-1 py-1 -mx-1 hover:bg-white/10 transition-colors"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 flex items-center justify-center text-white text-lg shrink-0">
              🏆
            </div>
            <div className="text-white leading-tight min-w-0">
              <div className="font-semibold text-sm truncate">Green Commute Challenge</div>
              {activeWave && (
                <div className="text-[11px] text-sky-200 truncate">
                  🌊{' '}
                  {(() => {
                    const remaining = daysRemaining(activeWave.finish_date)
                    if (remaining < 0) return 'Current wave has already ended'
                    if (remaining === 0) return 'Current wave ends today'
                    return `${remaining} day${remaining === 1 ? '' : 's'} left in current wave`
                  })()}
                </div>
              )}
            </div>
          </NavLink>

          {/* Avatar */}
          {profile && (
            <NavLink
              to="/profile"
              className="flex items-center gap-2 px-1 sm:px-2 py-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
            >
              <div className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {initials(profile.display_name)}
              </div>
              <span className="text-white text-sm hidden sm:inline">
                {profile.display_name}
              </span>
            </NavLink>
          )}
        </div>
        {/* Red accent line */}
        <div className="h-0.5 bg-[#c8102e]" />
      </header>

      {/* Page content */}
      <main className="flex-1">{children}</main>

      {/* Floating action button — add a journey */}
      {profile && location.pathname !== '/log' && (
        <NavLink
          to="/log"
          aria-label="Add a journey"
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#c8102e] hover:bg-[#a50d26] text-white text-3xl font-light flex items-center justify-center shadow-lg transition-colors"
        >
          +
        </NavLink>
      )}
    </div>
  )
}
