import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/* All atmosphere in a single points system — 1 useFrame, 1 draw call
   Combines: ground fog (120) + high haze (40) + steam vents (80) = 240 particles */
export default function Atmosphere() {
  const ref = useRef()

  const VENTS = [
    [-52, -40], [-42, -32], [-18, -44], [8, -37], [42, -32],
    [-47, 34], [-22, 42], [12, 30], [48, 37], [28, -22],
  ]

  const fogCount = 120
  const hazeCount = 40
  const steamCount = VENTS.length * 8
  const total = fogCount + hazeCount + steamCount

  const particles = useMemo(() => {
    const arr = []
    // Ground fog
    for (let i = 0; i < fogCount; i++) {
      arr.push({
        type: 'fog',
        x: (Math.random() - 0.5) * 200,
        y: 0.3 + Math.random() * 3.5,
        z: (Math.random() - 0.5) * 160,
        dx: (Math.random() - 0.5) * 0.4,
        dz: (Math.random() - 0.5) * 0.25,
      })
    }
    // High haze
    for (let i = 0; i < hazeCount; i++) {
      arr.push({
        type: 'haze',
        x: (Math.random() - 0.5) * 250,
        y: 8 + Math.random() * 20,
        z: (Math.random() - 0.5) * 200,
        dx: (Math.random() - 0.5) * 0.6,
        dz: 0,
      })
    }
    // Steam vents
    VENTS.forEach(([vx, vz]) => {
      for (let i = 0; i < 8; i++) {
        arr.push({
          type: 'steam',
          baseX: vx + (Math.random() - 0.5) * 2,
          baseZ: vz + (Math.random() - 0.5) * 2,
          x: vx, y: Math.random() * 8, z: vz,
          dx: (Math.random() - 0.5) * 0.5,
          dz: 0,
          speed: 0.6 + Math.random() * 1.5,
        })
      }
    })
    return arr
  }, [])

  const positions = useMemo(() => {
    const pos = new Float32Array(total * 3)
    particles.forEach((p, i) => {
      pos[i * 3] = p.x
      pos[i * 3 + 1] = p.y
      pos[i * 3 + 2] = p.z
    })
    return pos
  }, [particles, total])

  useFrame((_, delta) => {
    if (!ref.current) return
    const attr = ref.current.geometry.attributes.position
    for (let i = 0; i < total; i++) {
      const p = particles[i]
      if (p.type === 'fog') {
        p.x += p.dx * delta
        p.z += p.dz * delta
        if (p.x > 100) p.x = -100
        if (p.x < -100) p.x = 100
        if (p.z > 80) p.z = -80
        if (p.z < -80) p.z = 80
      } else if (p.type === 'haze') {
        p.x += p.dx * delta
        if (p.x > 125) p.x = -125
        if (p.x < -125) p.x = 125
      } else {
        p.y += p.speed * delta
        if (p.y > 8) p.y = 0
        p.x = p.baseX + p.dx * p.y
        p.z = p.baseZ
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
        color="#2a2a4a"
        size={3.0}
        sizeAttenuation
        transparent
        opacity={0.05}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
