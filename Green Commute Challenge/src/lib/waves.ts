export function daysRemaining(finishDate: string): number {
  const todayEST = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
  )
  const todayMidnight = new Date(todayEST.getFullYear(), todayEST.getMonth(), todayEST.getDate())
  const finish = new Date(`${finishDate}T00:00:00`)
  const diffDays = Math.round((finish.getTime() - todayMidnight.getTime()) / 86_400_000)
  return Math.max(diffDays, 0)
}
