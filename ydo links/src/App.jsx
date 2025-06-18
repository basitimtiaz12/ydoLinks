import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DeepLinkHandler from './pages/DeepLinkHandler';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/:code" element={<DeepLinkHandler />} />
        {/* Optional: fallback/default route */}
        <Route path="*" element={<div>404 - Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
