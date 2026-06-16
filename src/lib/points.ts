import { WEATHER_WARRIOR_MULTIPLIER } from './constants'

export function calculatePoints(
  miles: number,
  pointsPerMile: number,
  weatherWarrior: boolean,
): number {
  return miles * pointsPerMile * (weatherWarrior ? WEATHER_WARRIOR_MULTIPLIER : 1)
}
