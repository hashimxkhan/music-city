import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const MAX_PLAY = 847
const MIN_HEIGHT = 1.5
const MAX_HEIGHT = 18

function scaleHeight(playCount) {
  return MIN_HEIGHT + ((playCount / MAX_PLAY) * (MAX_HEIGHT - MIN_HEIGHT))
}

export default function Building({ position, artist, genre, playCount, topTrack, color, onSelect }) {
  const meshRef = useRef()
  const glowRef = useRef()
  const [hovered, setHovered] = useState(false)
  const height = scaleHeight(playCount)
  const width = 2.2
  const depth = 2.2

  useFrame((state) => {
    if (!glowRef.current) return
    const t = state.clock.getElapsedTime()
    const pulse = 0.6 + 0.4 * Math.sin(t * 1.5 + position[0])
    glowRef.current.material.emissiveIntensity = hovered ? 3.5 : pulse * 1.8
  })

  return (
    <group position={position}>
      {/* Main building body */}
      <mesh
        ref={meshRef}
        position={[0, height / 2, 0]}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true) }}
        onPointerOut={() => setHovered(false)}
        onClick={(e) => { e.stopPropagation(); onSelect({ artist, genre, playCount, topTrack }) }}
        castShadow
      >
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color={hovered ? '#ffffff' : '#0a0a0f'}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>

      {/* Neon glow shell */}
      <mesh
        ref={glowRef}
        position={[0, height / 2, 0]}
      >
        <boxGeometry args={[width + 0.08, height + 0.08, depth + 0.08]} />
        <meshStandardMaterial
          color={color.neon}
          emissive={color.neon}
          emissiveIntensity={1.8}
          transparent
          opacity={0.18}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Neon edge strips */}
      {[[-width / 2, 0], [width / 2, 0], [0, -depth / 2], [0, depth / 2]].map(([ox, oz], i) => (
        <mesh key={i} position={[ox, height / 2, oz]}>
          <boxGeometry args={[
            i < 2 ? 0.06 : width,
            height,
            i < 2 ? depth : 0.06,
          ]} />
          <meshStandardMaterial
            color={color.neon}
            emissive={color.neon}
            emissiveIntensity={2.5}
          />
        </mesh>
      ))}

      {/* Rooftop light */}
      <pointLight
        position={[0, height + 0.5, 0]}
        color={color.neon}
        intensity={hovered ? 8 : 3}
        distance={10}
        decay={2}
      />

      {/* Window grid */}
      <WindowGrid height={height} width={width} depth={depth} color={color} />
    </group>
  )
}

function WindowGrid({ height, width, depth, color }) {
  const cols = 3
  const rows = Math.max(2, Math.floor(height / 2))
  const windows = []

  const wSpacing = width / (cols + 1)
  const hSpacing = height / (rows + 1)

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = -width / 2 + wSpacing * (c + 1)
      const y = hSpacing * (r + 1)
      const lit = Math.random() > 0.3
      if (!lit) continue
      windows.push(
        <mesh key={`f-${r}-${c}`} position={[x, y, depth / 2 + 0.01]}>
          <planeGeometry args={[0.3, 0.4]} />
          <meshStandardMaterial
            color={color.neon}
            emissive={color.neon}
            emissiveIntensity={1.2}
          />
        </mesh>,
        <mesh key={`b-${r}-${c}`} position={[x, y, -depth / 2 - 0.01]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.3, 0.4]} />
          <meshStandardMaterial
            color={color.neon}
            emissive={color.neon}
            emissiveIntensity={1.2}
          />
        </mesh>
      )
    }
  }
  return <>{windows}</>
}
