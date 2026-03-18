import { genreColors, buildDistrictData, musicData } from '../data/musicData'

const districts = buildDistrictData(musicData)

// Normalize district positions to minimap coordinates
const minX = Math.min(...districts.map(d => d.center[0]))
const maxX = Math.max(...districts.map(d => d.center[0]))
const minZ = Math.min(...districts.map(d => d.center[2]))
const maxZ = Math.max(...districts.map(d => d.center[2]))
const rangeX = maxX - minX || 1
const rangeZ = maxZ - minZ || 1

function toMapCoord(center) {
  const x = ((center[0] - minX) / rangeX) * 80 + 10
  const y = ((center[2] - minZ) / rangeZ) * 60 + 10
  return { x, y }
}

export default function Minimap({ currentDistrict }) {
  return (
    <div
      className="w-32 h-24 rounded-lg relative overflow-hidden"
      style={{
        background: 'rgba(0, 0, 10, 0.85)',
        border: '1px solid #ffffff0d',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Grid lines */}
      <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.1 }}>
        {[0, 1, 2, 3, 4].map(i => (
          <line key={`h${i}`} x1="0" y1={`${i * 25}%`} x2="100%" y2={`${i * 25}%`} stroke="#ffffff" strokeWidth="0.5" />
        ))}
        {[0, 1, 2, 3, 4].map(i => (
          <line key={`v${i}`} x1={`${i * 25}%`} y1="0" x2={`${i * 25}%`} y2="100%" stroke="#ffffff" strokeWidth="0.5" />
        ))}
      </svg>

      {/* District blobs */}
      {districts.map((d) => {
        const { x, y } = toMapCoord(d.center)
        const isCurrent = currentDistrict === d.genre
        return (
          <div
            key={d.genre}
            className="absolute rounded-sm transition-all duration-300"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: '14px',
              height: '10px',
              transform: 'translate(-50%, -50%)',
              background: d.color.neon,
              opacity: isCurrent ? 0.9 : 0.35,
              boxShadow: isCurrent ? `0 0 8px ${d.color.neon}` : 'none',
            }}
          />
        )
      })}

      {/* Label */}
      <div className="absolute bottom-1 left-1.5 text-[7px] text-gray-600 tracking-widest uppercase">
        Districts
      </div>
    </div>
  )
}
