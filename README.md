# Photo-bot

A virtual photobooth that runs entirely in the browser. Snap photos with your webcam (or upload them), pick a filter, frame and caption, and download a photo strip.

**Live:** https://photo-bot-kappa.vercel.app

## Features

- **Camera or upload.** Take 1–4 shots with a 3/5/10s self-timer, or drag in your own photos.
- **Filters.** Original, B&W, Sepia, Warm, Vintage, Bold. They preview live on the camera and are baked into the export.
- **Layouts.** A classic vertical strip, or a 2×2 grid when you have 4 photos.
- **Customize.** Preset or custom frame colors, a caption and an optional date stamp.
- **Save & share.** High-res PNG download, plus the native share sheet on supported devices (iOS/Android).
- **Private by design.** Photos never leave the device. There's no backend and no uploads. The current session is kept in `sessionStorage` so a refresh doesn't lose your strip.
- Light and dark mode (follows the system, remembers your choice) and a responsive mobile layout.

## Tech

React 19 · Vite 7 · Tailwind CSS 4 · React Router 7 · lucide-react

The strip is drawn on a `<canvas>` by [`src/lib/renderStrip.js`](src/lib/renderStrip.js). The preview and the download share that code, so what you see is what you get. Filters are defined once in [`src/lib/filters.js`](src/lib/filters.js) as CSS filter functions. They're used directly for live previews and applied pixel by pixel for exports, because Safari doesn't support `ctx.filter`.

## Development

```bash
npm install
npm run dev       # http://localhost:5173
npm run lint
npm run build     # outputs to dist/
npm run preview   # serve the production build
```

Camera access requires a secure context: `localhost` or HTTPS.

## Deploy

Deployed on Vercel with the Vite preset; no environment variables are needed. [`vercel.json`](vercel.json) adds an SPA rewrite so `/capture` and `/customize` load directly, plus security headers (`Permissions-Policy` limits camera access to this site).
