import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function Ground() {
  const gridRef = useRef()

  useFrame((state) => {
    if (!gridRef.current) return
    // Subtle pulse on the grid
    gridRef.current.material.opacity = 0.25 + 0.05 * Math.sin(state.clock.getElapsedTime() * 0.5)
  })

  return (
    <group>
      {/* Base dark ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#050508" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Neon grid overlay */}
      <mesh ref={gridRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <planeGeometry args={[400, 400, 80, 80]} />
        <meshBasicMaterial
          color="#1a0040"
          wireframe
          transparent
          opacity={0.25}
        />
      </mesh>

      {/* Street lines between districts */}
      <Streets />
    </group>
  )
}

function Streets() {
  const streetColor = "#220055"
  const glowColor = "#9900ff"
  // Main cross streets
  const lines = [
    { pos: [0, 0.03, 0], rot: [0, 0, 0], len: 160, w: 1.5 },
    { pos: [0, 0.03, 0], rot: [0, Math.PI / 2, 0], len: 160, w: 1.5 },
  ]
  return (
    <>
      {lines.map((l, i) => (
        <group key={i}>
          <mesh position={l.pos} rotation={[Math.PI / 2, 0, l.rot[1]]}>
            <planeGeometry args={[l.w, l.len]} />
            <meshBasicMaterial color={streetColor} />
          </mesh>
          {/* Center glow line */}
          <mesh position={[l.pos[0], 0.04, l.pos[2]]} rotation={[Math.PI / 2, 0, l.rot[1]]}>
            <planeGeometry args={[0.15, l.len]} />
            <meshBasicMaterial color={glowColor} transparent opacity={0.7} />
          </mesh>
        </group>
      ))}
    </>
  )
}
