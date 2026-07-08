const API_BASE = import.meta.env.VITE_API_URL || ''
const SESSION_KEY = 'xiaoji.session.v1'

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
  } catch {
    return null
  }
}

function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

async function request(path, options = {}) {
  const session = readSession()
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { 'content-type': 'application/json' }),
      ...(session?.token ? { authorization: `Bearer ${session.token}` } : {}),
      ...options.headers,
    },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data.message || data.error || '请求失败')
    error.status = response.status
    throw error
  }
  return data
}

export function getStoredSession() {
  return readSession()
}

export async function login(payload) {
  const session = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  saveSession(session)
  return session
}

export function logout() {
  localStorage.removeItem(SESSION_KEY)
}

export const api = {
  getTrips: () => request('/api/trips'),
  getTrip: (tripId) => request(`/api/trips/${tripId}`),
  createTrip: (payload) =>
    request('/api/trips', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  saveTrip: (tripId, payload) =>
    request(`/api/trips/${tripId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteTrip: (tripId) =>
    request(`/api/trips/${tripId}`, {
      method: 'DELETE',
    }),
  uploadAssets: (tripId, files) => {
    const form = new FormData()
    files.forEach((file) => form.append('files', file, file.name))
    return request(`/api/trips/${tripId}/assets`, {
      method: 'POST',
      body: form,
    })
  },
  createGenerationJob: (tripId, payload) =>
    request(`/api/trips/${tripId}/generation-jobs`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getJob: (jobId) => request(`/api/jobs/${jobId}`),
  retryJob: (jobId) =>
    request(`/api/jobs/${jobId}/retry`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),
  shareTrip: (tripId) =>
    request(`/api/trips/${tripId}/share`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),
  getShare: (slug) => request(`/api/share/${slug}`),
}
