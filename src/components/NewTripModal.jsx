import { Icon } from './Icon'

export function NewTripModal({ onClose, onCreate }) {
  const submit = (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    onCreate({
      title: form.get('title'),
      startDate: form.get('startDate'),
      endDate: form.get('endDate'),
    })
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form className="modal" onMouseDown={(e) => e.stopPropagation()} onSubmit={submit}>
        <button className="modal-close" type="button" onClick={onClose}>
          <Icon name="close" />
        </button>
        <h2>创建一段新旅行</h2>
        <p>先给旅程一个名字，之后再上传照片。</p>
        <label>
          旅行名称
          <input autoFocus name="title" defaultValue="成都周末散步" />
        </label>
        <div className="date-row">
          <label>
            开始日期
            <input name="startDate" type="date" />
          </label>
          <label>
            结束日期
            <input name="endDate" type="date" />
          </label>
        </div>
        <button className="primary" type="submit">
          创建旅行
        </button>
      </form>
    </div>
  )
}
