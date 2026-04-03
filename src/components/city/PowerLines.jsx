import { useMemo } from 'react'
import { Line } from '@react-three/drei'
import { MAX_PLAY } from '../../data/musicData'

const MIN_H = 2.5, MAX_H = 26
const scaleH = pc => MIN_H + (pc / MAX_PLAY) * (MAX_H - MIN_H)

export default function PowerLines({ districts }) {
  const lines = useMemo(() => {
    const result = []

    districts.forEach(({ center, color, streets }) => {
      if (!streets) return
      streets.forEach((street) => {
        const sorted = [...street.buildings].sort((a, b) => a.localX - b.localX)
        for (let i = 0; i < sorted.length - 1; i++) {
          if (result.length >= 30) return
          const a = sorted[i], b = sorted[i + 1]
          if (a.side !== b.side) continue
          if (Math.abs(b.localX - a.localX) > 8) continue

          const ax = center[0] + a.localX
          const az = center[2] + street.z + a.localZ
          const bx = center[0] + b.localX
          const bz = center[2] + street.z + b.localZ
          const ah = scaleH(a.playCount), bh = scaleH(b.playCount)

          // 4-point catenary
          const points = [
            [ax, ah, az],
            [ax + (bx - ax) * 0.33, Math.min(ah, bh) - 1.5, az + (bz - az) * 0.33],
            [ax + (bx - ax) * 0.66, Math.min(ah, bh) - 1.5, az + (bz - az) * 0.66],
            [bx, bh, bz],
          ]

          result.push({
            points,
            color: (i + result.length) % 4 === 0 ? color.neon : '#191928',
            isNeon: (i + result.length) % 4 === 0,
          })
        }
      })
    })
    return result
  }, [districts])

  return (
    <group>
      {lines.map((line, i) => (
        <Line
          key={i}
          points={line.points}
          color={line.color}
          lineWidth={line.isNeon ? 1.2 : 0.5}
          transparent
          opacity={line.isNeon ? 0.6 : 0.3}
        />
      ))}
    </group>
  )
}
