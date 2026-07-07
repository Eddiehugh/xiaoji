const DB_NAME = 'xiaoji_travel_demo'
const DB_VERSION = 1
const UPLOAD_STORE = 'uploads'
const TRIP_STATE_KEY = 'xiaoji.travel.trip.v1'

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(UPLOAD_STORE)) {
        db.createObjectStore(UPLOAD_STORE, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function wrapRequest(request, db) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    if (db) {
      db.onabort = () => reject(db.error || new Error('IndexedDB transaction aborted'))
      db.onerror = () => reject(db.error || new Error('IndexedDB transaction failed'))
    }
  })
}

export async function saveUploadRecord(record) {
  const db = await openDatabase()
  try {
    const tx = db.transaction(UPLOAD_STORE, 'readwrite')
    const store = tx.objectStore(UPLOAD_STORE)
    await wrapRequest(store.put(record), tx)
    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}

export async function loadUploadRecords() {
  const db = await openDatabase()
  try {
    const tx = db.transaction(UPLOAD_STORE, 'readonly')
    const store = tx.objectStore(UPLOAD_STORE)
    const records = await wrapRequest(store.getAll(), tx)
    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
    return records.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
  } finally {
    db.close()
  }
}

export async function clearUploadRecords() {
  const db = await openDatabase()
  try {
    const tx = db.transaction(UPLOAD_STORE, 'readwrite')
    const store = tx.objectStore(UPLOAD_STORE)
    await wrapRequest(store.clear(), tx)
    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}

export function loadTripState() {
  const raw = localStorage.getItem(TRIP_STATE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveTripState(state) {
  localStorage.setItem(TRIP_STATE_KEY, JSON.stringify(state))
}

export function clearTripState() {
  localStorage.removeItem(TRIP_STATE_KEY)
}
