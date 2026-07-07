import { Icon } from './Icon'

export function NewTripModal({ onClose }) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <Icon name="close" />
        </button>
        <h2>创建一段新旅行</h2>
        <p>先给旅程一个名字，之后再上传照片。</p>
        <label>
          旅行名称
          <input autoFocus defaultValue="成都周末散步" />
        </label>
        <div className="date-row">
          <label>
            开始日期
            <input type="date" />
          </label>
          <label>
            结束日期
            <input type="date" />
          </label>
        </div>
        <button className="primary" onClick={onClose}>
          创建旅行
        </button>
      </div>
    </div>
  )
}
