import { Text } from '@react-three/drei'
import { MAX_PLAY } from '../../data/musicData'

/* Static neon signs — no useFrame, no animation overhead.
   Bloom handles the glow. ~30 Text components max. */
export default function NeonSigns({ districts }) {
  const signs = []
  let signIdx = 0

  districts.forEach(({ center, color, streets }) => {
    if (!streets) return
    streets.forEach((street) => {
      street.buildings.forEach((bldg, bi) => {
        if (bi % 4 !== 0) return // every 4th building
        if (signIdx >= 30) return
        const wx = center[0] + bldg.localX
        const wz = center[2] + street.z + bldg.localZ
        const h = 2.5 + (bldg.playCount / MAX_PLAY) * 23.5
        const side = bldg.side > 0 ? 1 : -1

        signs.push({
          key: signIdx++,
          pos: [wx, h * 0.55 + 1, wz + side * 2.0],
          text: bldg.song.length > 12 ? bldg.song.substring(0, 11) + '..' : bldg.song,
          color: color.neon,
          rot: [0, side > 0 ? 0 : Math.PI, 0],
        })
      })
    })
  })

  return (
    <group>
      {signs.map((s) => (
        <Text
          key={s.key}
          position={s.pos}
          rotation={s.rot}
          fontSize={0.28}
          color={s.color}
          anchorX="center"
          anchorY="middle"
          maxWidth={3.5}
        >
          {s.text.toUpperCase()}
          <meshBasicMaterial color={s.color} toneMapped={false} transparent opacity={0.85} />
        </Text>
      ))}
    </group>
  )
}
