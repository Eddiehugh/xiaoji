import { Icon } from './Icon'

export function TimelineEvent({ event, assetsById, selected, onSelect, onStory }) {
  return (
    <article className={`timeline-event ${selected ? 'selected' : ''}`} onClick={onSelect}>
      <span className="timeline-node" />
      <div className="event-date">
        <b>{event.date}</b>
        <strong>{event.title}</strong>
      </div>
      <div className="event-body">
        <div className="event-photos">
          {event.images.map((id) =>
            assetsById[id] ? <img key={id} src={assetsById[id].src} alt={assetsById[id].alt || event.title} /> : null,
          )}
        </div>
        <div className="event-meta">
          <span>
            <Icon name="pin" size={15} />
            {event.place}
          </span>
          <span>
            <Icon name="clock" size={15} />
            {event.time}
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
    </article>
  )
}
