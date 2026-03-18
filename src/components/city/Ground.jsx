import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'

export default function Ground() {
  return (
    <group>
      {/* Dark metallic ground — high metalness + low roughness fakes wet reflections via bloom spread */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#030306" roughness={0.12} metalness={0.85} />
      </mesh>

      {/* Neon wireframe grid — static opacity, no useFrame */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[500, 500, 100, 100]} />
        <meshBasicMaterial color="#1a0040" wireframe transparent opacity={0.15} depthWrite={false} />
      </mesh>

      <Streets />
      <Traffic />
    </group>
  )
}

function Streets() {
  const streetData = [
    { pos: [0, 0.04, 0], rot: 0, len: 200, w: 2.2 },
    { pos: [0, 0.04, -32], rot: 0, len: 200, w: 1.5 },
    { pos: [0, 0.04, 30], rot: 0, len: 200, w: 1.5 },
    { pos: [0, 0.04, 0], rot: Math.PI / 2, len: 200, w: 2.2 },
    { pos: [-42, 0.04, 0], rot: Math.PI / 2, len: 200, w: 1.5 },
    { pos: [44, 0.04, 0], rot: Math.PI / 2, len: 200, w: 1.5 },
  ]

  return (
    <>
      {streetData.map((s, i) => (
        <group key={i}>
          <mesh position={s.pos} rotation={[-Math.PI / 2, 0, s.rot]}>
            <planeGeometry args={[s.w, s.len]} />
            <meshStandardMaterial color="#0a0a12" roughness={0.8} metalness={0.3} />
          </mesh>
          <mesh position={[s.pos[0], 0.05, s.pos[2]]} rotation={[-Math.PI / 2, 0, s.rot]}>
            <planeGeometry args={[0.08, s.len]} />
            <meshBasicMaterial color="#6600cc" toneMapped={false} />
          </mesh>
        </group>
      ))}
    </>
  )
}

function Traffic() {
  const count = 80
  const ref = useRef()

  const particles = useMemo(() => {
    const arr = []
    const hStreets = [0, -32, 30], vStreets = [-42, 0, 44]
    for (let i = 0; i < count; i++) {
      const horiz = Math.random() > 0.5
      const sIdx = Math.floor(Math.random() * 3)
      arr.push({
        horiz,
        streetPos: horiz ? hStreets[sIdx] : vStreets[sIdx],
        lane: (Math.random() - 0.5) * 1.2,
        progress: Math.random() * 200 - 100,
        speed: 2 + Math.random() * 6,
      })
    }
    return arr
  }, [])

  const initialPositions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    particles.forEach((p, i) => {
      if (p.horiz) {
        pos[i * 3] = p.progress; pos[i * 3 + 1] = 0.15; pos[i * 3 + 2] = p.streetPos + p.lane
      } else {
        pos[i * 3] = p.streetPos + p.lane; pos[i * 3 + 1] = 0.15; pos[i * 3 + 2] = p.progress
      }
    })
    return pos
  }, [particles])

  // Lightweight useFrame — just updating 80 positions in a flat array
  useFrame((_, delta) => {
    if (!ref.current) return
    const positions = ref.current.geometry.attributes.position
    for (let i = 0; i < count; i++) {
      const p = particles[i]
      p.progress += p.speed * delta
      if (p.progress > 100) p.progress = -100
      if (p.horiz) {
        positions.setXYZ(i, p.progress, 0.15, p.streetPos + p.lane)
      } else {
        positions.setXYZ(i, p.streetPos + p.lane, 0.15, p.progress)
      }
    }
    positions.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[initialPositions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#ffaa44" size={0.3} sizeAttenuation transparent opacity={0.8} />
    </points>
  )
}
