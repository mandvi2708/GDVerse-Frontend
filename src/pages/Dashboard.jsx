import { useEffect, useState } from 'react';
import api from '../api';
import { Link, useNavigate } from 'react-router-dom';

function Dashboard() {
  const [mySessions, setMySessions] = useState([]);
  const [allSessions, setAllSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('mine'); // 'mine' or 'discover'
  const [hoveredCard, setHoveredCard] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [showMomModal, setShowMomModal] = useState(false);
  const [selectedMom, setSelectedMom] = useState('');
  const navigate = useNavigate();

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const [myRes, allRes] = await Promise.all([
        api.get('/api/sessions/my-sessions'),
        api.get('/api/sessions/all')
      ]);
      setMySessions(myRes.data);
      setAllSessions(allRes.data);
    } catch (err) {
      console.error('Failed to fetch sessions:', err.message);
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
      await api.delete(`/api/sessions/delete/${id}`);
      fetchSessions();
    } catch (err) {
      console.error('Delete failed:', err.message);
      alert('Only the creator can delete their session');
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const getSessionStatus = (date, time) => {
    const sessionDate = new Date(`${date}T${time}`);
    const now = new Date();
    const diff = now - sessionDate;
    
    if (diff >= 0 && diff < 3600000) return 'live'; // Live for 1 hour
    if (diff < 0) return 'upcoming';
    return 'ended';
  };

  const ongoingSessions = allSessions.filter(s => getSessionStatus(s.date, s.time) === 'live');
  const upcomingSessions = allSessions.filter(s => getSessionStatus(s.date, s.time) === 'upcoming');
  const myOwnSessions = mySessions;

  const displaySessions = activeTab === 'mine' 
    ? myOwnSessions 
    : (activeTab === 'ongoing' ? ongoingSessions : upcomingSessions);

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              GD<span className="text-indigo-600">Verse</span> Dashboard
            </h1>
            <p className="text-slate-500 mt-2 font-medium">Connect, Discuss, and Analyze with AI</p>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <Link 
              to="/create-session"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 flex-1 md:flex-none font-bold"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <span>New Session</span>
            </Link>
            
            <button
              onClick={handleLogout}
              className="bg-white hover:bg-slate-50 text-slate-600 px-6 py-3 rounded-xl shadow-sm border border-slate-200 transition-all flex items-center justify-center gap-2 font-semibold"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap p-1 bg-slate-200/50 rounded-2xl mb-8 w-fit gap-1">
          <button
            onClick={() => setActiveTab('mine')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'mine' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            My Sessions
          </button>
          <button
            onClick={() => setActiveTab('ongoing')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'ongoing' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <span className="flex items-center gap-2">
              {ongoingSessions.length > 0 && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
              Ongoing
            </span>
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'upcoming' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Upcoming
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col justify-center items-center h-80 gap-4">
            <div className="animate-spin rounded-full h-14 w-14 border-4 border-slate-200 border-t-indigo-600"></div>
            <p className="text-slate-400 font-medium animate-pulse">Syncing sessions...</p>
          </div>
        ) : displaySessions.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm p-16 text-center border border-slate-100">
            <div className="mx-auto w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6 text-4xl">
              {activeTab === 'mine' ? '📂' : (activeTab === 'ongoing' ? '📡' : '⏳')}
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3">
              {activeTab === 'mine' ? 'No sessions found' : (activeTab === 'ongoing' ? 'No live sessions' : 'No upcoming sessions')}
            </h3>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
              {activeTab === 'mine' 
                ? "You haven't created any sessions yet. Start by creating one to invite others." 
                : "There are no sessions available in this category at the moment."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displaySessions.map((session) => (
              <div 
                key={session._id}
                className={`bg-white p-6 rounded-3xl shadow-sm transition-all duration-300 border border-slate-100 group relative ${
                  hoveredCard === session._id ? 'shadow-xl shadow-slate-200/50 -translate-y-1 border-indigo-100' : ''
                }`}
                onMouseEnter={() => setHoveredCard(session._id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {getSessionStatus(session.date, session.time) === 'live' && (
                  <span className="absolute top-4 right-4 bg-red-100 text-red-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></span>
                    Live Now
                  </span>
                )}

                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xl">
                      🚀
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-800 truncate max-w-[150px]">
                        {session.inviteLink}
                      </h2>
                      <p className="text-xs text-slate-400 font-medium italic">
                        By {session.creator?.name || 'Unknown'}
                      </p>
                    </div>
                  </div>
                  {activeTab === 'mine' && (
                    <button
                      onClick={() => handleDelete(session._id)}
                      disabled={deletingId === session._id}
                      className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
                    >
                      {deletingId === session._id ? '...' : '✕'}
                    </button>
                  )}
                </div>

                <div className="space-y-3 mb-8">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">📅</span>
                      <span className="text-sm font-semibold text-slate-600">{session.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">⏰</span>
                      <span className="text-sm font-semibold text-slate-600">{session.time}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 px-3 py-1">
                    <span className="text-slate-400 text-sm">👥</span>
                    <div className="flex gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider">{session.aiCount} AI BOTS</span>
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-600 text-[10px] font-bold uppercase tracking-wider">{session.humanCount} HUMANS</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Link 
                    to={`/session/${session.inviteLink}`}
                    className={`w-full py-3 rounded-2xl font-bold text-center transition-all flex items-center justify-center gap-2 ${
                      getSessionStatus(session.date, session.time) === 'upcoming' 
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                      : 'bg-slate-900 hover:bg-slate-800 text-white group-hover:bg-indigo-600'
                    }`}
                    onClick={(e) => {
                      if (getSessionStatus(session.date, session.time) === 'upcoming') {
                        e.preventDefault();
                        alert(`This session starts at ${session.time} on ${session.date}. Please wait!`);
                      }
                    }}
                  >
                    {getSessionStatus(session.date, session.time) === 'upcoming' ? 'Waiting...' : 'Join Discussion'}
                    {getSessionStatus(session.date, session.time) !== 'upcoming' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                  </Link>
                  
                  {activeTab === 'mine' && session.minutesOfMeeting && (
                    <button 
                      onClick={() => {
                        setSelectedMom(session.minutesOfMeeting);
                        setShowMomModal(true);
                      }}
                      className="w-full bg-white border border-slate-200 text-slate-600 py-3 rounded-2xl font-bold transition-all hover:bg-slate-50 flex items-center justify-center gap-2"
                    >
                      📄 View AI Summary
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MOM Modal */}
      {showMomModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900">AI Minutes of Meeting</h3>
                <p className="text-sm text-slate-500 mt-1">Generated discussion summary</p>
              </div>
              <button 
                onClick={() => setShowMomModal(false)}
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-slate-600 shadow-sm border border-slate-100 transition-all"
              >
                ✕
              </button>
            </div>
            <div className="p-8 overflow-y-auto flex-1 bg-white">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-700 bg-slate-50 p-6 rounded-3xl border border-slate-100 italic">
                {selectedMom}
              </pre>
            </div>
            <div className="p-8 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
              <button
                onClick={() => {
                  const blob = new Blob([selectedMom], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `MOM.txt`;
                  a.click();
                }}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 transition-all"
              >
                Download Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
