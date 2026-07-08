import { useMemo, useRef, useState } from 'react'
import OrbitImages from './OrbitImages'
import { Icon } from './Icon'

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function ToyDesigner({ figurines, setFigurines }) {
  const inputRef = useRef(null)
  const [style, setStyle] = useState('旅行摄影师')
  const orbitImages = useMemo(() => figurines.map((item) => item.src), [figurines])

  const addFiles = async (files) => {
    const images = await Promise.all(
      Array.from(files || [])
        .filter((file) => file.type.startsWith('image/'))
        .slice(0, 6)
        .map(async (file, index) => ({
          id: `${Date.now()}-${index}`,
          name: `${style}手办 ${figurines.length + index + 1}`,
          style,
          src: await fileToDataUrl(file),
        })),
    )
    setFigurines((current) => [...images, ...current].slice(0, 8))
  }

  return (
    <section className="toy-designer">
      <div className="toy-copy">
        <span>玩偶手办</span>
        <strong>先设计你的旅行分身</strong>
        <p>上传个人照片，可生成多个手办形象；后续 Plog / Vlog 会额外生成“手办旅行”版本。</p>
      </div>
      <OrbitImages
        images={orbitImages.length ? orbitImages : ['/assets/xian-bell-tower.png', '/assets/xian-city-wall.png', '/assets/xian-noodles.png']}
        radiusX={132}
        radiusY={44}
        itemSize={58}
        duration={22}
        centerContent={
          <div className="toy-core">
            <span>迹</span>
            <small>{figurines.length ? `${figurines.length} 个手办` : '上传照片'}</small>
          </div>
        }
      />
      <div className="toy-actions">
        <select value={style} onChange={(event) => setStyle(event.target.value)}>
          <option value="旅行摄影师">旅行摄影师</option>
          <option value="城市探索家">城市探索家</option>
          <option value="胶片日记主角">胶片日记主角</option>
          <option value="未来机能风">未来机能风</option>
        </select>
        <button type="button" className="secondary" onClick={() => inputRef.current?.click()}>
          <Icon name="upload" />
          上传生成手办
        </button>
        <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(event) => addFiles(event.target.files)} />
      </div>
    </section>
  )
}
