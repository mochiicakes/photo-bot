import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { deletePhoto, getPhoto, pruneExcept, putPhoto } from '../lib/photoStore'

const STORAGE_KEY = 'tsuki-cam-session'

const DEFAULTS = {
  targetCount: 4,
  filter: 'none',
  filterStrength: 1,
  smooth: 0,
  brighten: 0,
  layout: 'vertical',
  aspect: 'portrait',
  frame: 'classic',
  frameColor: '#fdfdff',
  caption: '',
  showDate: true,
  showMoon: true,
  filmDate: false,
  posePrompts: true,
  mirror: true,
}

// Settings and photo ids persist in sessionStorage; the photo blobs live in IndexedDB.
const loadStored = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return { settings: DEFAULTS, photoIds: [], legacyPhotos: [] }
    const { photoIds = [], photos: legacyPhotos = [], ...settings } = JSON.parse(raw)
    return { settings: { ...DEFAULTS, ...settings }, photoIds, legacyPhotos }
  } catch {
    return { settings: DEFAULTS, photoIds: [], legacyPhotos: [] }
  }
}

const PhotoSessionContext = createContext(null)

export const PhotoSessionProvider = ({ children }) => {
  const [stored] = useState(loadStored)
  const [settings, setSettings] = useState(stored.settings)
  const [shots, setShots] = useState([]) // [{ id, url }]
  const [hydrated, setHydrated] = useState(false)
  const knownIds = useRef(new Map()) // id -> url, to clean up removed shots
  const targetCountRef = useRef(settings.targetCount)

  useEffect(() => {
    targetCountRef.current = settings.targetCount
  }, [settings.targetCount])

  // Restore this tab's photos from IndexedDB (and migrate older data-URL sessions).
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const legacyBlobs = await Promise.all(
        stored.legacyPhotos.map((src) => fetch(src).then((r) => r.blob()).catch(() => null)),
      )
      const legacyIds = await Promise.all(legacyBlobs.filter(Boolean).map(putPhoto))
      const ids = [...stored.photoIds, ...legacyIds]
      const blobs = await Promise.all(ids.map(getPhoto))
      if (cancelled) return
      const restored = ids.flatMap((id, i) => (blobs[i] ? [{ id, url: URL.createObjectURL(blobs[i]) }] : []))
      setShots(restored)
      setHydrated(true)
      pruneExcept(restored.map((s) => s.id))
    })()
    return () => {
      cancelled = true
    }
  }, [stored])

  // Any shot that disappears (removed, cleared, trimmed) gets its blob deleted and URL freed.
  useEffect(() => {
    const current = new Set(shots.map((s) => s.id))
    for (const [id, url] of knownIds.current) {
      if (!current.has(id)) {
        URL.revokeObjectURL(url)
        deletePhoto(id)
        knownIds.current.delete(id)
      }
    }
    for (const s of shots) knownIds.current.set(s.id, s.url)
  }, [shots])

  // Persist settings + photo ids so a refresh on /customize doesn't lose anything.
  useEffect(() => {
    if (!hydrated) return
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...settings, photoIds: shots.map((s) => s.id) }))
    } catch {
      /* storage unavailable; the session just won't survive a refresh */
    }
  }, [settings, shots, hydrated])

  const update = useCallback((patch) => setSettings((s) => ({ ...s, ...patch })), [])

  /** Stores photo Blobs and appends them (up to the target count). */
  const addPhotos = useCallback(async (blobs) => {
    const added = await Promise.all(
      blobs.filter(Boolean).map(async (blob) => ({ id: await putPhoto(blob), url: URL.createObjectURL(blob) })),
    )
    // Register first so the cleanup effect can free any that get trimmed.
    for (const s of added) knownIds.current.set(s.id, s.url)
    setShots((prev) => [...prev, ...added].slice(0, targetCountRef.current))
  }, [])

  const removePhoto = useCallback((index) => setShots((prev) => prev.filter((_, i) => i !== index)), [])

  const clearPhotos = useCallback(() => setShots([]), [])

  const setTargetCount = useCallback((n) => {
    setSettings((s) => ({ ...s, targetCount: n }))
    setShots((prev) => prev.slice(0, n))
  }, [])

  const photos = useMemo(() => shots.map((s) => s.url), [shots])

  const value = useMemo(
    () => ({ ...settings, photos, hydrated, update, addPhotos, removePhoto, clearPhotos, setTargetCount }),
    [settings, photos, hydrated, update, addPhotos, removePhoto, clearPhotos, setTargetCount],
  )

  return <PhotoSessionContext.Provider value={value}>{children}</PhotoSessionContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const usePhotoSession = () => useContext(PhotoSessionContext)
