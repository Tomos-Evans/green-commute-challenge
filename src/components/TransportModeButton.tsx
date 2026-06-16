import type { TransportMode } from '../types/database'

interface Props {
  mode: TransportMode
  selected: boolean
  onClick: () => void
}

function pointsLabel(ppm: number): string {
  return `${ppm} ${ppm === 1 ? 'PT' : 'PTS'}/MI`
}

export function TransportModeButton({ mode, selected, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer ${
        selected
          ? 'border-[#1a2b5e] bg-[#1a2b5e]/5 shadow-sm'
          : 'border-gray-200 bg-white hover:border-[#1a2b5e]/40 hover:bg-gray-50'
      }`}
    >
      <span className="text-3xl">{mode.emoji ?? '🚗'}</span>
      <span className="text-xs font-bold tracking-wide text-gray-700 uppercase text-center leading-tight">
        {mode.name}
      </span>
      <span
        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          selected
            ? 'bg-[#1a2b5e] text-white'
            : 'bg-green-100 text-green-700'
        }`}
      >
        {pointsLabel(mode.points_per_mile)}
      </span>
    </button>
  )
}
