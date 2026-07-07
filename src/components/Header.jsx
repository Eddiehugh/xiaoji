import { Icon } from './Icon'

export function Header({ onNewTrip, onReset, onShare, onLogout, syncStatus, user }) {
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
      <div className="sync-chip" title="同步状态">
        <span className="sync-dot" />
        <span>{syncStatus}</span>
      </div>
      <span className="user-chip">{user?.name || '未登录'}</span>
      <button className="secondary compact" onClick={onShare}>
        <Icon name="book" />
        分享
      </button>
      <button className="secondary compact" onClick={onReset}>
        <Icon name="refresh" />
        重置
      </button>
      <button className="primary compact" onClick={onNewTrip}>
        <Icon name="plus" />
        新建旅行
      </button>
      <button className="secondary compact" onClick={onLogout}>
        退出
      </button>
    </header>
  )
}
