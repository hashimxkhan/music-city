import { Suspense, useState, useRef, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { buildDistrictData } from '../../data/musicData'
import Buildings from './Buildings'
import District from './District'
import Ground from './Ground'
import Sky from './Sky'

/* ========== Camera Rig — single consolidated useFrame ========== */
function CameraRig({ flyTarget, onIntroComplete }) {
  const { camera } = useThree()
  const controlsRef = useRef()
  const phase = useRef('intro')
  const introT = useRef(0)
  const flyT = useRef(0)
  const flyFrom = useRef(new THREE.Vector3())
  const flyFromTarget = useRef(new THREE.Vector3())
  const flyToPos = useRef(new THREE.Vector3())
  const flyToTarget = useRef(new THREE.Vector3())
  const prevFlyTarget = useRef(null)

  const introStart = new THREE.Vector3(120, 90, 120)
  const introEnd = new THREE.Vector3(0, 60, 90)

  // Single useFrame handles intro, flyTo, and idle
  useFrame((state, delta) => {
    const controls = controlsRef.current
    if (!controls) return

    // Intro phase
    if (phase.current === 'intro') {
      introT.current += delta * 0.28
      const t = easeInOutCubic(Math.min(introT.current, 1))
      camera.position.lerpVectors(introStart, introEnd, t)
      camera.lookAt(0, 0, 0)
      controls.target.set(0, 0, 0)
      controls.update()
      if (introT.current >= 1) {
        phase.current = 'idle'
        controls.enabled = true
        onIntroComplete?.()
      }
      return
    }

    // Fly-to trigger check
    if (flyTarget && flyTarget !== prevFlyTarget.current) {
      prevFlyTarget.current = flyTarget
      flyFrom.current.copy(camera.position)
      flyFromTarget.current.copy(controls.target)
      const wp = flyTarget.worldPos
      flyToPos.current.set(wp[0] + 12, flyTarget.height + 10, wp[2] + 12)
      flyToTarget.current.set(wp[0], flyTarget.height * 0.5, wp[2])
      flyT.current = 0
      phase.current = 'flyTo'
      controls.enabled = false
    }

    // Fly-to phase
    if (phase.current === 'flyTo') {
      flyT.current += delta * 1.2
      const t = easeInOutCubic(Math.min(flyT.current, 1))
      camera.position.lerpVectors(flyFrom.current, flyToPos.current, t)
      controls.target.lerpVectors(flyFromTarget.current, flyToTarget.current, t)
      controls.update()
      if (flyT.current >= 1) {
        phase.current = 'idle'
        controls.enabled = true
      }
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enabled={false}
      enablePan
      enableZoom
      enableRotate
      maxPolarAngle={Math.PI / 2 - 0.02}
      minDistance={5}
      maxDistance={180}
      target={[0, 0, 0]}
      dampingFactor={0.04}
      enableDamping
      rotateSpeed={0.5}
      zoomSpeed={0.8}
    />
  )
}

/* ========== Main scene ========== */
export default function CityScene({ data, onSelect, onHover }) {
  const [flyTarget, setFlyTarget] = useState(null)
  const districts = buildDistrictData(data)

  const handleSelect = useCallback((info) => {
    setFlyTarget(info)
    onSelect?.(info)
  }, [onSelect])

  const handleHover = useCallback((info) => {
    onHover?.(info)
  }, [onHover])

  return (
    <Canvas
      camera={{ position: [120, 90, 120], fov: 50, near: 0.1, far: 800 }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 0.7,
        powerPreference: 'high-performance',
      }}
      style={{ background: '#000008' }}
      dpr={[1, 1.5]}
    >
      <Suspense fallback={null}>
        {/* Atmosphere */}
        <fog attach="fog" color="#000012" near={50} far={250} />
        <ambientLight intensity={0.06} color="#0011ff" />
        <directionalLight position={[40, 60, -30]} intensity={0.1} color="#220066" />
        <hemisphereLight args={['#000022', '#000008', 0.15]} />

        {/* Low fog plane — static, no useFrame */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 4, 0]}>
          <planeGeometry args={[500, 500]} />
          <meshBasicMaterial color="#0a0020" transparent opacity={0.12} depthWrite={false} />
        </mesh>

        {/* Scene */}
        <Ground />
        <Sky />
        <Buildings districts={districts} onSelect={handleSelect} onHover={handleHover} />
        {districts.map((d) => (
          <District key={d.genre} {...d} />
        ))}

        <CameraRig flyTarget={flyTarget} onIntroComplete={() => {}} />

        {/* Post-processing — bloom is essential for the neon aesthetic */}
        <EffectComposer>
          <Bloom intensity={1.4} luminanceThreshold={0.15} luminanceSmoothing={0.9} mipmapBlur />
          <Vignette eskil={false} offset={0.1} darkness={0.8} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  )
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}
