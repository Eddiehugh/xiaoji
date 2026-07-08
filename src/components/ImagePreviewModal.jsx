import { useEffect, useState } from 'react'
import { Icon } from './Icon'
import { DisplayImage } from './DisplayImage'
import { resolveDisplaySrc } from '../lib/displayImage'

export function ImagePreviewModal({ asset, onClose }) {
  const [displayHref, setDisplayHref] = useState(asset?.src || '')

  useEffect(() => {
    let cancelled = false
    setDisplayHref(asset?.src || '')
    resolveDisplaySrc(asset).then((src) => {
      if (!cancelled) setDisplayHref(src)
    })
    return () => {
      cancelled = true
    }
  }, [asset])

  if (!asset) return null

  return (
    <div className="image-preview-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="image-preview" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" type="button" onClick={onClose} aria-label="关闭图片预览">
          <Icon name="close" />
        </button>
        <DisplayImage asset={asset} alt={asset.alt || asset.name || '旅行图片'} />
        <div className="image-preview-meta">
          <strong>{asset.alt || asset.name || '旅行图片'}</strong>
          <a href={displayHref || asset.src} target="_blank" rel="noreferrer">
            新窗口打开
          </a>
        </div>
      </div>
    </div>
  )
}
