import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { getDistrictSize } from './Buildings'

export default function District({ genre, color, center, streets }) {
  const { w: plateW, d: plateD } = useMemo(() => getDistrictSize(streets), [streets])

  return (
    <group position={center}>
      {/* District ground plate */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <planeGeometry args={[plateW, plateD]} />
        <meshStandardMaterial
          color={color.base}
          emissive={color.neon}
          emissiveIntensity={0.04}
          roughness={0.5}
          metalness={0.6}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Neon border — 4 segments merged into fewer meshes */}
      <DistrictBorder w={plateW} d={plateD} color={color} />

      {/* Streets within district — consolidated */}
      <DistrictStreets streets={streets} color={color} />

      {/* Instanced lamp posts */}
      <LampPosts w={plateW} d={plateD} color={color} />

      {/* Floating district label */}
      <Billboard position={[0, 32, 0]}>
        <Text
          fontSize={2.8}
          color={color.neon}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.06}
          outlineColor="#000000"
          letterSpacing={0.15}
        >
          {genre.toUpperCase()}
          <meshBasicMaterial color={color.neon} toneMapped={false} />
        </Text>
      </Billboard>

      {/* Underline bar */}
      <mesh position={[0, 30.2, 0]}>
        <boxGeometry args={[genre.length * 1.5, 0.08, 0.08]} />
        <meshBasicMaterial color={color.neon} toneMapped={false} />
      </mesh>

      {/* Artist street signs — just Text labels, no post meshes */}
      {streets.map((street, i) => {
        const minX = street.buildings.reduce((m, b) => Math.min(m, b.localX), 0)
        return (
          <Text
            key={i}
            position={[minX - 3, 3.4, street.z]}
            fontSize={0.22}
            color={color.neon}
            anchorX="center"
            anchorY="middle"
            maxWidth={2.5}
          >
            {street.artist.toUpperCase()}
            <meshBasicMaterial color={color.neon} toneMapped={false} />
          </Text>
        )
      })}
    </group>
  )
}

/* ========== Street geometry — one road mesh + one lane line per street ========== */
function DistrictStreets({ streets, color }) {
  return (
    <group>
      {streets.map((street, i) => {
        const streetLen = Math.max(12, street.buildings.length * 2.5 + 4)
        return (
          <group key={i}>
            {/* Road surface */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, street.z]}>
              <planeGeometry args={[streetLen, 4]} />
              <meshStandardMaterial color="#0c0c14" roughness={0.85} metalness={0.2} />
            </mesh>
            {/* Center lane glow */}
            <mesh position={[0, 0.05, street.z]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[streetLen, 0.06]} />
              <meshBasicMaterial color={color.neon} toneMapped={false} transparent opacity={0.3} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

function DistrictBorder({ w, d, color }) {
  const hw = w / 2, hd = d / 2
  const segs = [
    { pos: [0, 0.06, -hd], rot: 0, len: w },
    { pos: [0, 0.06, hd], rot: 0, len: w },
    { pos: [-hw, 0.06, 0], rot: Math.PI / 2, len: d },
    { pos: [hw, 0.06, 0], rot: Math.PI / 2, len: d },
  ]
  return (
    <>
      {segs.map((s, i) => (
        <mesh key={i} position={s.pos} rotation={[0, s.rot, 0]}>
          <boxGeometry args={[s.len, 0.1, 0.12]} />
          <meshBasicMaterial color={color.neon} toneMapped={false} />
        </mesh>
      ))}
    </>
  )
}

/* ========== Instanced lamp posts — single InstancedMesh for poles + spheres ========== */
function LampPosts({ w, d, color }) {
  const poleRef = useRef()
  const sphereRef = useRef()
  const coneRef = useRef()

  const posts = useMemo(() => {
    const arr = []
    const hw = w / 2, hd = d / 2
    for (let x = -hw + 4; x < hw; x += 8) {
      arr.push([x, 0, -hd - 1])
      arr.push([x, 0, hd + 1])
    }
    return arr
  }, [w, d])

  useEffect(() => {
    const dummy = new THREE.Object3D()
    posts.forEach((p, i) => {
      // Poles
      if (poleRef.current) {
        dummy.position.set(p[0], 1.5, p[2])
        dummy.scale.set(1, 1, 1)
        dummy.rotation.set(0, 0, 0)
        dummy.updateMatrix()
        poleRef.current.setMatrixAt(i, dummy.matrix)
      }
      // Spheres
      if (sphereRef.current) {
        dummy.position.set(p[0], 3.1, p[2])
        dummy.scale.set(1, 1, 1)
        dummy.updateMatrix()
        sphereRef.current.setMatrixAt(i, dummy.matrix)
      }
      // Cones
      if (coneRef.current) {
        dummy.position.set(p[0], 1.5, p[2])
        dummy.rotation.set(Math.PI, 0, 0)
        dummy.scale.set(1, 1, 1)
        dummy.updateMatrix()
        coneRef.current.setMatrixAt(i, dummy.matrix)
      }
    })
    if (poleRef.current) poleRef.current.instanceMatrix.needsUpdate = true
    if (sphereRef.current) sphereRef.current.instanceMatrix.needsUpdate = true
    if (coneRef.current) coneRef.current.instanceMatrix.needsUpdate = true
  }, [posts])

  if (!posts.length) return null

  return (
    <>
      <instancedMesh ref={poleRef} args={[null, null, posts.length]} frustumCulled={false}>
        <cylinderGeometry args={[0.04, 0.06, 3, 4]} />
        <meshBasicMaterial color="#333" />
      </instancedMesh>
      <instancedMesh ref={sphereRef} args={[null, null, posts.length]} frustumCulled={false}>
        <sphereGeometry args={[0.12, 6, 6]} />
        <meshBasicMaterial color={color.neon} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={coneRef} args={[null, null, posts.length]} frustumCulled={false}>
        <coneGeometry args={[1.2, 3, 6, 1, true]} />
        <meshBasicMaterial color={color.neon} transparent opacity={0.04} depthWrite={false} side={THREE.DoubleSide} />
      </instancedMesh>
    </>
  )
}
