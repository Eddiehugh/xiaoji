import { Icon } from './Icon'

export function Header({ onNewTrip, onReset, syncStatus }) {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark">迹</span>
        <span>小迹</span>
      </div>
      <nav aria-label="主导航">
        <button className="nav-item active">
          <Icon name="map" />
          我的旅行
        </button>
        <button className="nav-item">
          <Icon name="book" />
          手办护照
        </button>
      </nav>
      <div className="sync-chip" title="本地保存状态">
        <span className="sync-dot" />
        <span>{syncStatus}</span>
      </div>
      <button className="secondary compact" onClick={onReset}>
        <Icon name="refresh" />
        清空草稿
      </button>
      <button className="primary compact" onClick={onNewTrip}>
        <Icon name="plus" />
        新建旅行
      </button>
    </header>
  )
}
