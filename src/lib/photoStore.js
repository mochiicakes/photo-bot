// Photo blobs live in IndexedDB (sessionStorage is far too small for full-HD photos).
// Falls back to memory when IndexedDB is unavailable (e.g. some private modes).

const DB_NAME = 'tsuki-cam'
const STORE = 'photos'

let dbPromise
const memory = new Map()

const openDb = () => {
  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      try {
        const req = indexedDB.open(DB_NAME, 1)
        req.onupgradeneeded = () => req.result.createObjectStore(STORE)
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => resolve(null)
        req.onblocked = () => resolve(null)
      } catch {
        resolve(null)
      }
    })
  }
  return dbPromise
}

const run = async (mode, fn) => {
  const db = await openDb()
  if (!db) return fn(null)
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const result = fn(tx.objectStore(STORE))
    tx.oncomplete = () => resolve(result?.result ?? result)
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`)

export const putPhoto = async (blob) => {
  const id = newId()
  try {
    await run('readwrite', (store) => (store ? store.put({ blob, savedAt: Date.now() }, id) : memory.set(id, blob)))
  } catch {
    memory.set(id, blob)
  }
  return id
}

export const getPhoto = async (id) => {
  if (memory.has(id)) return memory.get(id)
  try {
    const entry = await run('readonly', (store) => (store ? store.get(id) : null))
    return entry?.blob ?? null
  } catch {
    return null
  }
}

export const deletePhoto = async (id) => {
  memory.delete(id)
  try {
    await run('readwrite', (store) => store?.delete(id))
  } catch {
    /* already gone */
  }
}

const STALE_MS = 24 * 60 * 60 * 1000

/**
 * Cleans up photos left behind by earlier sessions: anything not in `keepIds` that is
 * over a day old. Recent ones are kept because another open tab may still be using them.
 */
export const pruneExcept = async (keepIds) => {
  const keep = new Set(keepIds)
  const cutoff = Date.now() - STALE_MS
  try {
    await run('readwrite', (store) => {
      if (!store) return
      const req = store.openCursor()
      req.onsuccess = () => {
        const cursor = req.result
        if (!cursor) return
        const stale = !(cursor.value?.savedAt > cutoff)
        if (!keep.has(cursor.key) && stale) cursor.delete()
        cursor.continue()
      }
    })
  } catch {
    /* best effort */
  }
}
