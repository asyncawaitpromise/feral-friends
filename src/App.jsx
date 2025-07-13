import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Homepage from "./routes/Homepage.tsx";
import Game from "./routes/Game.tsx";
import Reference from "./routes/Reference.jsx";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/game" element={<Game />} />
        <Route path="/help" element={<Reference />} />
        <Route path="*" element={<div className="min-h-screen bg-gray-100 flex items-center justify-center"><p className="text-2xl font-bold text-red-600">Page Not Found</p></div>} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;