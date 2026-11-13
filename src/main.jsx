import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext'
import { PhotoSessionProvider } from './context/PhotoSessionContext'
import { initAnalytics } from './lib/analytics'
import './index.css'

initAnalytics()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <PhotoSessionProvider>
        <App />
      </PhotoSessionProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
