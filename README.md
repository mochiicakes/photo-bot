# Tsuki Cam 月カメ

A cute, moonlit photobooth that runs entirely in the browser. Snap photos with your webcam (or upload them), pick a filter, frame and caption, and download your photo strip.

**Live:** https://photo-bot-kappa.vercel.app

## Features

- **Camera or upload.** Take 1–4 shots with a 3/5/10s self-timer, or drag in your own photos.
- **Screen light.** The screen glows pink, lilac, blue or white to light your face, like the Xiaohongshu screen-light trick. Turn your brightness all the way up.
- **Photo shape.** 3:4 portrait, 1:1 square or 4:3 landscape, matched in the live preview and the export.
- **Layouts.** Strip (vertical), side by side (2–3 photos), or a 2×2 collage (4 photos), framed or frameless.
- **41 filters in three groups.** They preview live on the camera and are baked into the export.
  - *Tsuki 月*: soft, airy originals inspired by Japanese and Xiaohongshu photo trends: Toumei 透明, Cream, Sakura 桜, Moonlight 月光, Peach 桃, Yume 夢, Film, Showa 昭和, Neon, Matcha 抹茶.
  - *Classic*: 26 popular photo-app looks (Clarendon, Valencia, X-Pro II, Moon…) adapted from [CSSgram](https://github.com/una/CSSgram) by Una Kravets (MIT).
  - *Basic*: B&W, Sepia, Warm, Vintage, Bold.
  - A **strength** slider fades any filter from 0–100%.
- **Beauty 美顔.** Live skin smoothing (美肌) and brightening (美白) with adjustable levels. A WebGL bilateral blur only touches skin tones, so eyes, hair and edges stay sharp. It runs on the live camera and again at export, so you can still change it after taking the photo.
- **Customize.** Frame colors (or pick your own), a caption (Japanese and other scripts supported) and an optional date stamp.
- **Save & share.** High-res PNG download, plus the native share sheet on supported devices (iOS/Android).
- **Front/back camera and mirror.** Switch cameras on phones and turn mirroring on or off. The saved photo always matches the preview.
- **Installable app.** Add it to your home screen; it works offline after the first visit.
- **Private by design.** Photos never leave the device. There's no backend and no uploads. Photos are kept in IndexedDB for the current tab, so a refresh doesn't lose your strip.
- Starry navy dark mode and a soft white light mode with yellow stars (follows your system, remembers your choice), plus a responsive mobile layout.

## Tech

React 19 · Vite 7 · Tailwind CSS 4 · React Router 7 · lucide-react

The strip is drawn on a `<canvas>` by [`src/lib/renderStrip.js`](src/lib/renderStrip.js). The preview and the download share that code, so what you see is what you get. Filters are defined once in [`src/lib/filters.js`](src/lib/filters.js) as blend-mode overlays plus CSS filter functions. Live previews render them with CSS (`mix-blend-mode` + `filter`). Exports draw the same overlays with canvas compositing, then apply the color functions pixel by pixel, because Safari doesn't support `ctx.filter`, so the saved PNG matches the preview. The beauty pass is a WebGL shader in [`src/lib/beauty.js`](src/lib/beauty.js), applied to each full frame before cropping and filtering. Layout, shape, frame and screen-light options live in [`src/lib/options.js`](src/lib/options.js), and theme colors are CSS variables in [`src/index.css`](src/index.css).

## Development

```bash
npm install
npm run dev       # http://localhost:5173
npm run lint
npm run build     # outputs to dist/
npm run preview   # serve the production build
```

Camera access requires a secure context: `localhost` or HTTPS.

## Analytics

[Vercel Web Analytics](https://vercel.com/docs/analytics) is cookie-free and records page views on every plan. Enable it in the Vercel project's **Analytics** tab. Download/share events (which filter, layout, shape and frame were used; never any photo data) are sent with `trackEvent` in [`src/lib/analytics.js`](src/lib/analytics.js), but Vercel only records custom events on the Pro plan and above.

## Deploy

Deployed on Vercel with the Vite preset; no environment variables are needed. [`vercel.json`](vercel.json) adds an SPA rewrite so `/capture` and `/customize` load directly, plus security headers (`Permissions-Policy` limits camera access to this site).
