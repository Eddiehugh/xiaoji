import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { TimelineEvent } from './TimelineEvent'

export function SharePage({ slug }) {
  const [state, setState] = useState({ loading: true, trip: null, error: '' })

  useEffect(() => {
    api
      .getShare(slug)
      .then(({ trip }) => setState({ loading: false, trip, error: '' }))
      .catch((error) => setState({ loading: false, trip: null, error: error.message }))
  }, [slug])

  const assets = useMemo(() => [...(state.trip?.assets || []), ...(state.trip?.seedAssets || [])], [state.trip])
  const assetsById = useMemo(() => Object.fromEntries(assets.map((asset) => [asset.id, asset])), [assets])

  if (state.loading) return <main className="share-page">正在加载分享页…</main>
  if (state.error) return <main className="share-page">分享页不可用：{state.error}</main>

  return (
    <main className="share-page">
      <header className="share-hero">
        <span>小迹旅行分享</span>
        <h1>{state.trip.title}</h1>
        <p>
          {state.trip.startDate || '未知日期'}
          {state.trip.endDate ? ` — ${state.trip.endDate}` : ''}
        </p>
      </header>
      <section className="share-timeline">
        {state.trip.events.map((event) => (
          <TimelineEvent
            key={event.id}
            event={event}
            assetsById={assetsById}
            selected={false}
            onSelect={() => {}}
            onStory={() => {}}
          />
        ))}
      </section>
    </main>
  )
}
