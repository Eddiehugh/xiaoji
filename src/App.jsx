import { useEffect, useMemo, useRef, useState } from 'react'
import { AssetRail } from './components/AssetRail'
import { Generator } from './components/Generator'
import { Header } from './components/Header'
import { NewTripModal } from './components/NewTripModal'
import { Workspace } from './components/Workspace'
import { cloneEvents, seedAssets, seedEvents } from './data/seedData'
import {
  clearTripState,
  clearUploadRecords,
  loadTripState,
  loadUploadRecords,
  saveTripState,
  saveUploadRecord,
} from './lib/persistence'
import { createUploadAssets, revokeUploadUrls } from './lib/uploadAssets'

export function App() {
  const [uploads, setUploads] = useState([])
  const [events, setEvents] = useState(() => cloneEvents(seedEvents))
  const [selectedId, setSelectedId] = useState('arrival')
  const [analysing, setAnalysing] = useState(false)
  const [mode, setMode] = useState('plog')
  const [showNew, setShowNew] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [syncStatus, setSyncStatus] = useState('正在恢复本地草稿…')
  const uploadUrlsRef = useRef([])

  useEffect(() => {
    uploadUrlsRef.current = uploads
  }, [uploads])

  useEffect(() => {
    let cancelled = false

    const bootstrap = async () => {
      try {
        const [tripState, storedUploads] = await Promise.all([loadTripState(), loadUploadRecords()])
        if (cancelled) return

        if (tripState?.events?.length) setEvents(cloneEvents(tripState.events))
        if (tripState?.selectedId) setSelectedId(tripState.selectedId)
        if (tripState?.mode) setMode(tripState.mode)

        const restoredUploads = storedUploads.map((record) => ({
          id: record.id,
          kind: 'upload',
          src: URL.createObjectURL(record.blob),
          alt: record.name,
          name: record.name,
          createdAt: record.createdAt,
          isNew: false,
        }))
        setUploads(restoredUploads)
        setSyncStatus(tripState ? '草稿已恢复' : '使用默认示例')
      } catch (error) {
        console.error('Failed to restore local project state', error)
        if (!cancelled) setSyncStatus('本地恢复失败，已回到默认示例')
      } finally {
        if (!cancelled) setHydrated(true)
      }
    }

    bootstrap()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    saveTripState({
      events,
      selectedId,
      mode,
      savedAt: Date.now(),
    })
    setSyncStatus('已保存到本地')
  }, [events, selectedId, mode, hydrated])

  useEffect(() => {
    return () => {
      revokeUploadUrls(uploadUrlsRef.current)
    }
  }, [])

  const assets = useMemo(() => [...uploads, ...seedAssets], [uploads])

  const addFiles = async (files) => {
    if (!files.length) return
    setAnalysing(true)
    setSyncStatus('正在保存上传素材…')

    const additions = createUploadAssets(files)

    try {
      await Promise.all(
        additions.map((record) =>
          saveUploadRecord({
            id: record.id,
            name: record.name,
            type: record.blob.type,
            blob: record.blob,
            createdAt: record.createdAt,
          }),
        ),
      )

      await new Promise((resolve) => setTimeout(resolve, 1100))

      setUploads((prev) => [...additions, ...prev])
      setEvents((prev) =>
        prev.map((event) =>
          event.id === selectedId
            ? {
                ...event,
                images: [...additions.map((asset) => asset.id), ...event.images].slice(0, 4),
              }
            : event,
        ),
      )
      setSyncStatus('上传素材已保存')
    } catch (error) {
      console.error('Upload persistence failed', error)
      setUploads((prev) => [...additions, ...prev])
      setEvents((prev) =>
        prev.map((event) =>
          event.id === selectedId
            ? {
                ...event,
                images: [...additions.map((asset) => asset.id), ...event.images].slice(0, 4),
              }
            : event,
        ),
      )
      setSyncStatus('上传已加入，但本地持久化失败')
    } finally {
      setAnalysing(false)
    }
  }

  const resetProject = async () => {
    revokeUploadUrls(uploadUrlsRef.current)
    setSyncStatus('正在清空本地草稿…')

    try {
      await Promise.all([clearUploadRecords(), clearTripState()])
    } catch (error) {
      console.error('Failed to clear local data', error)
    }

    setUploads([])
    setEvents(cloneEvents(seedEvents))
    setSelectedId('arrival')
    setMode('plog')
    setShowNew(false)
    setSyncStatus('本地草稿已清空')
  }

  return (
    <div className="app-shell">
      <Header onNewTrip={() => setShowNew(true)} onReset={resetProject} syncStatus={syncStatus} />
      <div className="app-grid">
        <AssetRail assets={assets} onFiles={addFiles} analysing={analysing} />
        <Workspace events={events} setEvents={setEvents} assets={assets} selectedId={selectedId} setSelectedId={setSelectedId} />
        <Generator events={events} assets={assets} mode={mode} setMode={setMode} />
      </div>
      {showNew ? <NewTripModal onClose={() => setShowNew(false)} /> : null}
    </div>
  )
}
