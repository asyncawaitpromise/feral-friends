import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { lazy, Suspense } from 'react';

// Lazy load route components for code splitting
const Homepage = lazy(() => import("./routes/Homepage.tsx"));
const Game = lazy(() => import("./routes/Game.tsx"));

// Test with simple components first
const SimpleReference = () => <div>Simple Reference Works</div>;

const App = () => {
  try {
    return (
      <BrowserRouter>
        <Suspense fallback={<div className="min-h-screen bg-gray-100 flex items-center justify-center"><div className="text-xl">Loading...</div></div>}>
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/game" element={<Game />} />
            <Route path="/help" element={<SimpleReference />} />
            <Route path="*" element={<div className="min-h-screen bg-gray-100 flex items-center justify-center"><p className="text-2xl font-bold text-red-600">Page Not Found</p></div>} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    );
  } catch (error) {
    console.error('App render error:', error);
    return <div>Error loading app: {error.message}</div>;
  }
};

export default App;