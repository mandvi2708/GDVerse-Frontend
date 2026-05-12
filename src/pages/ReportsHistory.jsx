import { useEffect, useState } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

function ReportsHistory() {
  const [interviews, setInterviews] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('interviews');

  const fetchData = async () => {
    try {
      const [intRes, quizRes, meetRes] = await Promise.all([
        api.get('/api/interviews/my-interviews'),
        api.get('/api/quizzes/my-quizzes'),
        api.get('/api/sessions/my-sessions')
      ]);
      setInterviews(intRes.data);
      setQuizzes(quizRes.data);
      setMeetings(meetRes.data);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Real-time polling every 5 seconds
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#050505] text-white font-sans selection:bg-indigo-500/30">
      <Sidebar active="reports" />
      
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <header className="mb-12 flex justify-between items-end">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">
                        Reports & History
                    </h1>
                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Live Sync</span>
                    </div>
                </div>
                <p className="text-slate-400 font-medium">Track your evolution through every interaction.</p>
            </div>
            <button 
                onClick={() => { setLoading(true); fetchData(); }}
                className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
                title="Manual Refresh"
            >
                🔄
            </button>
        </header>

        {/* Tabs */}
        <div className="flex p-1.5 bg-white/5 backdrop-blur-md rounded-2xl mb-10 w-fit gap-2 border border-white/5 shadow-xl">
          {['interviews', 'meetings', 'quizzes'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 capitalize ${activeTab === tab ? 'bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden">
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Subject</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Date</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Score</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {activeTab === 'interviews' ? (
                        interviews.map((int, i) => (
                            <tr key={i} className="hover:bg-white/[0.02] transition-all group">
                                <td className="p-6 font-bold">{int.candidateInfo.jobRole} Interview</td>
                                <td className="p-6 text-slate-400 text-sm font-medium">{new Date(int.createdAt).toLocaleDateString()}</td>
                                <td className="p-6 font-black text-indigo-400">{int.finalReport?.overallScore || '--'}%</td>
                                <td className="p-6">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${int.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-indigo-500/10 text-indigo-500'}`}>
                                        {int.status}
                                    </span>
                                </td>
                                <td className="p-6">
                                    <div className="flex gap-4">
                                        <Link to={`/interview/report/${int._id}`} className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-white">View Report</Link>
                                        <Link to="/interview/setup" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white">Reattempt</Link>
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : activeTab === 'meetings' ? (
                        meetings.map((m, i) => (
                            <tr key={i} className="hover:bg-white/[0.02] transition-all group">
                                <td className="p-6 font-bold">{m.title}</td>
                                <td className="p-6 text-slate-400 text-sm font-medium">{new Date(m.createdAt).toLocaleDateString()}</td>
                                <td className="p-6 font-black text-emerald-400">{m.minutesOfMeeting ? 'MOM READY' : 'NO DATA'}</td>
                                <td className="p-6">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-500`}>
                                        Meeting
                                    </span>
                                </td>
                                <td className="p-6">
                                    <div className="flex gap-4">
                                        <Link to={`/session/${m.inviteLink}`} className="text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:text-white">View MOM</Link>
                                        <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/session/${m.inviteLink}`); alert("Link Copied!"); }} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white">Copy Link</button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        quizzes.map((q, i) => (
                            <tr key={i} className="hover:bg-white/[0.02] transition-all group">
                                <td className="p-6 font-bold">{q.topic} Assessment</td>
                                <td className="p-6 text-slate-400 text-sm font-medium">{new Date(q.createdAt).toLocaleDateString()}</td>
                                <td className="p-6 font-black text-fuchsia-400">{q.results?.length > 0 ? `${q.results[0].accuracy}%` : '--'}</td>
                                <td className="p-6">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500`}>
                                        Completed
                                    </span>
                                </td>
                                <td className="p-6">
                                    <div className="flex gap-4">
                                        <Link to={`/quiz/report/${q._id}`} className="text-[10px] font-black uppercase tracking-widest text-fuchsia-400 hover:text-white">Scorecard</Link>
                                        <Link to="/quiz/setup" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white">Reattempt</Link>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
            {((activeTab === 'interviews' && interviews.length === 0) || (activeTab === 'quizzes' && quizzes.length === 0) || (activeTab === 'meetings' && meetings.length === 0)) && (
                <div className="p-24 text-center">
                    <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-6">📂</div>
                    <h3 className="text-xl font-bold mb-2">No history found</h3>
                    <p className="text-slate-500 mb-8 max-w-xs mx-auto">Your assessments and reports will appear here automatically after each session.</p>
                    <Link 
                        to={activeTab === 'interviews' ? "/interview/setup" : activeTab === 'meetings' ? "/create-session" : "/quiz/setup"} 
                        className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold transition-all inline-block"
                    >
                        {activeTab === 'interviews' ? "Start First Interview" : activeTab === 'meetings' ? "Create First Meeting" : "Take First Quiz"}
                    </Link>
                </div>
            )}
        </div>
      </main>
    </div>
  );
}

export default ReportsHistory;
