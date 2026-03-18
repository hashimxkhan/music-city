import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function StarSky() {
  const starsRef = useRef()

  const [positions, sizes] = useMemo(() => {
    const count = 2000
    const pos = new Float32Array(count * 3)
    const sz = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      // Hemisphere above the city
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI * 0.5
      const r = 280 + Math.random() * 60
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 20
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
      sz[i] = 0.4 + Math.random() * 1.2
    }
    return [pos, sz]
  }, [])

  useFrame((state) => {
    if (!starsRef.current) return
    starsRef.current.rotation.y = state.clock.getElapsedTime() * 0.002
  })

  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        color="#aaddff"
        size={0.7}
        sizeAttenuation
        transparent
        opacity={0.9}
        fog={false}
      />
    </points>
  )
}
