export interface TransportMode {
  id: string
  name: string
  emoji: string | null
  points_per_mile: number
  weather_warrior_eligible: boolean
}

export interface Profile {
  id: string
  display_name: string
  discriminator: number
  normal_commute_mode_id: string | null
  created_at: string
}

export interface Commute {
  id: string
  user_id: string
  transport_mode_id: string
  distance_miles: number
  commute_date: string
  weather_warrior: boolean
  created_at: string
}

export interface Wave {
  id: string
  group_id: string
  start_date: string
  finish_date: string
  is_active: boolean
}

export interface Group {
  id: string
  name: string
  joined_at: string
}

export interface LeaderboardRow {
  user_id: string
  display_name: string
  discriminator: number
  total_non_warrior_points: number
  total_warrior_base_points: number
  total_miles: number
  journey_count: number
  warrior_commute_count: number
}

export interface RankedEntry extends LeaderboardRow {
  total_points: number
  rank: number
}
