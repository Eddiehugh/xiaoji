import { Icon } from './Icon'

export function ProjectList({ trips, selectedId, onSelect, onCreate }) {
  return (
    <section className="project-list">
      <div className="panel-title">
        <h2>旅行项目</h2>
        <button className="icon-button" onClick={onCreate} title="新建旅行">
          <Icon name="plus" size={16} />
        </button>
      </div>
      <div className="project-items">
        {trips.map((trip) => (
          <button key={trip.id} className={`project-item ${trip.id === selectedId ? 'active' : ''}`} onClick={() => onSelect(trip.id)}>
            <strong>{trip.title}</strong>
            <span>
              {trip.startDate || '未设置日期'}
              {trip.endDate ? ` — ${trip.endDate}` : ''}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
