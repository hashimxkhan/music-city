import { useState, useCallback } from 'react'
import CityScene from './components/city/CityScene'
import InfoPanel from './components/InfoPanel'
import Minimap from './components/Minimap'
import { musicData, genreColors } from './data/musicData'

export default function App() {
  const [selected, setSelected] = useState(null)
  const [hovered, setHovered] = useState(null)

  const handleSelect = useCallback((info) => setSelected(info), [])
  const handleHover = useCallback((info) => setHovered(info), [])
  const hoveredColor = hovered ? genreColors[hovered.genre]?.neon : null

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative" style={{ fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace" }}>
      {/* ===== 3D Canvas ===== */}
      <CityScene data={musicData} onSelect={handleSelect} onHover={handleHover} />

      {/* ===== HUD Top Left: Title + Hover Info ===== */}
      <div className="absolute top-0 left-0 z-10 pointer-events-none px-6 pt-5">
        <h1
          className="text-2xl font-black tracking-[0.3em] uppercase"
          style={{
            color: '#00ffff',
            textShadow: '0 0 20px #00ffff88, 0 0 60px #00ffff33',
          }}
        >
          MUSIC CITY
        </h1>
        <p className="text-[10px] tracking-[0.25em] text-cyan-800 mt-0.5 uppercase">
          Your Listening Data Visualized
        </p>

        {/* Hover info */}
        <div className="mt-4 h-14">
          {hovered && (
            <div className="animate-fadeIn">
              <div
                className="text-[10px] font-bold tracking-[0.2em] uppercase mb-0.5"
                style={{ color: hoveredColor, textShadow: `0 0 8px ${hoveredColor}55` }}
              >
                {hovered.genre} District
              </div>
              <div className="text-white text-lg font-bold tracking-tight" style={{ textShadow: `0 0 20px ${hoveredColor}44` }}>
                {hovered.artist}
              </div>
              <div className="text-gray-600 text-xs">{hovered.playCount.toLocaleString()} plays</div>
            </div>
          )}
        </div>
      </div>

      {/* ===== Legend Top Right ===== */}
      <div className="absolute top-5 right-6 z-10 pointer-events-none">
        <Legend />
      </div>

      {/* ===== Minimap Bottom Left ===== */}
      <div className="absolute bottom-5 left-6 z-10 pointer-events-none">
        <Minimap currentDistrict={hovered?.genre || selected?.genre} />
      </div>

      {/* ===== Controls Hint Bottom Right ===== */}
      <div className="absolute bottom-5 right-6 z-10 pointer-events-none text-right">
        <p className="text-gray-700 text-[10px] tracking-wider">
          Orbit: drag &middot; Zoom: scroll &middot; Select: click building
        </p>
      </div>

      {/* ===== Selected Building Panel ===== */}
      {selected && (
        <InfoPanel data={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}

const GENRES = [
  { label: 'Hip Hop', color: '#FFD700' },
  { label: 'Electronic', color: '#00FFFF' },
  { label: 'Indie Rock', color: '#FF6622' },
  { label: 'Jazz', color: '#4488FF' },
  { label: 'R&B', color: '#CC44FF' },
  { label: 'Pop', color: '#FF3388' },
]

function Legend() {
  return (
    <div
      className="rounded-lg px-3.5 py-2.5 flex flex-col gap-1"
      style={{
        background: 'rgba(0, 0, 10, 0.8)',
        border: '1px solid #ffffff08',
        backdropFilter: 'blur(8px)',
      }}
    >
      {GENRES.map(({ label, color }) => (
        <div key={label} className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-sm"
            style={{ background: color, boxShadow: `0 0 6px ${color}88` }}
          />
          <span className="text-gray-500 tracking-wider text-[10px]">{label}</span>
        </div>
      ))}
    </div>
  )
}
