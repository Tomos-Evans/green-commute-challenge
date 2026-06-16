import { supabase } from './supabase'

export async function joinGroupByPin(pin: string) {
  const { data, error } = await supabase.rpc('join_group_by_pin', { p_pin: pin })
  if (error) throw error
  return data?.[0] as { id: string; name: string } | undefined
}
