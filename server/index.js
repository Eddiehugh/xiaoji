import { createHash, randomUUID } from 'node:crypto'
import { createReadStream, existsSync } from 'node:fs'
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { seedAssets, seedEvents } from '../src/data/seedData.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const storageDir = path.join(__dirname, 'storage')
const objectsDir = path.join(storageDir, 'objects')
const dbPath = path.join(storageDir, 'db.json')
const port = Number(process.env.API_PORT || 8787)

const aiBaseUrl = process.env.AI_BASE_URL || 'https://llm-0ytnarkl09vlr7b6.cn-beijing.maas.aliyuncs.com/compatible-mode/v1'
const aiApiKey = process.env.DASHSCOPE_API_KEY || process.env.OPENAI_API_KEY || ''
const aiModel = process.env.AI_MODEL || 'qwen3.7-plus'
const aiEnableThinking = process.env.AI_ENABLE_THINKING !== 'false'

const contentTypes = new Map([
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.png', 'image/png'],
  ['.webp', 'image/webp'],
  ['.gif', 'image/gif'],
  ['.heic', 'image/heic'],
  ['.heif', 'image/heif'],
])

async function ensureStorage() {
  await mkdir(objectsDir, { recursive: true })
  if (!existsSync(dbPath)) {
    await saveDb({ users: [], sessions: [], trips: [], assets: [], jobs: [], shares: [] })
  }
}

async function loadDb() {
  await ensureStorage()
  return JSON.parse(await readFile(dbPath, 'utf8'))
}

async function saveDb(db) {
  await mkdir(storageDir, { recursive: true })
  const tmp = `${dbPath}.${process.pid}.tmp`
  await writeFile(tmp, JSON.stringify(db, null, 2))
  await rename(tmp, dbPath)
}

function json(res, status, body) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'authorization,content-type',
    'access-control-allow-methods': 'GET,POST,PATCH,OPTIONS',
  })
  res.end(JSON.stringify(body))
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

async function readJson(req) {
  const body = await readBody(req)
  return body.length ? JSON.parse(body.toString('utf8')) : {}
}

function parseMultipart(buffer, contentType) {
  const boundary = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/)?.[1] || contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/)?.[2]
  if (!boundary) throw new Error('Missing multipart boundary')

  const boundaryBuffer = Buffer.from(`--${boundary}`)
  const parts = []
  let cursor = buffer.indexOf(boundaryBuffer)

  while (cursor !== -1) {
    const next = buffer.indexOf(boundaryBuffer, cursor + boundaryBuffer.length)
    if (next === -1) break
    let part = buffer.subarray(cursor + boundaryBuffer.length, next)
    if (part.subarray(0, 2).toString() === '\r\n') part = part.subarray(2)
    if (part.subarray(-2).toString() === '\r\n') part = part.subarray(0, -2)

    const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'))
    if (headerEnd > -1) {
      const headers = part.subarray(0, headerEnd).toString('utf8')
      const content = part.subarray(headerEnd + 4)
      const name = headers.match(/name="([^"]+)"/)?.[1]
      const filename = headers.match(/filename="([^"]+)"/)?.[1]
      const type = headers.match(/content-type:\s*([^\r\n]+)/i)?.[1]?.trim() || 'application/octet-stream'
      if (name) parts.push({ name, filename, type, content })
    }
    cursor = next
  }

  return parts
}

function isSupportedImagePart(part) {
  const ext = path.extname(part.filename || '').toLowerCase()
  return part.type.startsWith('image/') || ext === '.heic' || ext === '.heif'
}

function authToken(req) {
  return req.headers.authorization?.replace(/^Bearer\s+/i, '') || ''
}

function userFromRequest(db, req) {
  const session = db.sessions.find((item) => item.token === authToken(req))
  return session ? db.users.find((user) => user.id === session.userId) || null : null
}

