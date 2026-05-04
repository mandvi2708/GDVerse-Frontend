import { Routes, Route } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateSession from './pages/CreateSession';
import GDSessionRoom from './pages/GDSessionRoom';
import LandingPage from './pages/LandingPage';
import Contact from './pages/Contact';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

import './index.css'; 
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/create-session" element={<ProtectedRoute><CreateSession /></ProtectedRoute>} />
      <Route path="/session/:inviteLink" element={<ProtectedRoute><GDSessionRoom /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;