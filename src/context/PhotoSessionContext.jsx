import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'photo-bot-session'

const DEFAULTS = {
  photos: [],
  targetCount: 4,
  filter: 'none',
  layout: 'strip',
  frameColor: '#f5f5f4',
  caption: '',
  showDate: true,
}

const loadSession = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS
  } catch {
    return DEFAULTS
  }
}

const PhotoSessionContext = createContext(null)

export const PhotoSessionProvider = ({ children }) => {
  const [session, setSession] = useState(loadSession)

  // Persist so a refresh on /customize doesn't lose the photos.
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    } catch {
      // Storage full or disabled: drop the stale copy so a refresh starts clean.
      try {
        sessionStorage.removeItem(STORAGE_KEY)
      } catch {
        /* storage unavailable */
      }
    }
  }, [session])

  const update = useCallback((patch) => setSession((s) => ({ ...s, ...patch })), [])

  const addPhotos = useCallback(
    (newPhotos) => setSession((s) => ({ ...s, photos: [...s.photos, ...newPhotos].slice(0, s.targetCount) })),
    [],
  )

  const removePhoto = useCallback(
    (index) => setSession((s) => ({ ...s, photos: s.photos.filter((_, i) => i !== index) })),
    [],
  )

  const clearPhotos = useCallback(() => setSession((s) => ({ ...s, photos: [] })), [])

  const setTargetCount = useCallback(
    (n) => setSession((s) => ({ ...s, targetCount: n, photos: s.photos.slice(0, n) })),
    [],
  )

  const value = useMemo(
    () => ({ ...session, update, addPhotos, removePhoto, clearPhotos, setTargetCount }),
    [session, update, addPhotos, removePhoto, clearPhotos, setTargetCount],
  )

  return <PhotoSessionContext.Provider value={value}>{children}</PhotoSessionContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const usePhotoSession = () => useContext(PhotoSessionContext)
