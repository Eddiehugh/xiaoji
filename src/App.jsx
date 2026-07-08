import { useEffect, useMemo, useState } from 'react'
import { AssetRail } from './components/AssetRail'
import { Generator } from './components/Generator'
import { Header } from './components/Header'
import LiquidEther from './components/LiquidEther'
import { LoginPanel } from './components/LoginPanel'
import { ImagePreviewModal } from './components/ImagePreviewModal'
import { NewTripModal } from './components/NewTripModal'
import { SharePage } from './components/SharePage'
import { Workspace } from './components/Workspace'
import { api, getStoredSession, login, logout } from './lib/api'
import { normalizeImagesForUpload } from './lib/heic'

export function App() {
  const shareMatch = window.location.pathname.match(/^\/share\/([^/]+)/)
  const [session, setSession] = useState(() => getStoredSession())
  const [trips, setTrips] = useState([])
  const [trip, setTrip] = useState(null)
  const [uploads, setUploads] = useState([])
  const [events, setEvents] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [analysing, setAnalysing] = useState(false)
  const [mode, setMode] = useState('plog')
  const [showNew, setShowNew] = useState(false)
  const [syncStatus, setSyncStatus] = useState('连接后端中…')
  const [loginError, setLoginError] = useState('')
  const [shareUrl, setShareUrl] = useState('')
  const [previewAsset, setPreviewAsset] = useState(null)

  const assets = useMemo(() => [...uploads, ...(trip?.seedAssets || [])], [uploads, trip])

  const refreshTrips = async () => {
    const result = await api.getTrips()
    setTrips(result.trips)
    return result.trips
  }

  const loadTrip = async (tripId) => {
    setSyncStatus('正在加载旅行…')
    const result = await api.getTrip(tripId)
    setTrip(result.trip)
    setUploads(result.trip.assets || [])
    setEvents(result.trip.events || [])
    setSelectedId(result.trip.events?.[0]?.id || '')
    setSyncStatus('已连接后端')
  }

  const bootstrap = async () => {
    if (!session?.token) return
    try {
      const loadedTrips = await refreshTrips()
      if (loadedTrips[0]) await loadTrip(loadedTrips[0].id)
      else setSyncStatus('还没有旅行项目')
    } catch (error) {
      setSyncStatus(error.status === 401 ? '登录已失效' : '后端服务不可用')
      if (error.status === 401) {
        logout()
        setSession(null)
      }
    }
  }

  useEffect(() => {
    if (!shareMatch) bootstrap()
  }, [session?.token])

  useEffect(() => {
    if (!trip?.id) return
    const timer = setTimeout(() => {
      api.saveTrip(trip.id, { events }).catch((error) => {
        console.error('Failed to save trip events', error)
        setSyncStatus('时间线保存失败')
      })
    }, 500)
    return () => clearTimeout(timer)
  }, [events, trip?.id])

  const handleLogin = async (payload) => {
    setLoginError('')
    setSyncStatus('正在登录…')
    try {
      const next = await login(payload)
      setSession(next)
    } catch (error) {
      setLoginError(error.message === 'Failed to fetch' ? '请先运行 npm run api 启动后端服务' : error.message)
      setSyncStatus('登录失败')
    }
  }

  const pollAnalysisJob = async (jobId) => {
    const result = await api.getJob(jobId)
    if (result.job.status === 'done') {
      setTrip(result.trip)
      setUploads(result.trip.assets || [])
      setEvents(result.trip.events || [])
      setSelectedId(result.trip.events?.[0]?.id || selectedId)
      setSyncStatus('照片理解完成，时间线已更新')
      setAnalysing(false)
      await refreshTrips()
      return
    }
    if (result.job.status === 'failed') {
      setSyncStatus(`照片理解失败：${result.job.error || '可重试'}`)
      setAnalysing(false)
      return
    }
    setSyncStatus(result.job.message || 'AI生成中')
    setTimeout(() => pollAnalysisJob(jobId), 1000)
  }

  const addFiles = async (files) => {
    if (!files.length || !trip?.id) return
    setAnalysing(true)
    setSyncStatus('正在处理照片格式…')
    try {
      const uploadFiles = await normalizeImagesForUpload(files)
      setSyncStatus('正在上传到对象存储…')
      const result = await api.uploadAssets(trip.id, uploadFiles)
      setUploads((prev) => [...result.assets, ...prev])
      setSyncStatus('AI生成中：正在分析 EXIF / OCR / 图片内容…')
      pollAnalysisJob(result.job.id)
    } catch (error) {
      setAnalysing(false)
      setSyncStatus(error.message === 'Failed to fetch' ? '上传失败：请先运行 npm run api' : `上传失败：${error.message}`)
    }
  }

  const createTrip = async (payload) => {
    const result = await api.createTrip(payload)
    setShowNew(false)
    await refreshTrips()
    await loadTrip(result.trip.id)
  }

  const updateFigurines = async (figurines) => {
    if (!trip?.id) return
    const nextTrip = { ...trip, figurines }
    setTrip(nextTrip)
    setSyncStatus('手办配置已更新')
    try {
      const result = await api.saveTrip(trip.id, { figurines })
      setTrip(result.trip)
      await refreshTrips()
    } catch (error) {
      setSyncStatus(`手办配置保存失败：${error.message}`)
    }
  }

  const resetProject = async () => {
    if (!trip?.id) return
    const freshEvents = []
    setEvents(freshEvents)
    await api.saveTrip(trip.id, { events: freshEvents })
    setSyncStatus('当前旅行时间线已重置')
  }

  const createShare = async () => {
    if (!trip?.id) return
    const result = await api.shareTrip(trip.id)
    setShareUrl(result.url)
    setSyncStatus('公开分享页已生成')
  }

  if (shareMatch) return <SharePage slug={shareMatch[1]} />
  if (!session?.token) return <LoginPanel onLogin={handleLogin} error={loginError} />

  return (
    <div className="app-shell">
      <LiquidEther
        colors={['#1BE7D7', '#FF7A45', '#7C4DFF']}
        mouseForce={14}
        resolution={0.45}
        autoDemo
        autoSpeed={0.45}
        className="app-ether"
      />
      <Header
        user={session.user}
        onNewTrip={() => setShowNew(true)}
        onReset={resetProject}
        onShare={createShare}
        onLogout={() => {
          logout()
          setSession(null)
        }}
        syncStatus={syncStatus}
      />
      {shareUrl ? (
        <a className="share-banner" href={shareUrl} target="_blank" rel="noreferrer">
          分享页已生成：{window.location.origin}
          {shareUrl}
        </a>
      ) : null}
      <div className="app-grid">
        <AssetRail
          assets={assets}
          onFiles={addFiles}
          onPreview={setPreviewAsset}
          analysing={analysing}
          trips={trips}
          selectedTripId={trip?.id}
          onSelectTrip={loadTrip}
          onCreateTrip={() => setShowNew(true)}
        />
        <Workspace
          trip={trip}
          events={events}
          setEvents={setEvents}
          assets={assets}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          onPreview={setPreviewAsset}
        />
        <Generator
          trip={trip}
          events={events}
          assets={assets}
          figurines={trip?.figurines || []}
          onFigurinesChange={updateFigurines}
          mode={mode}
          setMode={setMode}
        />
      </div>
      {previewAsset ? <ImagePreviewModal asset={previewAsset} onClose={() => setPreviewAsset(null)} /> : null}
      {showNew ? <NewTripModal onClose={() => setShowNew(false)} onCreate={createTrip} /> : null}
    </div>
  )
}
