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
    </group>
  )
}

/* ========== 1000 stars, single Points, slow rotation only ========== */
function StarField() {
  const ref = useRef()
  const count = 1000

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

/* ========== Distant skyline — single InstancedMesh ========== */
function DistantSkyline() {
  const ref = useRef()
  const count = 80

  const data = useMemo(() => {
    const arr = []
    const radius = 180
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const r = radius + (Math.random() - 0.5) * 30
      const h = 2 + Math.random() * 12
      const w = 0.8 + Math.random() * 2
      arr.push({
        pos: [Math.cos(angle) * r, h / 2, Math.sin(angle) * r],
        scale: [w, h, w * 0.6],
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
        <meshBasicMaterial color="#1100aa" transparent opacity={0.05} depthWrite={false} />
      </instancedMesh>

      {/* Horizon glow ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.5, 0]}>
        <ringGeometry args={[160, 220, 64]} />
        <meshBasicMaterial color="#110033" transparent opacity={0.15} depthWrite={false} />
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
