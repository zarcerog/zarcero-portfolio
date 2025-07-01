import React from 'react'

function FilmGrainOverlay() {
  return (
    <div
        className="fixed inset-0 opacity-15 pointer-events-none z-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grainFilter'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.95' numOctaves='8' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grainFilter)'/%3E%3C/svg%3E")`,
          mixBlendMode: "screen",
        }}
    />
  )
}

export default FilmGrainOverlay