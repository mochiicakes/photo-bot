import { inject, track } from '@vercel/analytics'

// Cookie-free Vercel Web Analytics. Page views work on every plan; custom events
// (trackEvent) are only recorded on Vercel Pro and above. No photo data is ever sent.
export const initAnalytics = () => {
  try {
    inject()
  } catch {
    /* analytics is optional */
  }
}

export const trackEvent = (name, props) => {
  try {
    track(name, props)
  } catch {
    /* analytics is optional */
  }
}
