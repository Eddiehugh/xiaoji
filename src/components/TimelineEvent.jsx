import { Icon } from './Icon'
import { DisplayImage } from './DisplayImage'

function displayTime(time) {
  if (!time) return '待确认'
  const parts = String(time)
    .split(/[—–-]/)
    .map((part) => part.trim())
    .filter(Boolean)
  const unique = [...new Set(parts)]
  if (unique.length > 1) return `${unique[0]} — ${unique[unique.length - 1]}`
  return unique[0] || String(time)
}

export function TimelineEvent({ event, assetsById, selected, onSelect, onStory, onPreview = () => {} }) {
  return (
    <article className={`timeline-event ${selected ? 'selected' : ''}`} onClick={onSelect}>
      <span className="timeline-node" />
      <div className="event-date">
        <b>{displayTime(event.time)}</b>
        <strong>{event.place || event.title}</strong>
        <span>{event.title}</span>
      </div>
      <div className="event-body">
        <div className="event-photos">
          {event.images.map((id) =>
            assetsById[id] ? (
              <button
                key={id}
                type="button"
                className="event-photo"
                onClick={(clickEvent) => {
                  clickEvent.stopPropagation()
                  onPreview(assetsById[id])
                }}
                title="打开图片"
              >
                <DisplayImage asset={assetsById[id]} alt={assetsById[id].alt || event.title} />
              </button>
            ) : null,
          )}
        </div>
        <div className="event-meta">
          <span>
            <Icon name="pin" size={15} />
            {event.date}
          </span>
          <span>
            <Icon name="clock" size={15} />
            {event.source === 'ai' ? 'AI 自动整理' : '手动时间节点'}
          </span>
        </div>
        <label className="story-field">
          <Icon name="edit" size={15} />
          <input
            value={event.story}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onStory(e.target.value)}
            aria-label={`${event.title}故事`}
          />
        </label>
      </div>
      {event.figurine ? <span className="figurine-tag">● 手办出镜</span> : null}
      {event.source === 'ai' ? <span className="confidence-tag" title="由 AI 自动整理，可手动修改">AI整理</span> : null}
    </article>
  )
}
