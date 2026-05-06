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
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-sans selection:bg-fuchsia-500/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px]"></div>
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-fuchsia-600/10 blur-[120px]"></div>
        <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[50%] rounded-full bg-cyan-600/5 blur-[120px]"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 backdrop-blur-sm bg-white/5 p-6 rounded-3xl border border-white/10 shadow-2xl">
          <div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-rose-400">
              GDVerse Hub
            </h1>
            <p className="text-slate-400 mt-2 font-medium">Connect, Discuss, and Analyze with AI intelligence.</p>
          </div>
          
          <div className="flex gap-4 w-full md:w-auto">
            <Link 
              to="/create-session"
              className="bg-gradient-to-r from-indigo-500 to-fuchsia-500 hover:from-indigo-400 hover:to-fuchsia-400 text-white px-8 py-3.5 rounded-2xl shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] flex items-center justify-center gap-2 flex-1 md:flex-none font-bold"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <span>New Session</span>
            </Link>
            
            <button
              onClick={handleLogout}
              className="bg-white/5 hover:bg-white/10 text-white px-6 py-3.5 rounded-2xl shadow-sm border border-white/10 transition-all flex items-center justify-center gap-2 font-semibold hover:-translate-y-1"
            >
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap p-1.5 bg-white/5 backdrop-blur-md rounded-2xl mb-10 w-fit gap-2 border border-white/5 shadow-xl">
          <button
            onClick={() => setActiveTab('mine')}
            className={`px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'mine' ? 'bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            My Sessions
          </button>
          <button
            onClick={() => setActiveTab('ongoing')}
            className={`px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'ongoing' ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <span className="flex items-center gap-2">
              {ongoingSessions.length > 0 && <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.8)]"></span>}
              Ongoing
            </span>
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'upcoming' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            Upcoming
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col justify-center items-center h-80 gap-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-xl bg-indigo-500/30 animate-pulse"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/10 border-t-fuchsia-500 relative z-10"></div>
            </div>
            <p className="text-slate-400 font-medium animate-pulse tracking-widest uppercase text-sm">Synchronizing Matrix...</p>
          </div>
        ) : displaySessions.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-20 text-center border border-white/10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-fuchsia-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="mx-auto w-28 h-28 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-8 text-5xl shadow-[0_0_30px_rgba(255,255,255,0.05)]">
              {activeTab === 'mine' ? '🌌' : (activeTab === 'ongoing' ? '📡' : '⏳')}
            </div>
            <h3 className="text-3xl font-bold text-white mb-4 tracking-tight">
              {activeTab === 'mine' ? 'The Void is Empty' : (activeTab === 'ongoing' ? 'No Live Transmissions' : 'No Future Events')}
            </h3>
            <p className="text-slate-400 mb-8 max-w-md mx-auto text-lg">
              {activeTab === 'mine' 
                ? "You haven't initiated any sessions yet. Spark a new discussion to populate your universe." 
                : "There are no sessions available in this sector at the moment."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displaySessions.map((session) => (
              <div 
                key={session._id}
                className={`bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl transition-all duration-500 border border-white/10 group relative overflow-hidden ${
                  hoveredCard === session._id ? '-translate-y-2 shadow-[0_20px_40px_-15px_rgba(168,85,247,0.3)] border-fuchsia-500/30' : ''
                }`}
                onMouseEnter={() => setHoveredCard(session._id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-fuchsia-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {getSessionStatus(session.date, session.time) === 'live' && (
                  <div className="absolute top-0 right-0 bg-gradient-to-bl from-rose-500 to-orange-500 text-white px-5 py-2 rounded-bl-2xl rounded-tr-[2rem] text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                    Live
                  </div>
                )}

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center text-xl shadow-lg shadow-indigo-500/30">
                        {session.isInterviewMode ? '🎯' : '🚀'}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white truncate max-w-[180px]" title={session.title || session.inviteLink}>
                          {session.title || session.inviteLink}
                        </h2>
                        <p className="text-sm text-indigo-300 font-medium mt-0.5">
                          Creator: <span className="text-white/80">{session.creator?.name || 'Unknown'}</span>
                        </p>
                      </div>
                    </div>
                    {activeTab === 'mine' && (
                      <button
                        onClick={() => handleDelete(session._id)}
                        disabled={deletingId === session._id}
                        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition-all border border-white/5"
                      >
                        {deletingId === session._id ? '...' : '✕'}
                      </button>
                    )}
                  </div>

                  <div className="space-y-4 mb-8">
                    {session.description && (
                      <p className="text-sm text-slate-300 line-clamp-2 leading-relaxed">
                        {session.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-black/20 border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-indigo-400 text-sm">📅</div>
                        <span className="text-sm font-bold text-white">{session.date}</span>
                      </div>
                      <div className="w-px h-8 bg-white/10"></div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-fuchsia-400 text-sm">⏰</div>
                        <span className="text-sm font-bold text-white">
                          {session.duration || '30 mins'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex items-center justify-center gap-2 p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                        <span className="text-lg">🤖</span>
                        <span className="text-xs font-bold uppercase tracking-wider">{session.aiCount} BOTS</span>
                      </div>
                      <div className="flex-1 flex items-center justify-center gap-2 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        <span className="text-lg">👥</span>
                        <span className="text-xs font-bold uppercase tracking-wider">{session.humanCount} HUMANS</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Link 
                      to={`/session/${session.inviteLink}`}
                      className={`w-full py-4 rounded-2xl font-bold text-center transition-all flex items-center justify-center gap-2 ${
                        getSessionStatus(session.date, session.time) === 'upcoming' 
                        ? 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5' 
                        : 'bg-white text-black hover:bg-indigo-50 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                      }`}
                      onClick={(e) => {
                        if (getSessionStatus(session.date, session.time) === 'upcoming') {
                          e.preventDefault();
                          alert(`This session starts at ${session.time} on ${session.date}. Please wait!`);
                        }
                      }}
                    >
                      {getSessionStatus(session.date, session.time) === 'upcoming' ? 'Awaiting Launch...' : 'Enter Matrix'}
                      {getSessionStatus(session.date, session.time) !== 'upcoming' && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
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
                        className="w-full bg-white/5 border border-white/10 text-white py-4 rounded-2xl font-bold transition-all hover:bg-white/10 flex items-center justify-center gap-2 hover:border-white/20"
                      >
                        <span className="text-fuchsia-400">📄</span> Read AI Analysis
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MOM Modal */}
      {showMomModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl">
          <div className="bg-[#0f1219] rounded-[2.5rem] w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-white/10 animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-white/10 flex justify-between items-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-fuchsia-500/10 pointer-events-none"></div>
              <div className="relative z-10">
                <h3 className="text-3xl font-black text-white flex items-center gap-3">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-fuchsia-400">AI Analysis Report</span>
                </h3>
                <p className="text-sm text-indigo-300 mt-2 font-medium tracking-wide uppercase">Extracted from session data</p>
              </div>
              <button 
                onClick={() => setShowMomModal(false)}
                className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 border border-white/10 transition-all relative z-10"
              >
                ✕
              </button>
            </div>
            <div className="p-8 overflow-y-auto flex-1 bg-[#0a0c10] custom-scrollbar">
              <pre className="whitespace-pre-wrap font-sans text-[15px] leading-relaxed text-slate-300 bg-white/5 p-8 rounded-3xl border border-white/5 shadow-inner">
                {selectedMom}
              </pre>
            </div>
            <div className="p-8 border-t border-white/10 flex justify-end gap-4 bg-[#0f1219]">
              <button
                onClick={() => {
                  const blob = new Blob([selectedMom], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `AI_Analysis_Report.txt`;
                  a.click();
                }}
                className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-fuchsia-500 hover:from-indigo-400 hover:to-fuchsia-400 text-white rounded-2xl font-bold shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all hover:-translate-y-1"
              >
                Download Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
