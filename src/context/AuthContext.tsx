import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types/database'

interface AuthContextValue {
  user: User | null
  profile: Profile | null
  loading: boolean
  passwordRecovery: boolean
  clearPasswordRecovery: () => void
  refreshProfile: (authUser?: User) => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  passwordRecovery: false,
  clearPasswordRecovery: () => {},
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [passwordRecovery, setPasswordRecovery] = useState(false)

  async function fetchProfile(authUser: User) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle()

    if (data) {
      setProfile(data as Profile)
      return
    }

    // No profile row yet. Signup stashes the fields it couldn't insert at
    // signup time (no session while email confirmation is pending) in
    // user_metadata — provision the profile now that we have a session.
    const meta = authUser.user_metadata as {
      display_name?: string
      normal_commute_mode_id?: string | null
    }
    if (!meta?.display_name) {
      setProfile(null)
      return
    }

    const { data: disc, error: rpcError } = await supabase.rpc('get_next_discriminator', {
      base_name: meta.display_name,
    })
    if (rpcError) {
      setProfile(null)
      return
    }

    const { data: inserted, error: insertError } = await supabase
      .from('profiles')
      .insert([
        {
          id: authUser.id,
          display_name: meta.display_name,
          discriminator: disc as number,
          normal_commute_mode_id: meta.normal_commute_mode_id ?? null,
        },
      ])
      .select()
      .single()

    if (insertError) {
      // Another concurrent auth event may have already provisioned it.
      const { data: retry } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle()
      setProfile((retry as Profile | null) ?? null)
      return
    }

    setProfile(inserted as Profile)
  }

  async function refreshProfile(authUser?: User) {
    const target = authUser ?? user
    if (target) await fetchProfile(target)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecovery(true)
      }
      if (session?.user) {
        fetchProfile(session.user)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        passwordRecovery,
        clearPasswordRecovery: () => setPasswordRecovery(false),
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
