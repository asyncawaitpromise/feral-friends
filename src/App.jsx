import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Homepage from "./routes/Homepage.tsx";
import Game from "./routes/Game.tsx";

// Test with simple components first
const SimpleReference = () => <div>Simple Reference Works</div>;

const App = () => {
  try {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/game" element={<Game />} />
          <Route path="/help" element={<SimpleReference />} />
          <Route path="*" element={<div className="min-h-screen bg-gray-100 flex items-center justify-center"><p className="text-2xl font-bold text-red-600">Page Not Found</p></div>} />
        </Routes>
      </BrowserRouter>
    );
  } catch (error) {
    console.error('App render error:', error);
    return <div>Error loading app: {error.message}</div>;
  }
};

export default App;