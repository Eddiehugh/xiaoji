import { useEffect, useState } from 'react'
import { Icon } from './Icon'
import { DisplayImage } from './DisplayImage'

export function VlogPreview({ assets, playing, onPlay }) {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    if (!playing || !assets.length) return undefined
    const timer = setInterval(() => setFrame((current) => (current + 1) % assets.length), 1200)
    return () => clearInterval(timer)
  }, [playing, assets.length])

  return (
    <div className="vlog-preview">
      <DisplayImage asset={assets[frame]} alt="Vlog 当前画面" />
      <div className="vlog-shade">
        <b>西安，和小橘走过的三天</b>
        <span>DAY {Math.min(frame + 1, 3)} · XI&apos;AN</span>
      </div>
      <button className="play" onClick={onPlay} aria-label={playing ? '暂停' : '播放'}>
        <Icon name="play" size={24} />
      </button>
      <div className={`progress ${playing ? 'run' : ''}`}>
        <i />
      </div>
    </div>
  )
}
