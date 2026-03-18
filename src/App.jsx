import CityScene from './components/city/CityScene'
import { musicData } from './data/musicData'

export default function App() {
  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative font-mono">
      {/* HUD header */}
      <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none px-6 pt-5 flex items-start justify-between">
        <div>
          <h1
            className="text-3xl font-black tracking-widest uppercase"
            style={{
              color: '#00ffff',
              textShadow: '0 0 20px #00ffff, 0 0 40px #00ffff55',
              fontFamily: 'monospace',
            }}
          >
            MUSIC CITY
          </h1>
          <p className="text-xs tracking-widest text-cyan-900 mt-0.5 uppercase">
            Your Listening Universe — Visualized
          </p>
        </div>

        <Legend />
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-4 right-6 z-10 pointer-events-none text-right">
        <p className="text-gray-700 text-xs tracking-wider">
          Drag to orbit · Scroll to zoom · Click a building
        </p>
      </div>

      <CityScene data={musicData} />
    </div>
  )
}

const GENRES = [
  { label: 'Hip Hop', color: '#FFD700' },
  { label: 'Electronic', color: '#00FFFF' },
  { label: 'Indie Rock', color: '#FF6600' },
  { label: 'R&B', color: '#CC44FF' },
  { label: 'Jazz', color: '#00BFFF' },
]

function Legend() {
  return (
    <div
      className="text-xs rounded px-4 py-3 flex flex-col gap-1.5"
      style={{
        background: 'rgba(0,0,0,0.7)',
        border: '1px solid #ffffff11',
        backdropFilter: 'blur(8px)',
      }}
    >
      {GENRES.map(({ label, color }) => (
        <div key={label} className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-sm"
            style={{ background: color, boxShadow: `0 0 6px ${color}` }}
          />
          <span className="text-gray-400 tracking-wider text-xs">{label}</span>
        </div>
      ))}
    </div>
  )
}
