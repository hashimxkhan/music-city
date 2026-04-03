import { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function Sky() {
  return (
    <group>
      <StarField />
      <Moons />
      <DistantSkyline />
      <SkyDome />
      <SkyDrones />
    </group>
  )
}

/* ========== Distant animated drones / sky lights ========== */
function SkyDrones() {
  const ref = useRef()
  const drones = useMemo(() => [
    { radius: 80, y: 55, speed: 0.08, offset: 0, color: '#ff3366' },
    { radius: 100, y: 70, speed: -0.05, offset: 2, color: '#00ffaa' },
    { radius: 60, y: 80, speed: 0.12, offset: 4, color: '#4488ff' },
  ], [])

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.getElapsedTime()
    ref.current.children.forEach((child, i) => {
      const d = drones[i]
      if (!d) return
      const angle = t * d.speed + d.offset
      child.position.set(
        Math.cos(angle) * d.radius,
        d.y + Math.sin(t * 0.3 + i) * 3,
        Math.sin(angle) * d.radius
      )
    })
  })

  return (
    <group ref={ref}>
      {drones.map((d, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.6, 6, 6]} />
          <meshBasicMaterial color={d.color} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

/* ========== 800 stars, single Points, slow rotation only ========== */
function StarField() {
  const ref = useRef()
  const count = 800

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI * 0.48
      const r = 250 + Math.random() * 100
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 30
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
    }
    return pos
  }, [])

  // Just slow rotation — no per-star twinkle computation
  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.getElapsedTime() * 0.001
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#ccddff" size={0.8} sizeAttenuation transparent opacity={0.95} fog={false} />
    </points>
  )
}

/* ========== Moons — emissive only, zero pointLights, zero useFrame ========== */
function Moons() {
  return (
    <>
      {/* Large warm moon */}
      <group position={[160, 110, -140]}>
        <mesh>
          <sphereGeometry args={[18, 24, 24]} />
          <meshBasicMaterial color="#ff6633" toneMapped={false} />
        </mesh>
        <mesh>
          <sphereGeometry args={[22, 16, 16]} />
          <meshBasicMaterial color="#ff6633" transparent opacity={0.04} side={THREE.BackSide} depthWrite={false} />
        </mesh>
      </group>

      {/* Blue-cyan moon */}
      <group position={[-130, 85, -160]}>
        <mesh>
          <sphereGeometry args={[10, 24, 24]} />
          <meshBasicMaterial color="#4488ff" toneMapped={false} />
        </mesh>
        <mesh>
          <sphereGeometry args={[13, 16, 16]} />
          <meshBasicMaterial color="#4488ff" transparent opacity={0.03} side={THREE.BackSide} depthWrite={false} />
        </mesh>
      </group>

      {/* Magenta accent */}
      <group position={[50, 140, -200]}>
        <mesh>
          <sphereGeometry args={[5, 12, 12]} />
          <meshBasicMaterial color="#cc33ff" toneMapped={false} />
        </mesh>
      </group>
    </>
  )
}

/* ========== Distant skyline — denser, taller, more dramatic ========== */
function DistantSkyline() {
  const ref = useRef()
  const count = 140

  const data = useMemo(() => {
    const arr = []
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const ring = i % 3 // 3 concentric rings
      const radius = 160 + ring * 25 + (Math.random() - 0.5) * 15
      const h = 3 + Math.random() * 18 + (ring === 2 ? 5 : 0)
      const w = 0.6 + Math.random() * 2.5
      arr.push({
        pos: [Math.cos(angle) * radius, h / 2, Math.sin(angle) * radius],
        scale: [w, h, w * 0.5],
      })
    }
    return arr
  }, [])

  useEffect(() => {
    if (!ref.current) return
    const dummy = new THREE.Object3D()
    data.forEach((b, i) => {
      dummy.position.set(b.pos[0], b.pos[1], b.pos[2])
      dummy.scale.set(b.scale[0], b.scale[1], b.scale[2])
      dummy.rotation.set(0, 0, 0)
      dummy.updateMatrix()
      ref.current.setMatrixAt(i, dummy.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  }, [data])

  return (
    <>
      <instancedMesh ref={ref} args={[null, null, count]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#1100aa" transparent opacity={0.07} depthWrite={false} />
      </instancedMesh>

      {/* Horizon glow — layered rings for depth */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.5, 0]}>
        <ringGeometry args={[140, 230, 64]} />
        <meshBasicMaterial color="#0a0030" transparent opacity={0.2} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 1, 0]}>
        <ringGeometry args={[150, 200, 64]} />
        <meshBasicMaterial color="#1a0050" transparent opacity={0.08} depthWrite={false} />
      </mesh>
    </>
  )
}

function SkyDome() {
  return (
    <mesh>
      <sphereGeometry args={[350, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshBasicMaterial color="#000010" side={THREE.BackSide} fog={false} />
    </mesh>
  )
}
