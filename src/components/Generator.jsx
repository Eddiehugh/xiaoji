import { useMemo, useState } from 'react'
import { downloadPlogImage } from '../lib/plogExport'
import { Icon } from './Icon'
import { PlogPreview } from './PlogPreview'
import { VlogPreview } from './VlogPreview'

export function Generator({ events, assets, mode, setMode }) {
  const [style, setStyle] = useState('journal')
  const [state, setState] = useState('idle')
  const [playing, setPlaying] = useState(false)
  const assetsById = useMemo(() => Object.fromEntries(assets.map((asset) => [asset.id, asset])), [assets])

  const generate = () => {
    setState('working')
    setPlaying(false)
    setTimeout(() => {
      setState('done')
      if (mode === 'vlog') setPlaying(true)
    }, 1450)
  }

  const downloadPlog = () => downloadPlogImage({ events, assetsById })

  return (
    <aside className="generator">
      <h2>生成作品</h2>
      <div className="tabs">
        <button
          className={mode === 'plog' ? 'active' : ''}
          onClick={() => {
            setMode('plog')
            setState('idle')
          }}
        >
          Plog
        </button>
        <button
          className={mode === 'vlog' ? 'active' : ''}
          onClick={() => {
            setMode('vlog')
            setState('idle')
          }}
        >
          Vlog
        </button>
      </div>
      <div className="preview-label">
        <span>预览</span>
        <span>{mode === 'plog' ? '3:4 长图' : '9:16 · 30 秒'}</span>
      </div>
      {mode === 'plog' ? (
        <PlogPreview events={events} assetsById={assetsById} style={style} />
      ) : (
        <VlogPreview assets={assets} playing={playing} onPlay={() => setPlaying((current) => !current)} />
      )}
      <label className="style-select">
        <span>风格</span>
        <select value={style} onChange={(e) => setStyle(e.target.value)}>
          <option value="journal">温暖手账</option>
          <option value="editorial">旅行杂志</option>
          <option value="minimal">极简留白</option>
        </select>
      </label>
      <button className={`primary generate ${state}`} onClick={state === 'done' && mode === 'plog' ? downloadPlog : generate}>
        <Icon name={state === 'done' && mode === 'plog' ? 'download' : 'spark'} />
        {state === 'working' ? '正在生成…' : state === 'done' && mode === 'plog' ? '下载 Plog' : state === 'done' ? '重新生成' : '生成作品'}
      </button>
      <p className="generator-foot">{state === 'done' ? '作品已生成，可继续调整风格。' : '将自动使用时间线与选中素材生成作品'}</p>
    </aside>
  )
}
