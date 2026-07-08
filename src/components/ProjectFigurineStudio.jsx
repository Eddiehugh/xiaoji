import { useRef, useState } from 'react'
import { normalizeImagesForUpload } from '../lib/heic'
import { Icon } from './Icon'
import { DisplayImage } from './DisplayImage'

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function isSupportedPersonalImage(file) {
  const name = file.name.toLowerCase()
  return file.type.startsWith('image/') || name.endsWith('.heic') || name.endsWith('.heif')
}

export function ProjectFigurineStudio({ figurines = [], onChange }) {
  const inputRef = useRef(null)
  const [persona, setPersona] = useState('环球影城主角')
  const [creating, setCreating] = useState(false)

  const createFigurines = async (files) => {
    const sourceFiles = Array.from(files || []).filter(isSupportedPersonalImage)
    if (!sourceFiles.length || !onChange) return
    setCreating(true)
    try {
      const normalized = await normalizeImagesForUpload(sourceFiles)
      const next = await Promise.all(
        normalized
          .slice(0, 4)
          .map(async (file, index) => ({
            id: `${Date.now()}-${index}`,
            name: `${persona}手办 ${figurines.length + index + 1}`,
            style: persona,
            src: await fileToDataUrl(file),
            alt: `${persona}手办`,
            createdAt: Date.now(),
          })),
      )
      if (next.length) onChange([...next, ...figurines].slice(0, 8))
    } finally {
      setCreating(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const removeFigurine = (id) => onChange(figurines.filter((item) => item.id !== id))

  return (
    <section className="figurine-studio">
      <div className="generator-section-title">
        <span>玩偶手办</span>
        <small>{figurines.length ? `${figurines.length} 个已配置` : '当前项目专属'}</small>
      </div>
      <div className="figurine-controls">
        <select value={persona} onChange={(event) => setPersona(event.target.value)}>
          <option value="环球影城主角">环球影城主角</option>
          <option value="旅行摄影师">旅行摄影师</option>
          <option value="胶片日记女孩">胶片日记女孩</option>
          <option value="机能探索家">机能探索家</option>
        </select>
        <button type="button" className="mini-action" onClick={() => inputRef.current?.click()} disabled={creating}>
          <Icon name="spark" size={15} />
          {creating ? 'AI生成中' : '生成'}
        </button>
        <input ref={inputRef} type="file" accept="image/*,.heic,.heif" multiple hidden onChange={(event) => createFigurines(event.target.files)} />
      </div>
      <div className="figurine-grid">
        {figurines.length ? (
          figurines.map((item) => (
            <button key={item.id} type="button" className="figurine-card" onDoubleClick={() => removeFigurine(item.id)} title="双击移除">
              <DisplayImage asset={item} alt={item.alt || item.name} />
              <span>{item.style}</span>
            </button>
          ))
        ) : (
          <div className="figurine-empty">
            上传个人照片后，为这个旅行项目生成专属手办。
          </div>
        )}
      </div>
    </section>
  )
}
