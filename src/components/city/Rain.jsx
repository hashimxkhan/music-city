import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/* Single points system for rain — 500 drops, 1 useFrame */
export default function Rain() {
  const ref = useRef()
  const count = 500

  const particles = useMemo(() => {
    const arr = []
    for (let i = 0; i < count; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 200,
        y: Math.random() * 45,
        z: (Math.random() - 0.5) * 160,
        speed: 20 + Math.random() * 15,
        drift: (Math.random() - 0.5) * 1.0,
      })
    }
    return arr
  }, [])

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    particles.forEach((p, i) => {
      pos[i * 3] = p.x
      pos[i * 3 + 1] = p.y
      pos[i * 3 + 2] = p.z
    })
    return pos
  }, [particles])

  useFrame((_, delta) => {
    if (!ref.current) return
    const attr = ref.current.geometry.attributes.position
    for (let i = 0; i < count; i++) {
      const p = particles[i]
      p.y -= p.speed * delta
      p.x += p.drift * delta
      if (p.y < 0) {
        p.y = 38 + Math.random() * 10
        p.x = (Math.random() - 0.5) * 200
        p.z = (Math.random() - 0.5) * 160
      }
      attr.setXYZ(i, p.x, p.y, p.z)
    }
    attr.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#8ab4e8"
        size={0.18}
        sizeAttenuation
        transparent
        opacity={0.45}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
