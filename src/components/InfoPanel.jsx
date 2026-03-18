import { genreColors } from '../data/musicData'

export default function InfoPanel({ data, onClose }) {
  const color = genreColors[data.genre] || { neon: '#ffffff' }

  return (
    <div
      className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto"
      style={{ zIndex: 100 }}
    >
      <div
        className="relative rounded-lg px-8 py-5 min-w-64 text-center"
        style={{
          background: 'rgba(2, 0, 12, 0.92)',
          border: `1.5px solid ${color.neon}`,
          boxShadow: `0 0 24px ${color.neon}55, 0 0 60px ${color.neon}22, inset 0 0 20px ${color.neon}08`,
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Genre badge */}
        <div
          className="text-xs font-bold tracking-widest mb-2 uppercase"
          style={{ color: color.neon, textShadow: `0 0 10px ${color.neon}` }}
        >
          {data.genre} District
        </div>

        {/* Artist */}
        <div
          className="text-2xl font-black tracking-tight mb-1"
          style={{ color: '#ffffff', textShadow: `0 0 20px ${color.neon}` }}
        >
          {data.artist}
        </div>

        {/* Top track */}
        <div className="text-sm text-gray-400 mb-3">
          Top Track:{' '}
          <span className="font-semibold" style={{ color: color.neon }}>
            {data.topTrack}
          </span>
        </div>

        {/* Play count bar */}
        <div className="flex items-center gap-3 justify-center mb-1">
          <span className="text-gray-500 text-xs uppercase tracking-wider">Plays</span>
          <div className="flex-1 max-w-32 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${(data.playCount / 847) * 100}%`,
                background: `linear-gradient(90deg, ${color.neon}88, ${color.neon})`,
                boxShadow: `0 0 8px ${color.neon}`,
              }}
            />
          </div>
          <span
            className="text-lg font-bold tabular-nums"
            style={{ color: color.neon, textShadow: `0 0 8px ${color.neon}` }}
          >
            {data.playCount.toLocaleString()}
          </span>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-600 hover:text-white transition-colors text-lg leading-none"
        >
          ×
        </button>
      </div>
    </div>
  )
}
