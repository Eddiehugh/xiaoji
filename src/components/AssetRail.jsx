import { useRef } from 'react'
import { Icon } from './Icon'
import { ProjectList } from './ProjectList'

function isSupportedImage(file) {
  const name = file.name.toLowerCase()
  return file.type.startsWith('image/') || name.endsWith('.heic') || name.endsWith('.heif')
}

export function AssetRail({ assets, onFiles, analysing, trips, selectedTripId, onSelectTrip, onCreateTrip }) {
  const inputRef = useRef(null)

  const acceptFiles = (list) => onFiles(Array.from(list || []).filter(isSupportedImage))

  return (
    <aside className="asset-rail">
      <ProjectList trips={trips} selectedId={selectedTripId} onSelect={onSelectTrip} onCreate={onCreateTrip} />
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
        <strong>{analysing ? 'AI生成中' : '继续上传'}</strong>
        <span>{analysing ? '正在提取时间、地点与场景' : 'HEIC 会自动转为 JPEG 展示'}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
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
      <p className="rail-foot">上传素材会保存到后端对象存储，并触发 EXIF / OCR / 图片理解任务。</p>
    </aside>
  )
}
