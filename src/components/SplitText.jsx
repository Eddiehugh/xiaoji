import { useEffect, useMemo, useRef } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import './SplitText.css'

gsap.registerPlugin(useGSAP)

function splitText(text, splitType) {
  if (splitType === 'words') return text.split(/(\s+)/).filter(Boolean)
  return Array.from(text)
}

export default function SplitText({
  text = '',
  className = '',
  delay = 50,
  duration = 1.25,
  ease = 'power3.out',
  splitType = 'chars',
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  textAlign = 'center',
  tag = 'p',
  onLetterAnimationComplete,
}) {
  const ref = useRef(null)
  const parts = useMemo(() => splitText(text, splitType), [text, splitType])
  const Tag = tag || 'p'

  useGSAP(
    () => {
      if (!ref.current) return
      const targets = ref.current.querySelectorAll('.split-char')
      gsap.fromTo(
        targets,
        { ...from },
        {
          ...to,
          duration,
          ease,
          stagger: delay / 1000,
          onComplete: onLetterAnimationComplete,
        },
      )
    },
    { dependencies: [text, delay, duration, ease, splitType, JSON.stringify(from), JSON.stringify(to)], scope: ref },
  )

  useEffect(() => () => gsap.killTweensOf(ref.current?.querySelectorAll('.split-char')), [])

  return (
    <Tag ref={ref} className={`split-parent ${className}`} style={{ textAlign }}>
      {parts.map((part, index) => (
        <span className="split-char" key={`${part}-${index}`}>
          {part === ' ' ? '\u00a0' : part}
        </span>
      ))}
    </Tag>
  )
}
