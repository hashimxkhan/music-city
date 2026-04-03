import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

const DISPLAYS = [
  { pos: [-55, 24, -42], text: 'HIP HOP', color: '#FFD700' },
  { pos: [0, 22, -45], text: 'ELECTRONIC', color: '#00FFFF' },
  { pos: [55, 20, -38], text: 'INDIE ROCK', color: '#FF6622' },
  { pos: [-50, 20, 38], text: 'JAZZ', color: '#4488FF' },
  { pos: [5, 22, 36], text: 'R&B', color: '#CC44FF' },
]

export default function Holograms() {
  const ref = useRef()

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.getElapsedTime()
    ref.current.children.forEach((child, i) => {
      child.rotation.y = t * 0.12 + i * 1.2
    })
  })

  return (
    <group ref={ref}>
      {DISPLAYS.map((d, i) => (
        <group key={i} position={d.pos}>
          {/* Screen + border as single plane */}
          <mesh>
            <planeGeometry args={[4.5, 2.5]} />
            <meshBasicMaterial
              color={d.color}
              transparent
              opacity={0.05}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
          <Text
            position={[0, 0, 0.02]}
            fontSize={0.6}
            color={d.color}
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.15}
          >
            {d.text}
            <meshBasicMaterial color={d.color} toneMapped={false} transparent opacity={0.7} side={THREE.DoubleSide} />
          </Text>
        </group>
      ))}
    </group>
  )
}
