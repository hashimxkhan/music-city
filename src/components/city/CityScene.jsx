import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { buildDistrictData } from '../../data/musicData'
import District from './District'
import Ground from './Ground'
import StarSky from './Sky'
import InfoPanel from '../InfoPanel'

export default function CityScene({ data }) {
  const [selected, setSelected] = useState(null)
  const districts = buildDistrictData(data)

  return (
    <div className="w-full h-full relative">
      <Canvas
        shadows
        camera={{ position: [0, 45, 70], fov: 55, near: 0.1, far: 1000 }}
        gl={{ antialias: true, toneMapping: 4, toneMappingExposure: 0.8 }}
        style={{ background: '#000008' }}
      >
        <Suspense fallback={null}>
          {/* Atmosphere */}
          <fog attach="fog" color="#000018" near={40} far={200} />
          <ambientLight intensity={0.05} color="#0011ff" />
          <directionalLight position={[0, 50, 0]} intensity={0.1} color="#220066" />

          {/* City */}
          <Ground />
          <StarSky />

          {districts.map((district) => (
            <District
              key={district.genre}
              {...district}
              onBuildingSelect={setSelected}
            />
          ))}

          <OrbitControls
            makeDefault
            enablePan
            enableZoom
            enableRotate
            maxPolarAngle={Math.PI / 2 - 0.05}
            minDistance={5}
            maxDistance={150}
            target={[0, 0, 0]}
            dampingFactor={0.08}
            enableDamping
          />
        </Suspense>
      </Canvas>

      {selected && (
        <InfoPanel data={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
