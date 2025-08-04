import { useState, useEffect } from 'react'
import PhotoCapturePage from './components/PhotoCapturePage'
import CustomizationPage from './components/CustomizationPage'
import Router, { Page } from './components/Router'

function App() {
  const [photos, setPhotos] = useState([])
  const [currentPage, setCurrentPage] = useState('capture')

    // Load from localStorage on first render
  useEffect(() => {
    const saved = localStorage.getItem('photo-bot-photos')
    if (saved) setPhotos(JSON.parse(saved))
  }, [])

  // Save to localStorage when photos change
  useEffect(() => {
    localStorage.setItem('photo-bot-photos', JSON.stringify(photos))
  }, [photos])

  return (
    <>
      {/* Google Font Import */}
      <link
        href="https://fonts.googleapis.com/css2?family=Just+Another+Hand&display=swap" 
        rel="stylesheet"
      />
      <Router currentPage={currentPage}>
        <Page name="capture">
          <PhotoCapturePage
            photos={photos}
            setPhotos={setPhotos}
            onNavigate={setCurrentPage}
          />
        </Page>
        <Page name="customize">
          <CustomizationPage
            photos={photos}
            onNavigate={setCurrentPage}
          />
        </Page>
      </Router>
    </>
  )
}

export default App