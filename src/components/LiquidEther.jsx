import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import './LiquidEther.css'

export default function LiquidEther({
  colors = ['#5227FF', '#FF9FFC', '#B497CF'],
  mouseForce = 20,
  resolution = 0.6,
  autoDemo = true,
  autoSpeed = 0.5,
  className = '',
  style = {},
}) {
  const mountRef = useRef(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return undefined

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setClearColor(0x000000, 0)
    mount.prepend(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.Camera()
    const palette = colors.map((color) => new THREE.Color(color))
    const pointer = new THREE.Vector2(0.5, 0.5)
    const velocity = new THREE.Vector2(0.08, 0.03)
    const uniforms = {
      uTime: { value: 0 },
      uPointer: { value: pointer },
      uForce: { value: mouseForce },
      uColorA: { value: palette[0] || new THREE.Color('#5227FF') },
      uColorB: { value: palette[1] || new THREE.Color('#FF9FFC') },
      uColorC: { value: palette[2] || new THREE.Color('#B497CF') },
    }

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms,
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position,1.0); }',
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform float uTime;
        uniform vec2 uPointer;
        uniform float uForce;
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        uniform vec3 uColorC;
        float wave(vec2 p, float s, float t){ return sin(p.x*s+t)+cos(p.y*(s*.77)-t*.8); }
        void main(){
          vec2 p = vUv;
          vec2 q = p - uPointer;
          float d = length(q);
          float pull = exp(-d * 5.5) * (uForce / 28.0);
          float n = wave(p + q * pull, 9.0, uTime * .85) * .22 + wave(p.yx, 15.0, uTime * .47) * .11;
          vec3 c = mix(uColorA, uColorB, smoothstep(.05, .95, p.x + n));
          c = mix(c, uColorC, smoothstep(.12, .9, 1.0 - d + n));
          float alpha = clamp(.18 + pull * .55 + abs(n) * .35, 0.0, .82);
          gl_FragColor = vec4(c, alpha);
        }
      `,
    })
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material))

    const resize = () => {
      const rect = mount.getBoundingClientRect()
      renderer.setSize(Math.max(1, rect.width * resolution), Math.max(1, rect.height * resolution), false)
      renderer.domElement.style.width = '100%'
      renderer.domElement.style.height = '100%'
    }
    const move = (event) => {
      const rect = mount.getBoundingClientRect()
      pointer.set((event.clientX - rect.left) / rect.width, 1 - (event.clientY - rect.top) / rect.height)
    }
    let raf = 0
    const loop = () => {
      uniforms.uTime.value += 0.016
      if (autoDemo) {
        pointer.x = 0.5 + Math.cos(uniforms.uTime.value * autoSpeed) * velocity.x
        pointer.y = 0.5 + Math.sin(uniforms.uTime.value * autoSpeed * 1.3) * velocity.y
      }
      renderer.render(scene, camera)
      raf = requestAnimationFrame(loop)
    }

    resize()
    loop()
    window.addEventListener('resize', resize)
    mount.addEventListener('pointermove', move)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      mount.removeEventListener('pointermove', move)
      material.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
    }
  }, [autoDemo, autoSpeed, colors, mouseForce, resolution])

  return <div ref={mountRef} className={`liquid-ether-container ${className}`} style={style} />
}
