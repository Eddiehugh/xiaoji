import { existsSync, readFileSync } from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const apiPort = process.env.API_PORT || '8787'
const webPort = process.env.VITE_PORT || '5173'
const apiUrl = `http://127.0.0.1:${apiPort}`
const webUrl = `http://127.0.0.1:${webPort}`
const children = new Set()
let shuttingDown = false
let browserOpened = false

function readEnvFile(filePath) {
  if (!existsSync(filePath)) return {}
  return Object.fromEntries(
    readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const index = line.indexOf('=')
        const key = line.slice(0, index).trim()
        let value = line.slice(index + 1).trim()
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1)
        }
        return [key, value]
      }),
  )
}

function log(label, chunk) {
  String(chunk)
    .split(/\r?\n/)
    .filter(Boolean)
    .forEach((line) => console.log(`[${label}] ${line}`))
}

function run(label, command, args, env) {
  const child = spawn(command, args, {
    cwd: rootDir,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  children.add(child)
  child.stdout.on('data', (chunk) => log(label, chunk))
  child.stderr.on('data', (chunk) => log(label, chunk))
  child.on('exit', (code) => {
    children.delete(child)
    if (!shuttingDown) {
      console.log(`\n${label} 已退出，状态码 ${code ?? 'unknown'}。`)
      shutdown(code || 1)
    }
  })
  return child
}

function shutdown(code = 0) {
  shuttingDown = true
  for (const child of children) child.kill('SIGTERM')
  setTimeout(() => process.exit(code), 200)
}

function waitForHttp(url, timeoutMs = 30000) {
  const started = Date.now()
  return new Promise((resolve, reject) => {
    const tick = () => {
      const request = http.get(url, (response) => {
        response.resume()
        resolve()
      })
      request.on('error', () => {
        if (Date.now() - started > timeoutMs) {
          reject(new Error(`等待 ${url} 超时`))
          return
        }
        setTimeout(tick, 500)
      })
      request.setTimeout(1200, () => request.destroy())
    }
    tick()
  })
}

function canReach(url, timeoutMs = 900) {
  return new Promise((resolve) => {
    const request = http.get(url, (response) => {
      response.resume()
      resolve(true)
    })
    request.on('error', () => resolve(false))
    request.setTimeout(timeoutMs, () => {
      request.destroy()
      resolve(false)
    })
  })
}

function openBrowser(url) {
  if (browserOpened) return
  browserOpened = true
  if (process.platform === 'darwin') {
    spawn('open', [url], { detached: true, stdio: 'ignore' }).unref()
  } else if (process.platform === 'win32') {
    spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' }).unref()
  } else {
    spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref()
  }
}

async function ensureDependencies(env) {
  if (existsSync(path.join(rootDir, 'node_modules'))) return
  console.log('未发现 node_modules，正在安装依赖...')
  await new Promise((resolve, reject) => {
    const child = spawn(npmCmd, ['install'], {
      cwd: rootDir,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    child.stdout.on('data', (chunk) => log('install', chunk))
    child.stderr.on('data', (chunk) => log('install', chunk))
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`npm install 失败：${code}`))
    })
  })
}

const envFromFile = {
  ...readEnvFile(path.join(rootDir, '.env')),
  ...readEnvFile(path.join(rootDir, '.env.local')),
}
const env = {
  ...process.env,
  ...envFromFile,
  API_PORT: apiPort,
  VITE_API_URL: envFromFile.VITE_API_URL || process.env.VITE_API_URL || `http://127.0.0.1:${apiPort}`,
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))

console.log('启动小迹旅行...')
console.log(`API: ${apiUrl}`)
console.log(`Web: ${webUrl}\n`)

try {
  await ensureDependencies(env)
  if (await canReach(`${apiUrl}/api/me`)) {
    console.log('检测到 API 已运行，复用现有后端。')
  } else {
    run('api', npmCmd, ['run', 'api'], env)
    await waitForHttp(`${apiUrl}/api/me`)
  }

  if (await canReach(webUrl)) {
    console.log('检测到 Web 已运行，复用现有前端。')
  } else {
    run('web', npmCmd, ['run', 'dev', '--', '--host', '127.0.0.1', '--port', webPort], env)
    await waitForHttp(webUrl)
  }

  console.log(`\n产品已启动：${webUrl}`)
  openBrowser(webUrl)
} catch (error) {
  console.error(error.message)
  shutdown(1)
}
