import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

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
  const navigate = useNavigate()
  const location = useLocation()

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

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
              <div className="font-semibold text-sm truncate">British Embassy</div>
              <div className="text-[10px] tracking-widest text-white/70 uppercase truncate">
                Green Commute Challenge
              </div>
            </div>
          </NavLink>

          {/* Avatar + sign out */}
          {profile && (
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <NavLink
                to="/profile"
                className="flex items-center gap-2 px-1 sm:px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {initials(profile.display_name)}
                </div>
                <span className="text-white text-sm hidden sm:inline">
                  {profile.display_name}
                </span>
              </NavLink>
              <button
                onClick={handleSignOut}
                className="px-2 sm:px-3 py-1 text-xs bg-white/10 hover:bg-white/20 text-white rounded transition-colors shrink-0"
              >
                Out
              </button>
            </div>
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
