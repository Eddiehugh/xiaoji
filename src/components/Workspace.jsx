import { useMemo } from 'react'
import { Icon } from './Icon'
import { TimelineEvent } from './TimelineEvent'

export function Workspace({ events, setEvents, assets, selectedId, setSelectedId }) {
  const assetsById = useMemo(() => Object.fromEntries(assets.map((asset) => [asset.id, asset])), [assets])

  return (
    <main className="workspace">
      <div className="trip-heading">
        <div>
          <h1>西安 · 三日小旅行</h1>
          <p>2026.07.03 — 07.05 · {assets.length} 张照片</p>
        </div>
        <div className="status">
          <Icon name="check" />
          时间线已自动整理，可随时修改
        </div>
      </div>
      <div className="section-heading">
        <h2>旅行时间线</h2>
        <button>按时间排序</button>
      </div>
      <div className="timeline">
        {events.map((event, index) => (
          <TimelineEvent
            key={event.id}
            event={event}
            assetsById={assetsById}
            selected={event.id === selectedId}
            onSelect={() => setSelectedId(event.id)}
            onStory={(story) =>
              setEvents((prev) => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, story } : item)))
            }
          />
        ))}
      </div>
    </main>
  )
}
