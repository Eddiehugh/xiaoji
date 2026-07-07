import { useState } from 'react'
import { Icon } from './Icon'

export function LoginPanel({ onLogin, error }) {
  const [name, setName] = useState('旅行创作者')
  const [email, setEmail] = useState('demo@xiaoji.local')

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="brand login-brand">
          <span className="brand-mark">迹</span>
          <span>小迹</span>
        </div>
        <h1>管理你的旅行项目</h1>
        <p>上传素材、AI 自动整理时间线、生成 Plog / Vlog，并发布公开分享页。</p>
        <label>
          名称
          <input value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label>
          邮箱
          <input value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        {error ? <div className="form-error">{error}</div> : null}
        <button className="primary" onClick={() => onLogin({ name, email })}>
          <Icon name="check" />
          进入工作台
        </button>
      </section>
    </main>
  )
}
