import { useRef, useMemo, useEffect, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { MAX_PLAY } from '../../data/musicData'

const MIN_H = 2.5, MAX_H = 26, LOD_DIST = 80
const scaleH = pc => MIN_H + (pc / MAX_PLAY) * (MAX_H - MIN_H)
const bType = pc => pc > 800 ? 'landmark' : pc > 650 ? 'setback' : pc > 450 ? 'tower' : 'block'

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0
    let t = Math.imul(a ^ a >>> 15, 1 | a)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

function getBuildingPositions(count) {
  const positions = []
  const cols = Math.min(count, 3)
  for (let i = 0; i < count; i++) {
    const col = i % cols, row = Math.floor(i / cols)
    const rowOff = row % 2 === 1 ? 6.5 * 0.3 : 0
    positions.push([
      (col - (cols - 1) / 2) * 6.5 + rowOff,
      0,
      (row - Math.floor((count - 1) / cols) / 2) * 7,
    ])
  }
  return positions
}

/* ========== Pre-compute all instance data ========== */
function addWindows(arr, wx, wz, yOff, w, h, d, seed, color) {
  const rng = mulberry32(Math.floor(seed * 1000))
  const cols = Math.max(2, Math.floor(w / 0.7))
  const rows = Math.max(2, Math.floor(h / 1.5))
  const wGap = (w - 0.4) / cols, hGap = (h - 0.6) / rows

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (rng() > 0.7) continue
      const x = -w / 2 + 0.3 + wGap * (c + 0.5)
      const y = yOff + 0.5 + hGap * (r + 0.5)
      arr.push({ pos: [wx + x, y, wz + d / 2 + 0.01], rot: 0, color })
      arr.push({ pos: [wx + x, y, wz - d / 2 - 0.01], rot: Math.PI, color })
    }
  }
  const sCols = Math.max(1, Math.floor(d / 1.0))
  const sRows = Math.max(2, Math.floor(h / 2))
  const sGap = (d - 0.4) / sCols, sHGap = (h - 0.6) / sRows
  for (let r = 0; r < sRows; r++) {
    for (let c = 0; c < sCols; c++) {
      if (rng() > 0.6) continue
      const z = -d / 2 + 0.3 + sGap * (c + 0.5)
      const y = yOff + 0.5 + sHGap * (r + 0.5)
      arr.push({ pos: [wx + w / 2 + 0.01, y, wz + z], rot: Math.PI / 2, color })
      arr.push({ pos: [wx - w / 2 - 0.01, y, wz + z], rot: -Math.PI / 2, color })
    }
  }
}

function addEdges(arr, wx, wz, yOff, w, h, d, color) {
  const hw = w / 2, hd = d / 2
  for (const [ex, ez] of [[-hw, -hd], [hw, -hd], [-hw, hd], [hw, hd]]) {
    arr.push({ pos: [wx + ex, yOff + h / 2, wz + ez], scale: [0.04, h, 0.04], color })
  }
  arr.push({ pos: [wx, yOff + h, wz - hd], scale: [w, 0.04, 0.04], color })
  arr.push({ pos: [wx, yOff + h, wz + hd], scale: [w, 0.04, 0.04], color })
  arr.push({ pos: [wx - hw, yOff + h, wz], scale: [0.04, 0.04, d], color })
  arr.push({ pos: [wx + hw, yOff + h, wz], scale: [0.04, 0.04, d], color })
}

