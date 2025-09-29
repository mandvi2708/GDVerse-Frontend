import { Routes, Route } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateSession from './pages/CreateSession';
import GDSessionRoom from './pages/GDSessionRoom';
import LandingPage from './pages/LandingPage';
import Contact from './pages/Contact';  // Add this import

import './index.css'; 
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/create-session" element={<CreateSession />} />
      <Route path="/session/:inviteLink" element={<GDSessionRoom />} />
    </Routes>
  );
}

export default App;