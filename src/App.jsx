import { Routes, Route } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import CandidateDashboard from './pages/CandidateDashboard';
import ReportsHistory from './pages/ReportsHistory';
import ProfileSettings from './pages/ProfileSettings';
import CreateSession from './pages/CreateSession';
import GDSessionRoom from './pages/GDSessionRoom';
import LandingPage from './pages/LandingPage';
import Contact from './pages/Contact';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import InterviewSetup from './pages/InterviewSetup';
import InterviewRoom from './pages/InterviewRoom';
import InterviewReport from './pages/InterviewReport';

import QuizPlay from './pages/QuizPlay';
import QuizReport from './pages/QuizReport';

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
      
      {/* Protected Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><CandidateDashboard /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><ReportsHistory /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
      
      {/* Interview & Quiz Routes */}
      <Route path="/interview/setup" element={<ProtectedRoute><InterviewSetup /></ProtectedRoute>} />
      <Route path="/interview/:id" element={<ProtectedRoute><InterviewRoom /></ProtectedRoute>} />
      <Route path="/interview/report/:id" element={<ProtectedRoute><InterviewReport /></ProtectedRoute>} />
      
      <Route path="/quiz/setup" element={<ProtectedRoute><InterviewSetup /></ProtectedRoute>} />
      <Route path="/quiz/:id" element={<ProtectedRoute><QuizPlay /></ProtectedRoute>} />
      <Route path="/quiz/report/:id" element={<ProtectedRoute><QuizReport /></ProtectedRoute>} />

      {/* Legacy Session Routes (Kept for feature parity as requested) */}
      <Route path="/create-session" element={<ProtectedRoute><CreateSession /></ProtectedRoute>} />
      <Route path="/session/:inviteLink" element={<ProtectedRoute><GDSessionRoom /></ProtectedRoute>} />
    </Routes>
  );
}


export default App;