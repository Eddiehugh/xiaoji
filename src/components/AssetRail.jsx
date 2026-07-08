import { useRef } from 'react'
import { Icon } from './Icon'
import { DisplayImage } from './DisplayImage'
import { ProjectList } from './ProjectList'

function isSupportedImage(file) {
  const name = file.name.toLowerCase()
  return file.type.startsWith('image/') || name.endsWith('.heic') || name.endsWith('.heif')
}

export function AssetRail({ assets, onFiles, onPreview, analysing, trips, selectedTripId, onSelectTrip, onCreateTrip }) {
  const inputRef = useRef(null)

  const acceptFiles = (list) => onFiles(Array.from(list || []).filter(isSupportedImage))

  return (
    <aside className="asset-rail">
      <ProjectList trips={trips} selectedId={selectedTripId} onSelect={onSelectTrip} onCreate={onCreateTrip} />
      <div className="panel-title">
        <h2>照片库</h2>
        <span>全部照片⌄</span>
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
          <button
            key={asset.id}
            type="button"
            className="asset-thumb"
            style={{ '--delay': `${index * 30}ms` }}
            onClick={() => onPreview(asset)}
            title="打开图片"
          >
            <DisplayImage asset={asset} alt={asset.alt || '旅行素材'} />
            {asset.isNew ? <span className="new-dot" title="新上传" /> : null}
          </button>
        ))}
      </div>
      <div className="rail-foot">
        <span>
          已选中 <strong>{assets.length}</strong> 张
        </span>
        <small>当前项目照片库</small>
      </div>
    </aside>
  )
}
