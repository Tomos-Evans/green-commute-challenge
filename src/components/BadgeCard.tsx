interface Badge {
  emoji: string
  name: string
  unlocked: boolean
}

export function BadgeCard({ emoji, name, unlocked }: Badge) {
  return (
    <div
      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${
        unlocked ? '' : 'opacity-35 grayscale'
      }`}
      title={unlocked ? name : `${name} (locked)`}
    >
      <span className="text-3xl">{emoji}</span>
      <span className="text-xs text-center text-gray-600 font-medium leading-tight">{name}</span>
    </div>
  )
}
