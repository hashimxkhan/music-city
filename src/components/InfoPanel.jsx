import { useEffect, useState } from 'react'
import { genreColors, MAX_PLAY } from '../data/musicData'

export default function InfoPanel({ data, onClose }) {
  const [visible, setVisible] = useState(false)
  const color = genreColors[data.genre] || { neon: '#ffffff' }

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    return () => setVisible(false)
  }, [data])

  return (
    <div
      className="absolute top-0 right-0 bottom-0 flex items-center pointer-events-none"
      style={{ zIndex: 100 }}
    >
      <div
        className="pointer-events-auto mr-6 w-80 transition-all duration-500 ease-out"
        style={{
          transform: visible ? 'translateX(0)' : 'translateX(120%)',
          opacity: visible ? 1 : 0,
        }}
      >
        <div
          className="rounded-xl p-6 relative overflow-hidden"
          style={{
            background: 'rgba(2, 0, 15, 0.95)',
            border: `1px solid ${color.neon}33`,
            boxShadow: `0 0 40px ${color.neon}22, 0 0 80px ${color.neon}11, inset 0 1px 0 ${color.neon}15`,
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Accent glow line at top */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${color.neon}, transparent)` }}
          />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-6 h-6 flex items-center justify-center rounded-full text-gray-600 hover:text-white transition-colors text-sm"
            style={{ border: '1px solid #333' }}
          >
            x
          </button>

          {/* Genre badge */}
          <div
            className="inline-block text-[10px] font-bold tracking-[0.2em] mb-3 px-2.5 py-1 rounded-full uppercase"
            style={{
              color: color.neon,
              border: `1px solid ${color.neon}44`,
              background: `${color.neon}08`,
              textShadow: `0 0 10px ${color.neon}`,
            }}
          >
            {data.genre}
          </div>

          {/* Artist name */}
          <h2
            className="text-2xl font-black tracking-tight mb-1"
            style={{
              color: '#ffffff',
              textShadow: `0 0 30px ${color.neon}55`,
            }}
          >
            {data.artist}
          </h2>

          {/* Top track */}
          <p className="text-sm text-gray-500 mb-5">
            Top Track:{' '}
            <span className="font-medium" style={{ color: color.neon }}>
              {data.topTrack}
            </span>
          </p>

          {/* Play count */}
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-gray-600 text-[10px] uppercase tracking-[0.2em]">Total Plays</span>
              <span
                className="text-2xl font-black tabular-nums"
                style={{ color: color.neon, textShadow: `0 0 12px ${color.neon}88` }}
              >
                {data.playCount.toLocaleString()}
              </span>
            </div>
            <div className="h-1 bg-gray-900 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: visible ? `${(data.playCount / MAX_PLAY) * 100}%` : '0%',
                  background: `linear-gradient(90deg, ${color.neon}44, ${color.neon})`,
                  boxShadow: `0 0 10px ${color.neon}88`,
                }}
              />
            </div>
          </div>

          {/* Building height indicator */}
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid #ffffff08' }}>
            <div className="flex items-center gap-3">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 rounded-sm"
                    style={{
                      height: `${8 + i * 4}px`,
                      background: i < Math.ceil(data.playCount / MAX_PLAY * 5) ? color.neon : '#1a1a2e',
                      boxShadow: i < Math.ceil(data.playCount / MAX_PLAY * 5) ? `0 0 4px ${color.neon}` : 'none',
                    }}
                  />
                ))}
              </div>
              <span className="text-gray-600 text-[10px] uppercase tracking-wider">Building Height</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
