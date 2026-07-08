import { useMemo } from 'react'
import { motion } from 'motion/react'
import './OrbitImages.css'

export default function OrbitImages({
  images = [],
  altPrefix = 'Orbiting image',
  radiusX = 340,
  radiusY = 80,
  rotation = -8,
  duration = 30,
  itemSize = 80,
  direction = 'normal',
  className = '',
  centerContent,
  paused = false,
}) {
  const safeImages = useMemo(() => images.filter(Boolean).slice(0, 8), [images])
  const directionValue = direction === 'reverse' ? -360 : 360

  return (
    <div className={`orbit-container ${className}`} aria-hidden="true">
      <motion.div
        className="orbit-rotation-wrapper"
        style={{ width: radiusX * 2 + itemSize, height: radiusY * 2 + itemSize, rotate: rotation }}
        animate={paused ? {} : { rotate: [rotation, rotation + directionValue] }}
        transition={{ duration, repeat: Infinity, ease: 'linear' }}
      >
        {safeImages.map((src, index) => {
          const angle = (index / Math.max(safeImages.length, 1)) * Math.PI * 2
          const x = radiusX * Math.cos(angle)
          const y = radiusY * Math.sin(angle)
          return (
            <div
              className="orbit-item"
              key={`${src}-${index}`}
              style={{
                width: itemSize,
                height: itemSize,
                transform: `translate(${x}px, ${y}px) rotate(${-rotation}deg)`,
              }}
            >
              <img src={src} alt={`${altPrefix} ${index + 1}`} draggable={false} className="orbit-image" />
            </div>
          )
        })}
      </motion.div>
      {centerContent ? <div className="orbit-center-content">{centerContent}</div> : null}
    </div>
  )
}
