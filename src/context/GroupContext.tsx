import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import type { Group } from '../types/database'

const SELECTED_GROUP_STORAGE_KEY = 'selectedGroupId'

interface GroupContextValue {
  groups: Group[]
  selectedGroupId: string | null
  setSelectedGroupId: (groupId: string | null) => void
  refreshGroups: () => Promise<void>
}

const GroupContext = createContext<GroupContextValue>({
  groups: [],
  selectedGroupId: null,
  setSelectedGroupId: () => {},
  refreshGroups: async () => {},
})

export function GroupProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroupId, setSelectedGroupIdState] = useState<string | null>(
    () => localStorage.getItem(SELECTED_GROUP_STORAGE_KEY),
  )

  const refreshGroups = useCallback(async () => {
    const { data } = await supabase.from('my_groups').select('*')
    setGroups((data as Group[]) ?? [])
  }, [])

  useEffect(() => {
    if (!profile) {
      setGroups([])
      return
    }
    refreshGroups()
  }, [profile, refreshGroups])

  function setSelectedGroupId(groupId: string | null) {
    setSelectedGroupIdState(groupId)
    if (groupId) {
      localStorage.setItem(SELECTED_GROUP_STORAGE_KEY, groupId)
    } else {
      localStorage.removeItem(SELECTED_GROUP_STORAGE_KEY)
    }
  }

  return (
    <GroupContext.Provider value={{ groups, selectedGroupId, setSelectedGroupId, refreshGroups }}>
      {children}
    </GroupContext.Provider>
  )
}

export function useGroup() {
  return useContext(GroupContext)
}