function defaultTrip(userId) {
  const now = Date.now()
  return {
    id: randomUUID(),
    userId,
    title: '西安 · 三日小旅行',
    startDate: '2026-07-03',
    endDate: '2026-07-05',
    events: seedEvents.map((event) => ({ ...event, images: [...event.images], confidence: 0.9, source: 'seed' })),
    seedAssets,
    createdAt: now,
    updatedAt: now,
  }
}

function publicTrip(db, trip) {
  return {
    ...trip,
    assets: db.assets
      .filter((asset) => asset.tripId === trip.id)
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((asset) => ({
        ...asset,
        src: `/objects/${asset.objectKey}`,
        kind: 'upload',
        isNew: false,
      })),
  }
}

function extractExif(buffer) {
  const text = buffer.toString('latin1')
  const dateMatch = text.match(/(\d{4}:\d{2}:\d{2}\s+\d{2}:\d{2}:\d{2})/)
  if (!dateMatch) return {}
  return { takenAt: dateMatch[1].replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3') }
}

function summarizeDate(date) {
  if (!date) return '待确认'
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return String(date).slice(0, 10)
  return `${String(parsed.getMonth() + 1).padStart(2, '0')}.${String(parsed.getDate()).padStart(2, '0')}`
}

function tripDayLabels(trip) {
  const start = trip.startDate ? new Date(`${trip.startDate}T00:00:00`) : null
  const end = trip.endDate ? new Date(`${trip.endDate}T00:00:00`) : start
  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return []

  const labels = []
  const cursor = new Date(start)
  while (cursor <= end && labels.length < 31) {
    labels.push(summarizeDate(cursor.toISOString()))
    cursor.setDate(cursor.getDate() + 1)
  }
  return labels
}

function heuristicAnalysis(asset) {
  const lower = `${asset.name || ''} ${asset.alt || ''}`.toLowerCase()
  const place =
    lower.includes('wall') || lower.includes('城墙')
      ? '城市地标'
      : lower.includes('food') || lower.includes('noodle') || lower.includes('面')
        ? '餐食与街巷'
        : lower.includes('terracotta') || lower.includes('army') || lower.includes('兵马俑')
          ? '博物馆'
          : '旅行途中'
  return {
    title: place,
    place,
    takenAt: asset.exif?.takenAt || new Date(asset.createdAt).toISOString(),
    story: '根据上传照片、文件时间和可用元数据自动整理出的旅行片段。',
    tags: ['自动整理'],
    ocrText: '',
    figurine: false,
    confidence: 0.58,
  }
}

async function analyzeAssetWithAI(asset, buffer) {
  if (!aiApiKey) return heuristicAnalysis(asset)

  const dataUrl = `data:${asset.type};base64,${buffer.toString('base64')}`
  const payload = {
    model: aiModel,
    messages: [
      {
        role: 'system',
        content: '你是旅行照片理解助手。识别地点、OCR文字、时间线线索、场景和手办是否出镜。只输出JSON。',
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text:
              '输出JSON：{"title":"","place":"","takenAt":"","story":"","tags":[],"ocrText":"","figurine":false,"confidence":0.0}。takenAt不知道则为空。',
          },
          { type: 'image_url', image_url: { url: dataUrl } },
        ],
      },
    ],
    response_format: { type: 'json_object' },
    extra_body: { enable_thinking: aiEnableThinking },
  }

  try {
    const response = await fetch(`${aiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: { authorization: `Bearer ${aiApiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!response.ok) throw new Error(`AI request failed: ${response.status}`)
    const result = await response.json()
    const content = result.choices?.[0]?.message?.content || '{}'
    return { ...heuristicAnalysis(asset), ...JSON.parse(content) }
  } catch (error) {
    return { ...heuristicAnalysis(asset), aiError: error.message }
  }
}

