import { useRef, useMemo, useEffect, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { MAX_PLAY } from '../../data/musicData'

const MIN_H = 2.5, MAX_H = 26, LOD_DIST = 90
const scaleH = pc => MIN_H + (pc / MAX_PLAY) * (MAX_H - MIN_H)

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0
    let t = Math.imul(a ^ a >>> 15, 1 | a)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

/* Hash string to number for deterministic building type */
function hashStr(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

/* Deterministic building type from artist+song name */
const TYPES = ['landmark', 'setback', 'tower', 'block', 'cylinder', 'lshape', 'stepped']
function bType(pc, name) {
  if (pc > 800) return 'landmark'
  const idx = hashStr(name) % (TYPES.length - 1) + 1 // skip landmark for non-top
  if (pc > 650) return TYPES[idx % 3 === 0 ? 1 : idx % TYPES.length]
  return TYPES[idx % TYPES.length]
}

/* ========== Street-based layout: each artist = one street ========== */
const STREET_W = 4       // road width between building rows
const BLDG_SPACING = 4.5 // spacing along a street
const BLDG_GAP = 1.0     // gap between building edge and street

export function computeStreetLayout(district) {
  const streets = []
  let currentZ = 0

  district.artists.forEach((artist) => {
    const songCount = artist.songs.length
    const streetLen = songCount * BLDG_SPACING
    const buildings = []

    artist.songs.forEach((song, si) => {
      const side = si % 2 === 0 ? -1 : 1 // alternate sides
      const along = Math.floor(si / 2) * BLDG_SPACING
      buildings.push({
        song: song.name,
        artist: artist.artist,
        playCount: song.playCount,
        localX: along - (Math.floor((songCount - 1) / 2) * BLDG_SPACING) / 2,
        localZ: side * (STREET_W / 2 + BLDG_GAP + 1.5),
        side,
      })
    })

    streets.push({
      artist: artist.artist,
      genre: district.genre,
      songs: artist.songs,
      z: currentZ,
      length: streetLen,
      buildings,
    })

    currentZ += STREET_W + 7 // street + building rows on both sides + gap
  })

  // Center the whole district
  const totalZ = currentZ - (STREET_W + 7)
  const offsetZ = -totalZ / 2
  streets.forEach(s => { s.z += offsetZ })

  return streets
}

export function getDistrictSize(streets) {
  if (!streets.length) return { w: 20, d: 20 }
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity
  streets.forEach(st => {
    st.buildings.forEach(b => {
      const x = b.localX
      const z = st.z + b.localZ
      minX = Math.min(minX, x - 3)
      maxX = Math.max(maxX, x + 3)
      minZ = Math.min(minZ, z - 3)
      maxZ = Math.max(maxZ, z + 3)
    })
  })
  return { w: maxX - minX + 8, d: maxZ - minZ + 8 }
}

/* ========== Window color palette — warm/cool whites + occasional color ========== */
const WIN_COLORS = [
  '#ffe8c0', // warm yellow-white
  '#e0e8ff', // cool blue-white
  '#ffffff', // pure white
  '#ffd080', // warm amber
  '#c0d8ff', // ice blue
]

function pickWindowColor(rng, neonColor) {
  const roll = rng()
  if (roll < 0.08) return neonColor // 8% chance of genre neon color
  return WIN_COLORS[Math.floor(rng() * WIN_COLORS.length)]
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
      const wc = pickWindowColor(rng, color)
      arr.push({ pos: [wx + x, y, wz + d / 2 + 0.01], rot: 0, color: wc })
      arr.push({ pos: [wx + x, y, wz - d / 2 - 0.01], rot: Math.PI, color: wc })
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
      const wc = pickWindowColor(rng, color)
      arr.push({ pos: [wx + w / 2 + 0.01, y, wz + z], rot: Math.PI / 2, color: wc })
      arr.push({ pos: [wx - w / 2 - 0.01, y, wz + z], rot: -Math.PI / 2, color: wc })
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

/* Add horizontal ledge lines on facades */
function addLedges(arr, wx, wz, w, h, d, seed, color) {
  const rng = mulberry32(seed + 7777)
  const ledgeCount = Math.floor(h / 6) + 1
  for (let i = 0; i < ledgeCount; i++) {
    const y = (i + 1) * (h / (ledgeCount + 1))
    if (rng() > 0.7) continue
    // front+back
    arr.push({ pos: [wx, y, wz + d / 2 + 0.02], scale: [w + 0.1, 0.08, 0.08], color })
    arr.push({ pos: [wx, y, wz - d / 2 - 0.02], scale: [w + 0.1, 0.08, 0.08], color })
    // sides
    arr.push({ pos: [wx + w / 2 + 0.02, y, wz], scale: [0.08, 0.08, d + 0.1], color })
    arr.push({ pos: [wx - w / 2 - 0.02, y, wz], scale: [0.08, 0.08, d + 0.1], color })
  }
}

function computeAllInstances(districts) {
  const bodies = [], windows = [], edges = [], details = [], godRays = []
  const cylBodies = [] // separate array for cylinder buildings
  const buildingMap = [], buildingCenters = [], windowRanges = [], edgeRanges = []
  let bi = 0

  districts.forEach(({ center, artists, color, genre, streets }) => {
    if (!streets) return

    streets.forEach((street) => {
      street.buildings.forEach((bldg) => {
        const wx = center[0] + bldg.localX
        const wz = center[2] + street.z + bldg.localZ
        const h = scaleH(bldg.playCount)
        const type = bType(bldg.playCount, bldg.artist + bldg.song)
        const seed = bi * 137.5
        const nameKey = bldg.artist + ' - ' + bldg.song
        const info = {
          artist: bldg.artist, genre, playCount: bldg.playCount,
          topTrack: bldg.song, song: bldg.song,
          worldPos: [wx, 0, wz], height: h
        }

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
          addLedges(edges, wx, wz, bW, midH, bD, seed, color.neon)
          details.push(
            { type: 'cylinder', args: [0.04, 0.3, spH, 4], pos: [wx, midH + topH + spH / 2, wz], color: color.neon },
            { type: 'sphere', args: [0.15, 4, 4], pos: [wx, h + spH + 0.5, wz], color: color.neon },
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
          addLedges(edges, wx, wz, bW, bH, bD, seed, color.neon)
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
          addLedges(edges, wx, wz, w, h, d, seed, color.neon)
          // Single antenna
          details.push({ type: 'cylinder', args: [0.02, 0.02, 3, 3], pos: [wx, h + 1.5, wz], color: color.neon })
        } else if (type === 'cylinder') {
          const r = 1.2 + (hashStr(nameKey) % 5) * 0.15
          cylBodies.push({ pos: [wx, h / 2, wz], radius: r, height: h, info })
          buildingMap.push(info)
          // Simplified windows for cylinder — just edges
          addEdges(edges, wx, wz, 0, r * 1.8, h, r * 1.8, color.neon)
          addLedges(edges, wx, wz, r * 2, h, r * 2, seed, color.neon)
          // Water tank on top
          details.push(
            { type: 'cylinder', args: [0.5, 0.5, 0.8, 8], pos: [wx, h + 0.4, wz], color: '#181818' },
          )
        } else if (type === 'lshape') {
          // L-shape: two overlapping boxes
          const w1 = 3.2, d1 = 2.0, w2 = 2.0, d2 = 2.0
          bodies.push({ pos: [wx, h / 2, wz - 0.5], scale: [w1, h, d1] })
          buildingMap.push(info)
          bodies.push({ pos: [wx + 0.8, h / 2, wz + 1.0], scale: [w2, h * 0.8, d2] })
          buildingMap.push(info)
          addWindows(windows, wx, wz - 0.5, 0, w1, h, d1, seed, color.neon)
          addWindows(windows, wx + 0.8, wz + 1.0, 0, w2, h * 0.8, d2, seed + 50, color.neon)
          addEdges(edges, wx, wz - 0.5, 0, w1, h, d1, color.neon)
          addEdges(edges, wx + 0.8, wz + 1.0, 0, w2, h * 0.8, d2, color.neon)
          addLedges(edges, wx, wz - 0.5, w1, h, d1, seed, color.neon)
          details.push({ type: 'box', args: [0.5, 0.4, 0.5], pos: [wx - 0.6, h + 0.2, wz - 0.5], color: '#181818' })
        } else if (type === 'stepped') {
          // 2-3 stacked boxes with decreasing width
          const steps = 2 + (hashStr(nameKey) % 2)
          let yOff = 0
          for (let s = 0; s < steps; s++) {
            const frac = 1 - s * 0.25
            const stepH = h / steps
            const sw = 3.2 * frac, sd = 2.8 * frac
            bodies.push({ pos: [wx, yOff + stepH / 2, wz], scale: [sw, stepH, sd] })
            buildingMap.push(info)
            addWindows(windows, wx, wz, yOff, sw, stepH, sd, seed + s * 100, color.neon)
            addEdges(edges, wx, wz, yOff, sw, stepH, sd, color.neon)
            if (s === 0) addLedges(edges, wx, wz, sw, stepH, sd, seed, color.neon)
            yOff += stepH
          }
          details.push({ type: 'box', args: [0.4, 0.3, 0.4], pos: [wx, h + 0.15, wz], color: '#181818' })
        } else {
          // block
          const w = 3.6, d = 3.0
          bodies.push({ pos: [wx, h / 2, wz], scale: [w, h, d] })
          buildingMap.push(info)
          addWindows(windows, wx, wz, 0, w, h, d, seed, color.neon)
          addEdges(edges, wx, wz, 0, w, h, d, color.neon)
          addLedges(edges, wx, wz, w, h, d, seed, color.neon)
          // Single AC unit on rooftop
          details.push({ type: 'box', args: [0.6, 0.4, 0.6], pos: [wx - 0.5, h + 0.2, wz + 0.5], color: '#181818' })
        }

        windowRanges.push([winStart, windows.length])
        edgeRanges.push([edgeStart, edges.length])
        bi++
      })
    })
  })

  return { bodies, windows, edges, details, godRays, cylBodies, buildingMap, buildingCenters, windowRanges, edgeRanges }
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
  const cylRef = useRef()
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
    if (cylRef.current) {
      const dummy = new THREE.Object3D()
      data.cylBodies.forEach((c, i) => {
        dummy.position.set(c.pos[0], c.pos[1], c.pos[2])
        dummy.scale.set(c.radius, c.height, c.radius)
        dummy.rotation.set(0, 0, 0)
        dummy.updateMatrix()
        cylRef.current.setMatrixAt(i, dummy.matrix)
      })
      cylRef.current.instanceMatrix.needsUpdate = true
    }
    if (windowRef.current) {
      setupWindows(windowRef.current, data.windows)
      windowOriginals.current = new Float32Array(windowRef.current.instanceMatrix.array)
    }
    if (edgeRef.current) {
      setupEdges(edgeRef.current, data.edges)
      edgeOriginals.current = new Float32Array(edgeRef.current.instanceMatrix.array)
    }
  }, [data])

  // LOD + window flicker
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

    // Window flicker — toggle 3 random windows on/off
    if (windowOriginals.current) {
      const total = data.windows.length
      for (let f = 0; f < 3; f++) {
        const idx = (frameCount.current * 7 + f * 131) % total
        const isOff = windowRef.current.instanceMatrix.array[idx * 16] === 0 && windowRef.current.instanceMatrix.array[idx * 16 + 15] === 1
        if (isOff) {
          windowRef.current.instanceMatrix.array.set(windowOriginals.current.subarray(idx * 16, idx * 16 + 16), idx * 16)
        } else if (Math.random() > 0.7) {
          windowRef.current.instanceMatrix.array.set(ZERO_MAT, idx * 16)
        }
      }
      wDirty = true
    }

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

  if (!data.bodies.length && !data.cylBodies.length) return null

  return (
    <group>
      {/* Box building bodies */}
      {data.bodies.length > 0 && (
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
      )}

      {/* Cylinder building bodies */}
      {data.cylBodies.length > 0 && (
        <instancedMesh
          ref={cylRef}
          args={[null, null, data.cylBodies.length]}
          onClick={(e) => {
            e.stopPropagation()
            const b = data.cylBodies[e.instanceId]?.info
            if (b) onSelect(b)
          }}
          onPointerOver={(e) => {
            e.stopPropagation()
            document.body.style.cursor = 'pointer'
            const b = data.cylBodies[e.instanceId]?.info
            if (b) onHover(b)
          }}
          onPointerOut={handleOut}
          frustumCulled={false}
        >
          <cylinderGeometry args={[1, 1, 1, 12]} />
          <meshStandardMaterial color="#08080f" roughness={0.15} metalness={0.9} />
        </instancedMesh>
      )}

      {/* Windows */}
      {data.windows.length > 0 && (
        <instancedMesh ref={windowRef} args={[null, null, data.windows.length]} frustumCulled={false}>
          <planeGeometry args={[0.25, 0.35]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.9} toneMapped={false} />
        </instancedMesh>
      )}

      {/* Edge glows + ledges */}
      {data.edges.length > 0 && (
        <instancedMesh ref={edgeRef} args={[null, null, data.edges.length]} frustumCulled={false}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </instancedMesh>
      )}

      {/* Rooftop details */}
      {data.details.map((d, i) => (
        <mesh key={i} position={d.pos} rotation={d.rot || [0, 0, 0]}>
          {d.type === 'cylinder' && <cylinderGeometry args={d.args} />}
          {d.type === 'box' && <boxGeometry args={d.args} />}
          {d.type === 'ring' && <ringGeometry args={d.args} />}
          {d.type === 'sphere' && <sphereGeometry args={d.args} />}
          <meshBasicMaterial color={d.color} toneMapped={false} />
        </mesh>
      ))}

      {/* God ray cones */}
      {data.godRays.map((g, i) => (
        <mesh key={`gr${i}`} position={g.pos}>
          <cylinderGeometry args={[0.05, 2.5, 40, 8, 1, true]} />
          <meshBasicMaterial color={g.color} transparent opacity={0.03} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}
