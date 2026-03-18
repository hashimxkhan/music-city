import { Text, Billboard } from '@react-three/drei'

function getBuildingPositions(count) {
  const cols = Math.min(count, 3)
  const rows = Math.ceil(count / cols)
  return { cols, rows }
}

export default function District({ genre, color, center, artists }) {
  const { cols, rows } = getBuildingPositions(artists.length)
  const plateW = cols * 6.5 + 6
  const plateD = rows * 7 + 5

  return (
    <group position={center}>
      {/* District ground plate */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <planeGeometry args={[plateW, plateD]} />
        <meshStandardMaterial
          color={color.base}
          emissive={color.neon}
          emissiveIntensity={0.04}
          roughness={0.5}
          metalness={0.6}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Neon border */}
      <DistrictBorder w={plateW} d={plateD} color={color} />

      {/* Lamp posts — emissive spheres only, zero pointLights */}
      <LampPosts w={plateW} d={plateD} color={color} />

      {/* Floating district label */}
      <Billboard position={[0, 30, 0]}>
        <Text
          fontSize={2.8}
          color={color.neon}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.06}
          outlineColor="#000000"
          letterSpacing={0.15}
        >
          {genre.toUpperCase()}
          <meshBasicMaterial color={color.neon} toneMapped={false} />
        </Text>
      </Billboard>

      {/* Underline bar */}
      <mesh position={[0, 28.2, 0]}>
        <boxGeometry args={[genre.length * 1.5, 0.08, 0.08]} />
        <meshBasicMaterial color={color.neon} toneMapped={false} />
      </mesh>
    </group>
  )
}

function DistrictBorder({ w, d, color }) {
  const hw = w / 2, hd = d / 2
  const segs = [
    { pos: [0, 0.06, -hd], rot: 0, len: w },
    { pos: [0, 0.06, hd], rot: 0, len: w },
    { pos: [-hw, 0.06, 0], rot: Math.PI / 2, len: d },
    { pos: [hw, 0.06, 0], rot: Math.PI / 2, len: d },
  ]
  return (
    <>
      {segs.map((s, i) => (
        <mesh key={i} position={s.pos} rotation={[0, s.rot, 0]}>
          <boxGeometry args={[s.len, 0.1, 0.12]} />
          <meshBasicMaterial color={color.neon} toneMapped={false} />
        </mesh>
      ))}
      {[[-hw, -hd], [hw, -hd], [-hw, hd], [hw, hd]].map(([x, z], i) => (
        <mesh key={`c${i}`} position={[x, 0.2, z]}>
          <boxGeometry args={[0.3, 0.4, 0.3]} />
          <meshBasicMaterial color={color.neon} toneMapped={false} />
        </mesh>
      ))}
    </>
  )
}

function LampPosts({ w, d, color }) {
  const posts = []
  const hw = w / 2, hd = d / 2
  for (let x = -hw + 4; x < hw; x += 8) {
    posts.push([x, 0, -hd - 1])
    posts.push([x, 0, hd + 1])
  }
  return (
    <>
      {posts.map((p, i) => (
        <group key={i} position={p}>
          <mesh position={[0, 1.5, 0]}>
            <cylinderGeometry args={[0.04, 0.06, 3, 4]} />
            <meshStandardMaterial color="#222" metalness={0.9} roughness={0.3} />
          </mesh>
          {/* Emissive glow sphere — bloom makes it look like a light */}
          <mesh position={[0, 3.1, 0]}>
            <sphereGeometry args={[0.12, 6, 6]} />
            <meshBasicMaterial color={color.neon} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </>
  )
}
