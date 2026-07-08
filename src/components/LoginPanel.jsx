import { useState } from 'react'
import { Icon } from './Icon'
import LiquidEther from './LiquidEther'
import SplitText from './SplitText'
import { ToyDesigner } from './ToyDesigner'

export function LoginPanel({ onLogin, error }) {
  const [name, setName] = useState('旅行创作者')
  const [email, setEmail] = useState('demo@xiaoji.local')
  const [figurines, setFigurines] = useState([])

  return (
    <main className="login-page">
      <LiquidEther
        colors={['#5227FF', '#FF7AC8', '#18F2D2']}
        mouseForce={24}
        resolution={0.65}
        autoDemo
        autoSpeed={0.75}
        className="login-ether"
      />
      <section className="login-panel">
        <div className="brand login-brand">
          <span className="brand-mark">迹</span>
          <span>小迹</span>
        </div>
        <SplitText tag="h1" text="管理你的旅行项目" splitType="chars" delay={35} duration={0.8} textAlign="left" />
        <p>上传素材、AI 自动整理时间线、生成 Plog / Vlog，并发布公开分享页。</p>
        <ToyDesigner figurines={figurines} setFigurines={setFigurines} />
        <label>
          名称
          <input value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label>
          邮箱
          <input value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        {error ? <div className="form-error">{error}</div> : null}
        <button className="primary" onClick={() => onLogin({ name, email, figurines })}>
          <Icon name="check" />
          进入工作台
        </button>
      </section>
    </main>
  )
}