function computeAllInstances(districts) {
  const bodies = [], windows = [], edges = [], details = [], godRays = []
  const buildingMap = [], buildingCenters = [], windowRanges = [], edgeRanges = []
  let bi = 0

  districts.forEach(({ center, artists, color, genre }) => {
    const positions = getBuildingPositions(artists.length)
    artists.forEach((artist, i) => {
      const wx = center[0] + positions[i][0]
      const wz = center[2] + positions[i][2]
      const h = scaleH(artist.playCount)
      const type = bType(artist.playCount)
      const seed = bi * 137.5
      const info = { artist: artist.artist, genre, playCount: artist.playCount, topTrack: artist.topTrack, worldPos: [wx, 0, wz], height: h }

      buildingCenters.push([wx, wz])
      const winStart = windows.length, edgeStart = edges.length

      if (type === 'landmark') {
        const bW = 3.2, bD = 3.2, midH = h * 0.6, topH = h * 0.4, tW = 2.0, tD = 2.0, spH = 6
        bodies.push({ pos: [wx, midH / 2, wz], scale: [bW, midH, bD] })
        buildingMap.push(info)
        bodies.push({ pos: [wx, midH + topH / 2, wz], scale: [tW, topH, tD] })
        buildingMap.push(info)
        addWindows(windows, wx, wz, 0, bW, midH, bD, seed, color.neon)
        addWindows(windows, wx, wz, midH, tW, topH, tD, seed + 50, color.neon)
        addEdges(edges, wx, wz, 0, bW, midH, bD, color.neon)
        addEdges(edges, wx, wz, midH, tW, topH, tD, color.neon)
        details.push(
          { type: 'cylinder', args: [0.04, 0.3, spH, 6], pos: [wx, midH + topH + spH / 2, wz], color: color.neon },
          { type: 'sphere', args: [0.15, 6, 6], pos: [wx, h + spH + 0.5, wz], color: color.neon },
          { type: 'ring', args: [0.5, 0.7, 12], pos: [wx, midH + topH + 0.05, wz], rot: [-Math.PI / 2, 0, 0], color: color.neon },
        )
        godRays.push({ pos: [wx, h + spH + 20, wz], color: color.neon })
      } else if (type === 'setback') {
        const bW = 3.5, bD = 3.0, bH = h * 0.55, tH = h * 0.45, tW = 2.2, tD = 2.0
        bodies.push({ pos: [wx, bH / 2, wz], scale: [bW, bH, bD] })
        buildingMap.push(info)
        bodies.push({ pos: [wx, bH + tH / 2, wz], scale: [tW, tH, tD] })
        buildingMap.push(info)
        addWindows(windows, wx, wz, 0, bW, bH, bD, seed, color.neon)
        addWindows(windows, wx, wz, bH, tW, tH, tD, seed + 50, color.neon)
        addEdges(edges, wx, wz, 0, bW, bH, bD, color.neon)
        addEdges(edges, wx, wz, bH, tW, tH, tD, color.neon)
        details.push(
          { type: 'cylinder', args: [0.02, 0.02, 3, 4], pos: [wx + 0.6, bH + tH + 1.5, wz], color: color.neon },
          { type: 'sphere', args: [0.08, 6, 6], pos: [wx + 0.6, bH + tH + 3.1, wz], color: color.neon },
        )
      } else if (type === 'tower') {
        const w = 2.4, d = 2.4
        bodies.push({ pos: [wx, h / 2, wz], scale: [w, h, d] })
        buildingMap.push(info)
        addWindows(windows, wx, wz, 0, w, h, d, seed, color.neon)
        addEdges(edges, wx, wz, 0, w, h, d, color.neon)
        details.push(
          { type: 'cylinder', args: [0.4, 0.4, 0.8, 6], pos: [wx, h + 1.2, wz], color: '#222222' },
        )
        for (const [lx, lz] of [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]]) {
          details.push({ type: 'cylinder', args: [0.03, 0.03, 0.8, 4], pos: [wx + lx, h + 0.4, wz + lz], color: '#333333' })
        }
      } else {
        const w = 3.6, d = 3.0
        bodies.push({ pos: [wx, h / 2, wz], scale: [w, h, d] })
        buildingMap.push(info)
        addWindows(windows, wx, wz, 0, w, h, d, seed, color.neon)
        addEdges(edges, wx, wz, 0, w, h, d, color.neon)
        for (const [ax, az] of [[-0.8, -0.6], [0.5, 0.7], [-0.4, 0.3]]) {
          details.push({ type: 'box', args: [0.5, 0.4, 0.5], pos: [wx + ax, h + 0.2, wz + az], color: '#181818' })
        }
      }

      windowRanges.push([winStart, windows.length])
      edgeRanges.push([edgeStart, edges.length])
      bi++
    })
  })

  return { bodies, windows, edges, details, godRays, buildingMap, buildingCenters, windowRanges, edgeRanges }
}

/* ========== Setup helpers ========== */
function setupBodies(mesh, data) {
  const dummy = new THREE.Object3D()
  data.forEach((b, i) => {
    dummy.position.set(b.pos[0], b.pos[1], b.pos[2])
    dummy.scale.set(b.scale[0], b.scale[1], b.scale[2])
    dummy.rotation.set(0, 0, 0)
    dummy.updateMatrix()
    mesh.setMatrixAt(i, dummy.matrix)
  })
  mesh.instanceMatrix.needsUpdate = true
}

function setupWindows(mesh, data) {
  const dummy = new THREE.Object3D()
  const colors = new Float32Array(data.length * 3)
  data.forEach((w, i) => {
    dummy.position.set(w.pos[0], w.pos[1], w.pos[2])
    dummy.rotation.set(0, w.rot, 0)
    dummy.scale.set(1, 1, 1)
    dummy.updateMatrix()
    mesh.setMatrixAt(i, dummy.matrix)
    const c = new THREE.Color(w.color)
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b
  })
  mesh.instanceColor = new THREE.InstancedBufferAttribute(colors, 3)
  mesh.instanceMatrix.needsUpdate = true
}

function setupEdges(mesh, data) {
  const dummy = new THREE.Object3D()
  const colors = new Float32Array(data.length * 3)
  data.forEach((e, i) => {
    dummy.position.set(e.pos[0], e.pos[1], e.pos[2])
    dummy.scale.set(e.scale[0], e.scale[1], e.scale[2])
    dummy.rotation.set(0, 0, 0)
    dummy.updateMatrix()
    mesh.setMatrixAt(i, dummy.matrix)
    const c = new THREE.Color(e.color)
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b
  })
  mesh.instanceColor = new THREE.InstancedBufferAttribute(colors, 3)
  mesh.instanceMatrix.needsUpdate = true
}

