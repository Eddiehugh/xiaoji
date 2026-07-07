import { useRef } from 'react'
import { Icon } from './Icon'

export function AssetRail({ assets, onFiles, analysing }) {
  const inputRef = useRef(null)

  const acceptFiles = (list) => onFiles(Array.from(list || []).filter((file) => file.type.startsWith('image/')))

  return (
    <aside className="asset-rail">
      <div className="panel-title">
        <h2>素材</h2>
        <span>{assets.length} 张</span>
      </div>
      <button
        className={`dropzone ${analysing ? 'analysing' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          acceptFiles(e.dataTransfer.files)
        }}
      >
        <Icon name={analysing ? 'spark' : 'upload'} size={24} />
        <strong>{analysing ? '正在理解照片…' : '继续上传'}</strong>
        <span>{analysing ? '提取时间、地点与场景' : '拖拽照片到这里'}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => acceptFiles(e.target.files)}
      />
      <div className="asset-grid">
        {assets.map((asset, index) => (
          <figure key={asset.id} className="asset-thumb" style={{ '--delay': `${index * 30}ms` }}>
            <img src={asset.src} alt={asset.alt || '旅行素材'} />
            {asset.isNew ? <span className="new-dot" title="新上传" /> : null}
          </figure>
        ))}
      </div>
      <p className="rail-foot">上传素材会保存在浏览器本地，刷新页面后仍可恢复。</p>
    </aside>
  )
}
