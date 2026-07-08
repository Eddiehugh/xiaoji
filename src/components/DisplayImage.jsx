import { useEffect, useState } from 'react'
import { resolveDisplaySrc } from '../lib/displayImage'

export function DisplayImage({ asset, alt, className }) {
  const [source, setSource] = useState(asset?.src || '')
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    setFailed(false)
    setSource(asset?.src || '')

    resolveDisplaySrc(asset)
      .then((nextSource) => {
        if (!cancelled) setSource(nextSource)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })

    return () => {
      cancelled = true
    }
  }, [asset])

  if (!asset?.src || failed) {
    return <span className={`image-fallback ${className || ''}`}>图片暂不可预览</span>
  }

  return <img className={className} src={source} alt={alt || asset?.alt || asset?.name || '旅行图片'} />
}