/* ========== Zero matrix for LOD hiding ========== */
const ZERO_MAT = new Float32Array(16)
ZERO_MAT[15] = 1

/* ========== Component ========== */
export default function Buildings({ districts, onSelect, onHover }) {
  const data = useMemo(() => computeAllInstances(districts), [districts])
  const bodyRef = useRef()
  const windowRef = useRef()
  const edgeRef = useRef()
  const { camera } = useThree()

  const windowOriginals = useRef(null)
  const edgeOriginals = useRef(null)
  const frameCount = useRef(0)
  const lodState = useRef(new Map())

  // Setup all instance matrices + colors
  useEffect(() => {
    if (bodyRef.current) setupBodies(bodyRef.current, data.bodies)
    if (windowRef.current) {
      setupWindows(windowRef.current, data.windows)
      windowOriginals.current = new Float32Array(windowRef.current.instanceMatrix.array)
    }
    if (edgeRef.current) {
      setupEdges(edgeRef.current, data.edges)
      edgeOriginals.current = new Float32Array(edgeRef.current.instanceMatrix.array)
    }
  }, [data])

  // LOD: every 20 frames, hide window/edge instances for far buildings
  useFrame(() => {
    frameCount.current++
    if (frameCount.current % 20 !== 0) return
    if (!windowRef.current || !edgeRef.current) return
    if (!windowOriginals.current || !edgeOriginals.current) return

    let wDirty = false, eDirty = false

    data.buildingCenters.forEach((center, bIdx) => {
      const dx = camera.position.x - center[0], dz = camera.position.z - center[1]
      const near = (dx * dx + dz * dz) < LOD_DIST * LOD_DIST
      const wasNear = lodState.current.get(bIdx) !== false

      if (near !== wasNear) {
        lodState.current.set(bIdx, near)

        const [ws, we] = data.windowRanges[bIdx]
        for (let i = ws; i < we; i++) {
          if (near) {
            windowRef.current.instanceMatrix.array.set(windowOriginals.current.subarray(i * 16, i * 16 + 16), i * 16)
          } else {
            windowRef.current.instanceMatrix.array.set(ZERO_MAT, i * 16)
          }
        }
        wDirty = true

        const [es, ee] = data.edgeRanges[bIdx]
        for (let i = es; i < ee; i++) {
          if (near) {
            edgeRef.current.instanceMatrix.array.set(edgeOriginals.current.subarray(i * 16, i * 16 + 16), i * 16)
          } else {
            edgeRef.current.instanceMatrix.array.set(ZERO_MAT, i * 16)
          }
        }
        eDirty = true
      }
    })

    if (wDirty) windowRef.current.instanceMatrix.needsUpdate = true
    if (eDirty) edgeRef.current.instanceMatrix.needsUpdate = true
  })

  const handleClick = useCallback((e) => {
    e.stopPropagation()
    const b = data.buildingMap[e.instanceId]
    if (b) onSelect(b)
  }, [data, onSelect])

  const handleOver = useCallback((e) => {
    e.stopPropagation()
    document.body.style.cursor = 'pointer'
    const b = data.buildingMap[e.instanceId]
    if (b) onHover(b)
  }, [data, onHover])

  const handleOut = useCallback(() => {
    document.body.style.cursor = 'auto'
    onHover(null)
  }, [onHover])

  if (!data.bodies.length) return null

  return (
    <group>
      {/* Building bodies — interactive via instanceId */}
      <instancedMesh
        ref={bodyRef}
        args={[null, null, data.bodies.length]}
        onClick={handleClick}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#08080f" roughness={0.15} metalness={0.9} />
      </instancedMesh>

      {/* Windows — per-instance color via instanceColor, MeshBasicMaterial for zero lighting cost */}
      {data.windows.length > 0 && (
        <instancedMesh ref={windowRef} args={[null, null, data.windows.length]} frustumCulled={false}>
          <planeGeometry args={[0.25, 0.35]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.9} toneMapped={false} />
        </instancedMesh>
      )}

      {/* Edge glows — per-instance color */}
      {data.edges.length > 0 && (
        <instancedMesh ref={edgeRef} args={[null, null, data.edges.length]} frustumCulled={false}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </instancedMesh>
      )}

      {/* Rooftop details — small count, individual meshes are fine */}
      {data.details.map((d, i) => (
        <mesh key={i} position={d.pos} rotation={d.rot || [0, 0, 0]}>
          {d.type === 'cylinder' && <cylinderGeometry args={d.args} />}
          {d.type === 'box' && <boxGeometry args={d.args} />}
          {d.type === 'ring' && <ringGeometry args={d.args} />}
          {d.type === 'sphere' && <sphereGeometry args={d.args} />}
          <meshBasicMaterial color={d.color} toneMapped={false} />
        </mesh>
      ))}

      {/* God ray cones — only on landmarks, static opacity */}
      {data.godRays.map((g, i) => (
        <mesh key={`gr${i}`} position={g.pos}>
          <cylinderGeometry args={[0.05, 2.5, 40, 8, 1, true]} />
          <meshBasicMaterial color={g.color} transparent opacity={0.03} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}
