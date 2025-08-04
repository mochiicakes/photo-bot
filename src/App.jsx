import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PhotoCapturePage from './pages/PhotoCapturePage';
import CustomizationPage from './pages/CustomizationPage';

const App = () => {
  const [photos, setPhotos] = useState([]);
  const [targetCount, setTargetCount] = useState(1);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={<Navigate to="/capture" replace />}
        />
        <Route
          path="/capture"
          element={
            <PhotoCapturePage
              photos={photos}
              setPhotos={setPhotos}
              targetCount={targetCount}
              setTargetCount={setTargetCount}
            />
          }
        />
        <Route
          path="/customize"
          element={
            <CustomizationPage
              photos={photos}
              onNavigate={() => window.history.back()}
            />
          }
        />
      </Routes>
    </Router>
  );
};

export default App;