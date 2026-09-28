'use client'

import { useMemo } from 'react'

interface FlorLogoProps {
  size?: number
  dotColor?: string
  className?: string
}

interface Dot {
  x: number
  y: number
  r: number
}

function generateFlowerDots(): Dot[] {
  const cx = 50
  const cy = 50
  const d = 16
  const lobeR = 17
  const centerR = 12
  const dotsPerLobe = 18
  const dotsCenter = 16

  const dots: Dot[] = []

  const lobes = [
    { cx: cx - d, cy: cy - d },
    { cx: cx + d, cy: cy - d },
    { cx: cx + d, cy: cy + d },
    { cx: cx - d, cy: cy + d },
  ]

  for (let li = 0; li < lobes.length; li++) {
    const lobe = lobes[li]
    for (let i = 0; i < dotsPerLobe; i++) {
      const angle = (2 * Math.PI * i) / dotsPerLobe
      const x = lobe.cx + lobeR * Math.cos(angle)
      const y = lobe.cy + lobeR * Math.sin(angle)

      const dcx = x - cx
      const dcy = y - cy
      const distToCenter = Math.sqrt(dcx * dcx + dcy * dcy)
      if (distToCenter < centerR - 1) continue

      let overlaps = 0
      for (let j = 0; j < lobes.length; j++) {
        if (j === li) continue
        const ddx = x - lobes[j].cx
        const ddy = y - lobes[j].cy
        if (Math.sqrt(ddx * ddx + ddy * ddy) < lobeR) overlaps++
      }

      const r = overlaps === 0 ? 1.8 : overlaps === 1 ? 1.2 : 0.7
      dots.push({ x, y, r })
    }
  }

  for (let i = 0; i < dotsCenter; i++) {
    const angle = (2 * Math.PI * i) / dotsCenter
    dots.push({
      x: cx + centerR * Math.cos(angle),
      y: cy + centerR * Math.sin(angle),
      r: 1.8,
    })
  }

  return dots
}

export default function FlorLogo({
  size = 44,
  dotColor = '#FFFFFF',
  className = '',
}: FlorLogoProps) {
  const dots = useMemo(() => generateFlowerDots(), [])

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`flor-float ${className}`}
      style={{ overflow: 'visible' }}
    >
      {dots.map((dot, i) => (
        <circle
          key={i}
          cx={dot.x}
          cy={dot.y}
          r={dot.r}
          fill={dotColor}
        />
      ))}
    </svg>
  )
}
