import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

function Dashboard() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();

  const backendURL = import.meta.env.VITE_BACKEND_URL;

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${backendURL}/api/sessions/my-sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSessions(res.data);
    } catch (err) {
      console.error('Failed to fetch sessions:', err.message);
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg';
      errorDiv.textContent = 'Failed to load sessions';
      document.body.appendChild(errorDiv);
      setTimeout(() => errorDiv.remove(), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    const confirm = window.confirm('Are you sure you want to delete this session?');
    if (!confirm) {
      setDeletingId(null);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${backendURL}/api/sessions/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg';
      successDiv.textContent = 'Session deleted successfully';
      document.body.appendChild(successDiv);
      setTimeout(() => successDiv.remove(), 3000);
      fetchSessions();
    } catch (err) {
      console.error('Delete failed:', err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    const logoutDiv = document.createElement('div');
    logoutDiv.className = 'fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded shadow-lg';
    logoutDiv.textContent = 'Logged out successfully';
    document.body.appendChild(logoutDiv);
    setTimeout(() => {
      logoutDiv.remove();
      navigate('/login');
    }, 1000);
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              <span className="inline-block bg-indigo-100 text-indigo-600 px-3 py-1 rounded-lg mr-2">📋</span>
              Your GD Sessions
            </h1>
            <p className="text-gray-500 mt-1">Manage your group discussion sessions</p>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <Link 
              to="/create-session"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-md transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 flex-1 md:flex-none"
            >
              <span className="text-lg">+</span>
              <span>Create Session</span>
            </Link>
            
            <button
              onClick={handleLogout}
              className="bg-white hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg shadow hover:shadow-md transition-all duration-200 border border-gray-200 flex items-center justify-center gap-2"
            >
              <span className="text-lg">⎋</span>
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="mx-auto w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4 text-3xl">
              👥
            </div>
            <h3 className="text-xl font-medium text-gray-800 mb-2">No sessions yet</h3>
            <p className="text-gray-500 mb-6">Create your first session to get started</p>
            <Link 
              to="/create-session"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg inline-flex items-center gap-2 transform hover:scale-105 transition-all duration-200"
            >
              <span>+</span>
              Create Session
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sessions.map((session) => (
              <div 
                key={session._id}
                className={`bg-white p-5 rounded-xl shadow-sm transition-all duration-300 border border-gray-100 ${
                  hoveredCard === session._id ? 'transform hover:scale-102 hover:shadow-md hover:border-indigo-200' : ''
                }`}
                onMouseEnter={() => setHoveredCard(session._id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="flex justify-between items-start mb-3">
                  <h2 className="text-lg font-semibold text-gray-800 truncate">
                    <span className="text-indigo-500 mr-2">🔗</span>
                    {session.inviteLink}
                  </h2>
                  <button
                    onClick={() => handleDelete(session._id)}
                    disabled={deletingId === session._id}
                    className={`text-gray-400 hover:text-red-500 transition-colors p-1 ${
                      deletingId === session._id ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {deletingId === session._id ? '🗑️...' : '🗑️'}
                  </button>
                </div>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-400">📅</span>
                    <span>Date: {session.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-400">⏰</span>
                    <span>Time: {session.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-400">👥</span>
                    <span>
                      Participants: <span className="font-medium">{session.aiCount} AI</span>,{' '}
                      <span className="font-medium">{session.humanCount} Human</span>
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <Link 
                    to={`/session/${session.inviteLink}`}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm transform hover:scale-105 transition-all duration-200"
                  >
                    Join Session
                  </Link>
                  
                  <div className="flex items-center text-xs text-gray-400 gap-1">
                    <span>📊</span>
                    <span>Analytics coming soon</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
