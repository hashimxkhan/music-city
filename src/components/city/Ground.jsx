import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'

export default function Ground() {
  return (
    <group>
      {/* Dark metallic ground — wet asphalt */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#030306" roughness={0.08} metalness={0.9} />
      </mesh>

      {/* Neon wireframe grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[500, 500, 80, 80]} />
        <meshBasicMaterial color="#1a0040" wireframe transparent opacity={0.12} depthWrite={false} />
      </mesh>

      <InterDistrictStreets />
      <Puddles />
      <Traffic />
    </group>
  )
}

function InterDistrictStreets() {
  const streetData = [
    { pos: [0, 0.04, 0], rot: 0, len: 250, w: 2.8 },
    { pos: [0, 0.04, -40], rot: 0, len: 250, w: 2.0 },
    { pos: [0, 0.04, 38], rot: 0, len: 250, w: 2.0 },
    { pos: [0, 0.04, 0], rot: Math.PI / 2, len: 250, w: 2.8 },
    { pos: [-52, 0.04, 0], rot: Math.PI / 2, len: 250, w: 1.8 },
    { pos: [56, 0.04, 0], rot: Math.PI / 2, len: 250, w: 1.8 },
  ]

  return (
    <>
      {streetData.map((s, i) => (
        <group key={i}>
          <mesh position={s.pos} rotation={[-Math.PI / 2, 0, s.rot]}>
            <planeGeometry args={[s.w, s.len]} />
            <meshStandardMaterial color="#080810" roughness={0.7} metalness={0.35} />
          </mesh>
          <mesh position={[s.pos[0], 0.05, s.pos[2]]} rotation={[-Math.PI / 2, 0, s.rot]}>
            <planeGeometry args={[0.08, s.len]} />
            <meshBasicMaterial color="#6600cc" toneMapped={false} transparent opacity={0.6} />
          </mesh>
        </group>
      ))}
    </>
  )
}

/* 25 puddles — metallic reflection */
function Puddles() {
  const puddles = useMemo(() => {
    const arr = []
    for (let i = 0; i < 25; i++) {
      arr.push({
        pos: [(Math.random() - 0.5) * 180, 0.02, (Math.random() - 0.5) * 140],
        size: [1.2 + Math.random() * 3, 0.8 + Math.random() * 2.5],
        rot: Math.random() * Math.PI,
      })
    }
    return arr
  }, [])

  return (
    <>
      {puddles.map((p, i) => (
        <mesh key={i} position={p.pos} rotation={[-Math.PI / 2, 0, p.rot]}>
          <planeGeometry args={p.size} />
          <meshStandardMaterial color="#010108" roughness={0.0} metalness={1.0} transparent opacity={0.7} />
        </mesh>
      ))}
    </>
  )
}

/* Single points system for traffic — 60 vehicles */
function Traffic() {
  const count = 60
  const ref = useRef()

  const particles = useMemo(() => {
    const arr = []
    const hStreets = [0, -40, 38], vStreets = [-52, 0, 56]
    for (let i = 0; i < count; i++) {
      const horiz = Math.random() > 0.5
      const sIdx = Math.floor(Math.random() * 3)
      const dir = Math.random() > 0.5 ? 1 : -1
      arr.push({
        horiz, dir,
        streetPos: horiz ? hStreets[sIdx] : vStreets[sIdx],
        lane: dir * (0.3 + Math.random() * 0.4),
        progress: Math.random() * 240 - 120,
        speed: (3 + Math.random() * 5) * dir,
      })
    }
    return arr
  }, [])

  const positions = useMemo(() => new Float32Array(count * 3), [count])

  useFrame((_, delta) => {
    if (!ref.current) return
    const attr = ref.current.geometry.attributes.position
    for (let i = 0; i < count; i++) {
      const p = particles[i]
      p.progress += p.speed * delta
      if (p.progress > 120) p.progress = -120
      if (p.progress < -120) p.progress = 120
      if (p.horiz) {
        attr.setXYZ(i, p.progress, 0.15, p.streetPos + p.lane)
      } else {
        attr.setXYZ(i, p.streetPos + p.lane, 0.15, p.progress)
      }
    }
    attr.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#ffaa44" size={0.35} sizeAttenuation transparent opacity={0.85} />
    </points>
  )
}
