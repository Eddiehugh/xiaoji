import { useEffect, useMemo, useState } from 'react'
import { Icon } from './Icon'
import { TimelineEvent } from './TimelineEvent'

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

function toDate(value) {
  if (!value) return null
  const parsed = new Date(`${value}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function dateKey(date) {
  return `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

function eventDateToDate(eventDate, trip) {
  if (!eventDate) return null
  if (/^\d{4}-\d{2}-\d{2}/.test(eventDate)) return toDate(eventDate.slice(0, 10))
  const match = String(eventDate).match(/^(\d{1,2})[.-](\d{1,2})$/)
  if (!match) return null
  const year = toDate(trip?.startDate)?.getFullYear() || new Date().getFullYear()
  const parsed = new Date(year, Number(match[1]) - 1, Number(match[2]))
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function buildDateTabs(trip, events) {
  const start = toDate(trip?.startDate)
  const end = toDate(trip?.endDate) || start
  if (start && end && end >= start) {
    const tabs = []
    const cursor = new Date(start)
    while (cursor <= end && tabs.length < 31) {
      tabs.push({
        key: dateKey(cursor),
        label: dateKey(cursor),
        weekday: WEEKDAYS[cursor.getDay()],
      })
      cursor.setDate(cursor.getDate() + 1)
    }
    return tabs
  }

  const seen = new Set()
  return events
    .map((event) => {
      const key = String(event.date || '待确认')
      if (seen.has(key)) return null
      seen.add(key)
      const parsed = eventDateToDate(key, trip)
      return {
        key,
        label: key,
        weekday: parsed ? WEEKDAYS[parsed.getDay()] : '',
      }
    })
    .filter(Boolean)
}

function eventBelongsToDate(event, selectedDate, trip) {
  if (!selectedDate) return true
  if (String(event.date || '') === selectedDate) return true
  const parsed = eventDateToDate(event.date, trip)
  return parsed ? dateKey(parsed) === selectedDate : false
}

export function Workspace({ trip, events, setEvents, assets, selectedId, setSelectedId, onPreview }) {
  const assetsById = useMemo(() => Object.fromEntries(assets.map((asset) => [asset.id, asset])), [assets])
  const dateTabs = useMemo(() => buildDateTabs(trip, events), [trip, events])
  const [selectedDate, setSelectedDate] = useState('')
  const selectedDayIndex = Math.max(0, dateTabs.findIndex((item) => item.key === selectedDate))
  const visibleEvents = useMemo(
    () => events.filter((event) => eventBelongsToDate(event, selectedDate, trip)),
    [events, selectedDate, trip],
  )

  useEffect(() => {
    const firstDate = dateTabs[0]?.key || ''
    if (!dateTabs.some((item) => item.key === selectedDate)) setSelectedDate(firstDate)
  }, [dateTabs, selectedDate])

  const addTimeNode = () => {
    const targetDate = selectedDate || dateTabs[0]?.key || '待确认'
    const newEvent = {
      id: `manual-${Date.now()}`,
      date: targetDate,
      title: '新的时间节点',
      time: '09:00',
      place: '待确认地点',
      story: '拖入或上传照片后，补充这段旅行记忆。',
      images: [],
      figurine: false,
      source: 'manual',
    }
    setEvents((prev) => [...prev, newEvent])
    setSelectedId(newEvent.id)
    setSelectedDate(targetDate)
  }

  return (
    <main className="workspace">
      <div className="trip-heading">
        <div>
          <h1>{trip?.title || '旅行项目'}</h1>
          <p>
            {trip?.startDate || '未设置日期'}
            {trip?.endDate ? ` — ${trip.endDate}` : ''} · {assets.length} 张照片
          </p>
        </div>
        <div className="status">
          <Icon name="check" />
          时间线来自 EXIF / OCR / 图片理解，可随时修改
        </div>
      </div>
      <div className="section-heading">
        <h2>旅行时间线</h2>
        <button
          onClick={() =>
            setEvents((prev) =>
              [...prev].sort((a, b) => String(a.date || '').localeCompare(String(b.date || ''))),
            )
          }
        >
          按时间排序
        </button>
      </div>
      <div className="date-tabs">
        {dateTabs.map((item) => (
          <button
            key={item.key}
            type="button"
            className={item.key === selectedDate ? 'active' : ''}
            onClick={() => setSelectedDate(item.key)}
          >
            <strong>{item.label}</strong>
            {item.weekday ? <span>{item.weekday}</span> : null}
          </button>
        ))}
        <button type="button" className="date-add" onClick={addTimeNode} aria-label="添加时间节点">
          <Icon name="plus" size={22} />
        </button>
      </div>
      <div className="timeline-day-title">
        <h3>
          {trip?.title || '旅行项目'} · DAY {selectedDayIndex + 1}
        </h3>
        <span>{visibleEvents.length} 个时间节点</span>
      </div>
      <div className="timeline">
        {visibleEvents.length ? (
          visibleEvents.map((event) => (
            <TimelineEvent
              key={event.id}
              event={event}
              assetsById={assetsById}
              selected={event.id === selectedId}
              onSelect={() => setSelectedId(event.id)}
              onPreview={onPreview}
              onStory={(story) =>
                setEvents((prev) => prev.map((item) => (item.id === event.id ? { ...item, story } : item)))
              }
            />
          ))
        ) : (
          <div className="timeline-empty">
            <Icon name="plus" size={20} />
            <strong>这一天还没有时间节点</strong>
            <span>点击右上角加号，为当前日期添加一段行程。</span>
          </div>
        )}
      </div>
    </main>
  )
}
