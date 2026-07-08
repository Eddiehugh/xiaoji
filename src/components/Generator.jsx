import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { downloadPlogImage } from '../lib/plogExport'
import { Icon } from './Icon'
import { PlogPreview } from './PlogPreview'
import { ProjectFigurineStudio } from './ProjectFigurineStudio'
import { VlogPreview } from './VlogPreview'

const STYLE_OPTIONS = [
  ['journal', '胶片'],
  ['editorial', '清新'],
  ['minimal', '复古'],
  ['toy', '日系'],
  ['cinematic', '电影感'],
  ['custom', '自定义'],
]

const STYLE_LABELS = Object.fromEntries(STYLE_OPTIONS)

export function Generator({ trip, events, assets, figurines = [], onFigurinesChange, mode, setMode }) {
  const [style, setStyle] = useState('journal')
  const [customStyle, setCustomStyle] = useState('')
  const [withFigurine, setWithFigurine] = useState(true)
  const [state, setState] = useState('idle')
  const [job, setJob] = useState(null)
  const [error, setError] = useState('')
  const [playing, setPlaying] = useState(false)
  const [generatedByKey, setGeneratedByKey] = useState({})
  const assetsById = useMemo(() => Object.fromEntries(assets.map((asset) => [asset.id, asset])), [assets])
  const activeStyleLabel = style === 'custom' ? customStyle.trim() || '自定义风格' : STYLE_LABELS[style] || style
  const generationKey = `${trip?.id || 'trip'}:${mode}:${activeStyleLabel}:${withFigurine ? 'figurine' : 'plain'}`
  const generatedResult = generatedByKey[generationKey]

  useEffect(() => {
    setState('idle')
    setJob(null)
    setError('')
    setPlaying(false)
  }, [trip?.id])

  useEffect(() => {
    if (generatedResult) {
      setJob(generatedResult.job)
      setState('done')
      if (mode === 'vlog') setPlaying(true)
      return
    }
    setState('idle')
    setJob(null)
    setPlaying(false)
  }, [generatedResult, mode])

  const pollJob = async (jobId, key) => {
    const next = await api.getJob(jobId)
    setJob(next.job)
    if (next.job.status === 'done') {
      setGeneratedByKey((current) => ({
        ...current,
        [key]: {
          job: next.job,
          style: activeStyleLabel,
          mode,
          withFigurine,
          generatedAt: Date.now(),
        },
      }))
      setState('done')
      if (mode === 'vlog') setPlaying(true)
      return
    }
    if (next.job.status === 'failed') {
      setState('failed')
      setError(next.job.error || '生成失败')
      return
    }
    setTimeout(() => pollJob(jobId, key), 900)
  }

  const generate = async () => {
    if (!trip?.id) return
    setState('working')
    setPlaying(false)
    setError('')
    try {
      const result = await api.createGenerationJob(trip.id, { mode, style: activeStyleLabel, withFigurine })
      setJob(result.job)
      pollJob(result.job.id, generationKey)
    } catch (requestError) {
      setState('failed')
      setError(requestError.message)
    }
  }

  const downloadPlog = () => downloadPlogImage({ events, assetsById })

  return (
    <aside className="generator">
      <div className="generator-title">
        <h2>生成作品</h2>
        <span>项目独立配置</span>
      </div>
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
      <div className="generator-section-title">
        <span>模板选择</span>
        <small>{mode === 'plog' ? '胶片日记' : '动态短片'}</small>
      </div>
      <div className="template-preview">
        {mode === 'plog' ? (
          <PlogPreview trip={trip} events={events} assets={assets} style={style} generatedResult={generatedResult} withFigurine={withFigurine} />
        ) : (
          <VlogPreview assets={assets} playing={playing} onPlay={() => setPlaying((current) => !current)} />
        )}
      </div>
      <ProjectFigurineStudio figurines={figurines} onChange={onFigurinesChange} />
      <div className="generator-section-title">
        <span>风格选择</span>
        <small>{activeStyleLabel}</small>
      </div>
      <div className="style-grid" role="group" aria-label="风格选择">
        {STYLE_OPTIONS.map(([value, label]) => (
          <button key={value} type="button" className={style === value ? 'active' : ''} onClick={() => setStyle(value)}>
            {label}
          </button>
        ))}
      </div>
      {style === 'custom' ? (
        <label className="custom-style">
          <span>自定义</span>
          <input value={customStyle} onChange={(event) => setCustomStyle(event.target.value)} placeholder="例如：赛博胶片、雪山童话、复古漫画" />
        </label>
      ) : null}
      <label className="figurine-toggle">
        <input type="checkbox" checked={withFigurine} onChange={(event) => setWithFigurine(event.target.checked)} />
        额外生成手办旅行版本{figurines.length ? ` · ${figurines.length} 个手办` : ''}
      </label>
      <div className="generator-section-title">
        <span>音乐选择</span>
      </div>
      <div className="music-card">
        <span className="music-cover">♪</span>
        <div>
          <strong>Sunset Drive</strong>
          <small>Ghostwriter Official</small>
        </div>
        <i />
      </div>
      <div className="generator-section-title">
        <span>画面比例</span>
      </div>
      <div className="ratio-grid">
        <button type="button">9:16</button>
        <button type="button" className="active">16:9</button>
        <button type="button">1:1</button>
      </div>
      <button className={`primary generate ${state}`} onClick={state === 'done' && mode === 'plog' ? downloadPlog : generate}>
        <Icon name={state === 'done' && mode === 'plog' ? 'download' : 'spark'} />
        {state === 'working' ? 'AI生成中…' : state === 'done' && mode === 'plog' ? '下载 Plog' : state === 'done' ? '重新生成' : '生成作品'}
      </button>
      {job ? <p className="job-line">{job.message || (job.status === 'running' ? 'AI生成中' : `任务 ${job.status}`)} · {activeStyleLabel} · 尝试 {job.attempts || 1} 次</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      <p className="generator-foot">{state === 'done' ? '作品任务已完成，可继续调整风格或重试。' : '任务队列会记录状态，失败后可重试'}</p>
    </aside>
  )
}