function buildTimeline(trip, analyses) {
  const dayLabels = tripDayLabels(trip)
  const shouldSpreadAcrossTrip =
    dayLabels.length > 1 &&
    analyses.length > 1 &&
    new Set(analyses.map((item) => summarizeDate(item.takenAt))).size <= 1

  const grouped = new Map()
  analyses.forEach((item, index) => {
    const key = shouldSpreadAcrossTrip ? dayLabels[Math.min(index, dayLabels.length - 1)] : summarizeDate(item.takenAt)
    grouped.set(key, [...(grouped.get(key) || []), item])
  })
  if (!grouped.size) return trip.events

  return [...grouped.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, items], index) => {
      const top = items[0]
      return {
        id: `auto-${date.replace(/\W/g, '')}-${index}`,
        date,
        title: top.title || `旅行片段 ${index + 1}`,
        time: items.map((item) => item.takenAt?.slice(11, 16)).filter(Boolean).join(' — ') || '自动识别',
        place: [...new Set(items.map((item) => item.place).filter(Boolean))].join('、') || '待确认地点',
        story: top.story || '照片已自动归入这段旅程，可继续手动修正。',
        images: items.map((item) => item.assetId).filter(Boolean).slice(0, 4),
        figurine: items.some((item) => item.figurine),
        confidence: Math.max(...items.map((item) => Number(item.confidence) || 0.5)),
        source: 'ai',
      }
    })
}

async function runAnalysisJob(jobId) {
  const db = await loadDb()
  const job = db.jobs.find((item) => item.id === jobId)
  if (!job || job.status === 'done') return
  job.status = 'running'
  job.stage = 'ai-generating'
  job.message = 'AI生成中'
  job.progress = 10
  job.startedAt = Date.now()
  await saveDb(db)

  try {
    const current = await loadDb()
    const trip = current.trips.find((item) => item.id === job.tripId)
    const assets = current.assets.filter((asset) => job.assetIds.includes(asset.id))
    const analyses = []
    for (const [index, asset] of assets.entries()) {
      const target = current.jobs.find((item) => item.id === jobId)
      target.stage = 'ai-generating'
      target.message = `AI生成中：正在理解第 ${index + 1}/${assets.length} 张照片`
      target.progress = Math.max(15, Math.round(((index + 1) / Math.max(assets.length, 1)) * 80))
      await saveDb(current)

      const buffer = await readFile(path.join(objectsDir, asset.objectKey))
      asset.analysis = await analyzeAssetWithAI(asset, buffer)
      asset.updatedAt = Date.now()
      analyses.push({ ...asset.analysis, assetId: asset.id })
    }
    const allAnalyses = current.assets
      .filter((asset) => asset.tripId === trip.id && asset.analysis)
      .map((asset) => ({ ...asset.analysis, assetId: asset.id }))
    trip.events = buildTimeline(trip, allAnalyses)
    trip.updatedAt = Date.now()

    const target = current.jobs.find((item) => item.id === jobId)
    target.status = 'done'
    target.stage = 'completed'
    target.message = 'AI生成完成'
    target.progress = 100
    target.result = { assetCount: assets.length, eventCount: trip.events.length, analyses }
    target.finishedAt = Date.now()
    await saveDb(current)
  } catch (error) {
    const failed = await loadDb()
    const target = failed.jobs.find((item) => item.id === jobId)
    target.status = 'failed'
    target.stage = 'failed'
    target.message = 'AI生成失败'
    target.error = error.message
    target.finishedAt = Date.now()
    await saveDb(failed)
  }
}

async function runGenerationJob(jobId) {
  const db = await loadDb()
  const job = db.jobs.find((item) => item.id === jobId)
  if (!job || job.status === 'done') return
  job.status = 'running'
  job.stage = 'ai-generating'
  job.message = 'AI生成中'
  job.progress = 35
  job.startedAt = Date.now()
  await saveDb(db)

  setTimeout(async () => {
    const current = await loadDb()
    const target = current.jobs.find((item) => item.id === jobId)
    if (!target) return
    const trip = current.trips.find((item) => item.id === target.tripId)
    if (!trip) return
    target.status = 'done'
    target.stage = 'completed'
    target.message = 'AI生成完成'
    target.progress = 100
    target.result = {
      title: `${trip.title} ${target.mode === 'vlog' ? 'Vlog' : 'Plog'}`,
      format: target.mode === 'vlog' ? '9:16 MP4 任务方案' : '3:4 长图任务方案',
      summary: trip.events.map((event) => event.story).join(' '),
      reusable: true,
    }
    target.finishedAt = Date.now()
    await saveDb(current)
  }, 1200)
}

