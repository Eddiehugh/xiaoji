import { Icon } from './Icon'
import { DisplayImage } from './DisplayImage'

function daysBetween(startDate, endDate) {
  if (!startDate || !endDate) return ''
  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return ''
  return `${Math.max(1, Math.round((end - start) / 86400000) + 1)} 天`
}

export function ProjectList({ trips, selectedId, onSelect, onCreate }) {
  return (
    <section className="project-list">
      <button className="create-project-button" onClick={onCreate}>
        <Icon name="plus" size={22} />
        创建新项目
      </button>
      <div className="panel-title">
        <h2>我的项目</h2>
        <span>最近更新⌄</span>
      </div>
      <div className="project-items">
        {trips.map((trip) => {
          const cover = trip.assets?.[0] || trip.seedAssets?.[0]
          const photoCount = (trip.assets?.length || 0) + (trip.seedAssets?.length || 0)
          return (
            <button key={trip.id} className={`project-item ${trip.id === selectedId ? 'active' : ''}`} onClick={() => onSelect(trip.id)}>
              <span className="project-cover">{cover ? <DisplayImage asset={cover} alt={trip.title} /> : '迹'}</span>
              <span className="project-copy">
                <strong>{trip.title}</strong>
                <em>
                  {trip.startDate || '未设置日期'}
                  {trip.endDate ? ` - ${trip.endDate}` : ''}
                </em>
                <small>
                  {[daysBetween(trip.startDate, trip.endDate), `${photoCount} 张`].filter(Boolean).join(' / ')}
                </small>
              </span>
              <span className="project-more">•••</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
