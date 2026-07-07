export function PlogPreview({ events, assetsById, style }) {
  const hero = assetsById[events[0]?.images[0]]
  const second = assetsById[events[1]?.images[0]]
  const third = assetsById[events[2]?.images[0]]

  return (
    <div className={`plog-preview style-${style}`} id="plog-preview">
      <div className="plog-head">
        <span>西安 · 三日小旅行</span>
        <small>XI&apos;AN 2026</small>
      </div>
      <img className="plog-hero" src={hero?.src} alt="Plog 主图" />
      <div className="plog-pair">
        <img src={second?.src} alt="西安城墙旅行照片" />
        <img src={third?.src} alt="兵马俑旅行照片" />
      </div>
      <p>带着小橘，用三天的时间感受这座古城的魅力。</p>
      <span className="stamp">
        西安
        <br />
        07.05
      </span>
    </div>
  )
}