function scheduleJob(job) {
  if (job.type === 'asset-analysis') setTimeout(() => runAnalysisJob(job.id), 50)
  if (job.type === 'generation') setTimeout(() => runGenerationJob(job.id), 50)
}

async function route(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const pathname = decodeURIComponent(url.pathname)
  if (req.method === 'OPTIONS') return json(res, 204, {})

  if (req.method === 'GET' && pathname.startsWith('/objects/')) {
    const objectKey = path.basename(pathname.replace('/objects/', ''))
    const objectPath = path.join(objectsDir, objectKey)
    if (!existsSync(objectPath)) return json(res, 404, { error: 'not_found' })
    const info = await stat(objectPath)
    res.writeHead(200, {
      'content-type': contentTypes.get(path.extname(objectKey).toLowerCase()) || 'application/octet-stream',
      'content-length': info.size,
      'cache-control': 'public, max-age=31536000, immutable',
      'access-control-allow-origin': '*',
    })
    return createReadStream(objectPath).pipe(res)
  }

  if (req.method === 'POST' && pathname === '/api/auth/login') {
    const input = await readJson(req)
    const db = await loadDb()
    const email = String(input.email || 'demo@xiaoji.local').trim().toLowerCase()
    let user = db.users.find((item) => item.email === email)
    if (!user) {
      user = { id: randomUUID(), email, name: input.name || email.split('@')[0], createdAt: Date.now() }
      db.users.push(user)
      db.trips.push(defaultTrip(user.id))
    }
    const session = { token: randomUUID(), userId: user.id, createdAt: Date.now() }
    db.sessions.push(session)
    await saveDb(db)
    return json(res, 200, { user, token: session.token })
  }

  const db = await loadDb()

  if (req.method === 'GET' && pathname.startsWith('/api/share/')) {
    const share = db.shares.find((item) => item.slug === pathname.split('/').pop())
    if (!share) return json(res, 404, { error: 'not_found' })
    const trip = db.trips.find((item) => item.id === share.tripId)
    return trip ? json(res, 200, { share, trip: publicTrip(db, trip) }) : json(res, 404, { error: 'not_found' })
  }

  const user = userFromRequest(db, req)
  if (!user) return json(res, 401, { error: 'unauthorized' })

  if (req.method === 'GET' && pathname === '/api/me') return json(res, 200, { user })
  if (req.method === 'GET' && pathname === '/api/trips') {
    return json(res, 200, { trips: db.trips.filter((trip) => trip.userId === user.id).sort((a, b) => b.updatedAt - a.updatedAt) })
  }
  if (req.method === 'POST' && pathname === '/api/trips') {
    const input = await readJson(req)
    const trip = {
      id: randomUUID(),
      userId: user.id,
      title: input.title || '新的旅行',
      startDate: input.startDate || '',
      endDate: input.endDate || '',
      events: [],
      seedAssets: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    db.trips.push(trip)
    await saveDb(db)
    return json(res, 201, { trip: publicTrip(db, trip) })
  }

  const tripMatch = pathname.match(/^\/api\/trips\/([^/]+)(?:\/([^/]+))?$/)
  if (tripMatch) {
    const trip = db.trips.find((item) => item.id === tripMatch[1] && item.userId === user.id)
    if (!trip) return json(res, 404, { error: 'not_found' })
    const action = tripMatch[2]
    if (req.method === 'GET' && !action) return json(res, 200, { trip: publicTrip(db, trip) })
    if (req.method === 'PATCH' && !action) {
      const input = await readJson(req)
      if (Array.isArray(input.events)) trip.events = input.events
      if (input.title) trip.title = input.title
      trip.updatedAt = Date.now()
      await saveDb(db)
      return json(res, 200, { trip: publicTrip(db, trip) })
    }
    if (req.method === 'POST' && action === 'assets') {
      const parts = parseMultipart(await readBody(req), req.headers['content-type'] || '')
      const files = parts.filter((part) => part.filename && isSupportedImagePart(part))
      const created = []
      for (const file of files) {
        const hash = createHash('sha256').update(file.content).digest('hex').slice(0, 20)
        const ext = path.extname(file.filename).toLowerCase() || '.jpg'
        const type = file.type === 'application/octet-stream' && contentTypes.has(ext) ? contentTypes.get(ext) : file.type
        const objectKey = `${Date.now()}-${hash}${ext}`
        await writeFile(path.join(objectsDir, objectKey), file.content)
        const asset = {
          id: randomUUID(),
          tripId: trip.id,
          objectKey,
          name: file.filename,
          alt: file.filename,
          type,
          size: file.content.length,
          exif: extractExif(file.content),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        db.assets.push(asset)
        created.push({ ...asset, src: `/objects/${objectKey}`, kind: 'upload', isNew: true })
      }
      const job = {
        id: randomUUID(),
        tripId: trip.id,
        type: 'asset-analysis',
        assetIds: created.map((asset) => asset.id),
        status: 'queued',
        stage: 'queued',
        message: '等待AI生成',
        progress: 0,
        attempts: 1,
        createdAt: Date.now(),
      }
      db.jobs.push(job)
      trip.updatedAt = Date.now()
      await saveDb(db)
      scheduleJob(job)
      return json(res, 201, { assets: created, job })
    }
    if (req.method === 'POST' && action === 'generation-jobs') {
      const input = await readJson(req)
      const job = {
        id: randomUUID(),
        tripId: trip.id,
        type: 'generation',
        mode: input.mode || 'plog',
        style: input.style || 'journal',
        status: 'queued',
        stage: 'queued',
        message: '等待AI生成',
        progress: 0,
        attempts: 1,
        createdAt: Date.now(),
      }
      db.jobs.push(job)
      await saveDb(db)
      scheduleJob(job)
      return json(res, 201, { job })
    }
    if (req.method === 'POST' && action === 'share') {
      let share = db.shares.find((item) => item.tripId === trip.id)
      if (!share) {
        share = { slug: randomUUID().slice(0, 10), tripId: trip.id, createdAt: Date.now(), enabled: true }
        db.shares.push(share)
      }
      await saveDb(db)
      return json(res, 200, { share, url: `/share/${share.slug}` })
    }
  }

  const jobMatch = pathname.match(/^\/api\/jobs\/([^/]+)(?:\/retry)?$/)
  if (jobMatch) {
    const job = db.jobs.find((item) => item.id === jobMatch[1])
    if (!job) return json(res, 404, { error: 'not_found' })
    const trip = db.trips.find((item) => item.id === job.tripId && item.userId === user.id)
    if (!trip) return json(res, 404, { error: 'not_found' })
    if (req.method === 'GET') return json(res, 200, { job, trip: publicTrip(db, trip) })
    if (req.method === 'POST' && pathname.endsWith('/retry')) {
      job.status = 'queued'
      job.progress = 0
      job.error = null
      job.attempts += 1
      job.updatedAt = Date.now()
      await saveDb(db)
      scheduleJob(job)
      return json(res, 200, { job })
    }
  }

  return json(res, 404, { error: 'not_found' })
}

await ensureStorage()

http
  .createServer((req, res) => {
    route(req, res).catch((error) => {
      console.error(error)
      json(res, 500, { error: 'internal_error', message: error.message })
    })
  })
  .listen(port, () => {
    console.log(`Xiaoji API listening on http://127.0.0.1:${port}`)
  })
