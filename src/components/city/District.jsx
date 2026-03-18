import { useRef } from 'react'
import { Text, Billboard } from '@react-three/drei'
import Building from './Building'

// Place buildings in a grid within a district
function getBuildingPositions(count) {
  const positions = []
  const cols = Math.ceil(Math.sqrt(count))
  const spacing = 5
  for (let i = 0; i < count; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)
    const ox = (col - (cols - 1) / 2) * spacing
    const oz = (row - Math.floor(count / cols) / 2) * spacing
    positions.push([ox, 0, oz])
  }
  return positions
}

export default function District({ genre, color, center, artists, onBuildingSelect }) {
  const positions = getBuildingPositions(artists.length)
  // Bounding size for ground plate
  const cols = Math.ceil(Math.sqrt(artists.length))
  const plateSize = cols * 5 + 4

  return (
    <group position={center}>
      {/* District ground plate */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[plateSize, plateSize]} />
        <meshStandardMaterial
          color={color.neon}
          emissive={color.neon}
          emissiveIntensity={0.08}
          roughness={0.6}
          metalness={0.4}
          transparent
          opacity={0.55}
        />
      </mesh>

      {/* District border lines */}
      <DistrictBorder size={plateSize} color={color} />

      {/* Buildings */}
      {artists.map((artist, i) => (
        <Building
          key={artist.artist}
          position={positions[i]}
          artist={artist.artist}
          genre={genre}
          playCount={artist.playCount}
          topTrack={artist.topTrack}
          color={color}
          onSelect={onBuildingSelect}
        />
      ))}

      {/* Floating district label */}
      <Billboard position={[0, 22, 0]}>
        <Text
          fontSize={2.2}
          color={color.neon}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.08}
          outlineColor="#000000"
          font={undefined}
        >
          {genre.toUpperCase()}
        </Text>
      </Billboard>

      {/* Glow under label */}
      <pointLight position={[0, 18, 0]} color={color.neon} intensity={5} distance={20} decay={2} />
    </group>
  )
}

function DistrictBorder({ size, color }) {
  const h = size / 2
  const segments = [
    // top, bottom, left, right edges
    { pos: [0, 0.05, -h], rot: [0, 0, 0], len: size },
    { pos: [0, 0.05,  h], rot: [0, 0, 0], len: size },
    { pos: [-h, 0.05, 0], rot: [0, Math.PI / 2, 0], len: size },
    { pos: [ h, 0.05, 0], rot: [0, Math.PI / 2, 0], len: size },
  ]
  return (
    <>
      {segments.map((s, i) => (
        <mesh key={i} position={s.pos} rotation={s.rot}>
          <boxGeometry args={[s.len, 0.08, 0.15]} />
          <meshStandardMaterial color={color.neon} emissive={color.neon} emissiveIntensity={3} />
        </mesh>
      ))}
    </>
  )
}
