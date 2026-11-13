import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import PhotoCapturePage from './pages/PhotoCapturePage'
import CustomizationPage from './pages/CustomizationPage'

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/capture" element={<PhotoCapturePage />} />
      <Route path="/customize" element={<CustomizationPage />} />
      <Route path="*" element={<Navigate to="/capture" replace />} />
    </Routes>
  </BrowserRouter>
)

export default App
