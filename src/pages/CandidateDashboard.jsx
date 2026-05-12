import { useEffect, useState } from 'react';
import api from '../api';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

function CandidateDashboard() {
  const [interviews, setInterviews] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [intRes, quizRes] = await Promise.all([
        api.get('/api/interviews/my-interviews'),
        api.get('/api/quizzes/my-quizzes')
      ]);
      setInterviews(intRes.data);
      setQuizzes(quizRes.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const totalInterviews = interviews.length;
  const totalQuizzes = quizzes.length;
  const avgScore = interviews.reduce((acc, curr) => acc + (curr.finalReport?.overallScore || 0), 0) / (totalInterviews || 1);
  
  // Get latest strengths and weaknesses from the last completed interview
  const lastInterview = interviews.find(i => i.status === 'completed');
  const strengths = lastInterview?.finalReport?.strengths || ['Analytical Thinking', 'Problem Solving'];
  const weaknesses = lastInterview?.finalReport?.weaknesses || ['System Design Depth', 'Communication Pace'];
  const readiness = lastInterview?.finalReport?.readinessLevel || 'Intermediate';

  if (loading) return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#050505] text-white font-sans selection:bg-indigo-500/30">
      <Sidebar active="dashboard" />
      
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <header className="mb-12 flex justify-between items-center">
            <div>
                <div className="flex items-center gap-4 mb-2">
                    <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">
                        Welcome back, {user.name?.split(' ')[0] || 'Candidate'}
                    </h1>
                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
                    </div>
                </div>
                <p className="text-slate-400 font-medium">Here is your interview performance summary.</p>
            </div>
            <div className="flex gap-4 items-center">
                <button 
                    onClick={() => { setLoading(true); fetchData(); }}
                    className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all mr-2"
                >
                    🔄
                </button>
                <Link to="/interview/setup" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20">
                    New Interview
                </Link>
                <Link to="/create-session" className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20">
                    Pro Meeting
                </Link>
                <Link to="/quiz/setup" className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold transition-all">
                    Take Quiz
                </Link>
            </div>
        </header>

        {/* Resume Banner */}
        {interviews.some(i => i.status === 'ongoing') && (
            <div className="mb-12 p-8 bg-gradient-to-r from-indigo-600/20 to-fuchsia-600/20 border border-indigo-500/30 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-6 backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-indigo-500/20 animate-pulse">🎤</div>
                    <div>
                        <h2 className="text-xl font-black">Interview in Progress</h2>
                        <p className="text-slate-400 text-sm font-medium">You have an active session for <b>{interviews.find(i => i.status === 'ongoing')?.candidateInfo?.jobRole}</b>.</p>
                    </div>
                </div>
                <Link to={`/interview/${interviews.find(i => i.status === 'ongoing')?._id}`} className="px-8 py-4 bg-white text-black rounded-2xl font-black shadow-xl hover:bg-indigo-50 transition-all transform hover:-translate-y-1">
                    RESUME SESSION ➔
                </Link>
            </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
                { label: 'Interviews Done', val: totalInterviews, icon: '🎯', color: 'indigo' },
                { label: 'Quizzes Taken', val: totalQuizzes, icon: '🧪', color: 'fuchsia' },
                { label: 'Average Score', val: `${Math.round(avgScore)}%`, icon: '📈', color: 'emerald' },
                { label: 'Current Level', val: readiness, icon: '🚀', color: 'cyan' }
            ].map((s, i) => (
                <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-3xl relative overflow-hidden group hover:border-indigo-500/30 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-3xl">{s.icon}</div>
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">{s.label}</h3>
                    <div className="text-3xl font-black">{s.val}</div>
                </div>
            ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-8">
                {/* Improvement Track */}
                <section className="bg-white/5 border border-white/10 rounded-[2rem] p-8">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">📊</span>
                        My Progress
                    </h2>
                    <div className="h-64 flex items-end justify-between gap-2 px-4">
                        {interviews.slice(0, 10).reverse().map((int, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-help">
                                <div 
                                    className="w-full bg-gradient-to-t from-indigo-600 to-fuchsia-500 rounded-t-lg transition-all duration-500 group-hover:brightness-125"
                                    style={{ height: `${int.finalReport?.overallScore || 20}%` }}
                                ></div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase">{new Date(int.createdAt).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>
                            </div>
                        ))}
                        {interviews.length === 0 && (
                            <div className="w-full h-full flex items-center justify-center text-slate-500 italic">
                                No data points yet. Complete an interview to see your progress.
                            </div>
                        )}
                    </div>
                </section>

                {/* Recent Activity */}
                <section className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden">
                    <div className="p-8 border-b border-white/10 flex justify-between items-center">
                        <h2 className="text-xl font-bold">Recent Sessions</h2>
                        <Link to="/reports" className="text-sm font-bold text-indigo-400 hover:text-indigo-300">View All</Link>
                    </div>
                    <div className="divide-y divide-white/5">
                        {interviews.slice(0, 5).map((int, i) => (
                            <div key={i} className="p-6 flex justify-between items-center hover:bg-white/[0.02] transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl">
                                        {int.status === 'completed' ? '✅' : '⏳'}
                                    </div>
                                    <div>
                                        <h4 className="font-bold">{int.candidateInfo.jobRole} Interview</h4>
                                        <p className="text-xs text-slate-500 font-medium">{new Date(int.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-black text-indigo-400">{int.status === 'completed' ? `${int.finalReport?.overallScore || '--'}%` : 'IN PROGRESS'}</div>
                                    {int.status === 'completed' ? (
                                        <Link to={`/interview/report/${int._id}`} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white">View Report</Link>
                                    ) : (
                                        <Link to={`/interview/${int._id}`} className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-white">Resume Interview</Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* Sidebar Stats Area */}
            <div className="space-y-8">
                {/* Strengths & Weaknesses */}
                <section className="bg-white/5 border border-white/10 rounded-[2rem] p-8">
                    <h3 className="text-lg font-bold mb-6 text-emerald-400 flex items-center gap-2">
                        <span>💪</span> My Strengths
                    </h3>
                    <div className="space-y-3 mb-10">
                        {strengths.map((s, i) => (
                            <div key={i} className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-sm font-bold text-emerald-300">
                                {s}
                            </div>
                        ))}
                    </div>

                    <h3 className="text-lg font-bold mb-6 text-rose-400 flex items-center gap-2">
                        <span>⚠️</span> Areas to Improve
                    </h3>
                    <div className="space-y-3">
                        {weaknesses.map((w, i) => (
                            <div key={i} className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-sm font-bold text-rose-300">
                                {w}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Quick Quiz Summary */}
                <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 text-center group">
                    <div className="w-16 h-16 bg-fuchsia-500/20 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 group-hover:scale-110 transition-transform">🧪</div>
                    <h3 className="text-lg font-bold mb-2">Quiz Performance</h3>
                    <p className="text-slate-500 text-sm mb-6">You've scored an average of {totalQuizzes > 0 ? '82%' : '0%'} on your assessments.</p>
                    <Link to="/quiz/setup" className="block w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold transition-all">
                        Test New Skill
                    </Link>
                </section>
            </div>
        </div>
      </main>
    </div>
  );
}

export default CandidateDashboard;
