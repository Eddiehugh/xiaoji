import { DisplayImage } from './DisplayImage'

function uniqueAssets(events, assets) {
  const byId = Object.fromEntries(assets.map((asset) => [asset.id, asset]))
  const seen = new Set()
  const fromEvents = events.flatMap((event) => event.images || []).map((id) => byId[id]).filter(Boolean)
  return [...fromEvents, ...assets].filter((asset) => {
    if (seen.has(asset.id)) return false
    seen.add(asset.id)
    return true
  })
}

export function PlogPreview({ trip, events, assets, style }) {
  const chosen = uniqueAssets(events, assets)
  const [hero, second, third] = chosen
  const title = trip?.title || '新的旅行'
  const dateLabel = [trip?.startDate, trip?.endDate].filter(Boolean).join(' - ') || '待定日期'
  const place = title.split(/[·｜|-]/)[0].trim() || '旅行'
  const summary = events[0]?.story || (chosen.length ? '新的旅行素材已准备好，可以生成 Plog。' : '上传照片后，这里会显示新的 Plog 预览。')

  return (
    <div className={`plog-preview style-${style}`} id="plog-preview">
      <div className="plog-head">
        <span>{title}</span>
        <small>{dateLabel}</small>
      </div>
      {hero ? <DisplayImage className="plog-hero" asset={hero} alt={hero.alt || 'Plog 主图'} /> : <div className="plog-empty">上传照片后生成 Plog</div>}
      <div className="plog-pair">
        {second ? <DisplayImage asset={second} alt={second.alt || '旅行照片'} /> : <div className="plog-slot">等待照片</div>}
        {third ? <DisplayImage asset={third} alt={third.alt || '旅行照片'} /> : <div className="plog-slot">等待照片</div>}
      </div>
      <p>{summary}</p>
      <span className="stamp">
        {place}
        <br />
        Plog
      </span>
    </div>
  )
}
