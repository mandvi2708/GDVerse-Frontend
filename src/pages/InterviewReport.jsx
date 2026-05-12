import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

function InterviewReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await api.get(`/api/interviews/report/${id}`);
        setReport(res.data);
      } catch (err) {
        console.error('Failed to fetch report:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-8">
      <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="font-bold tracking-widest uppercase text-sm animate-pulse">Generating Matrix Analytics...</p>
    </div>
  );

  if (!report) return <div className="text-white">Report not found.</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-rose-400">
              Interview Insights
            </h1>
            <p className="text-slate-400 mt-2 font-medium">Final performance evaluation and technical breakdown.</p>
          </div>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Score Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="col-span-1 md:col-span-2 bg-white/5 border border-white/10 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center gap-10 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full"></div>
            <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                    <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-white/5" />
                    <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" 
                        strokeDasharray={552.9} 
                        strokeDashoffset={552.9 - (552.9 * report.overallScore) / 100} 
                        className="text-indigo-500 transition-all duration-1000 ease-out" 
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-6xl font-black">{report.overallScore}</span>
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Score</span>
                </div>
            </div>
            <div className="flex-1 space-y-4 text-center md:text-left">
                <h3 className="text-2xl font-black uppercase tracking-tight">Executive Summary</h3>
                <p className="text-slate-300 leading-relaxed font-medium">
                    {report.aiSummary}
                </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-fuchsia-600 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center shadow-2xl shadow-indigo-500/20">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-4">Hiring Status</h3>
            <div className="text-5xl mb-6">
                {report.overallScore >= 80 ? '🔥' : (report.overallScore >= 60 ? '⚡' : '📚')}
            </div>
            <div className="text-2xl font-black mb-2">
                {report.overallScore >= 80 ? 'STRONG MATCH' : (report.overallScore >= 60 ? 'POTENTIAL MATCH' : 'NEEDS TRAINING')}
            </div>
            <p className="text-sm font-bold opacity-80">Based on technical and behavioral alignment</p>
          </div>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
            {Object.entries(report.categoryScores).map(([key, val]) => (
                <div key={key} className="bg-white/5 border border-white/10 p-6 rounded-3xl text-center group hover:border-indigo-500/30 transition-all">
                    <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">{key}</div>
                    <div className="text-3xl font-black text-indigo-400 group-hover:scale-110 transition-transform">{val}%</div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full mt-4 overflow-hidden">
                        <div className="bg-indigo-500 h-full transition-all duration-1000" style={{ width: `${val}%` }}></div>
                    </div>
                </div>
            ))}
        </div>

        {/* Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <h3 className="text-2xl font-black flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl">✓</span>
                Key Strengths
            </h3>
            <div className="space-y-4">
                {report.strengths.map((s, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 p-5 rounded-2xl font-medium border-l-4 border-l-emerald-500">
                        {s}
                    </div>
                ))}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-2xl font-black flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center text-xl">△</span>
                Improvement Areas
            </h3>
            <div className="space-y-4">
                {report.weaknesses.map((w, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 p-5 rounded-2xl font-medium border-l-4 border-l-rose-500">
                        {w}
                    </div>
                ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-20 p-12 bg-white/5 border border-white/10 rounded-[3rem] text-center">
            <h3 className="text-2xl font-black mb-4">Recommended Learning Path</h3>
            <div className="flex flex-wrap justify-center gap-3 mb-8">
                {report.improvementSuggestions.map((s, i) => (
                    <span key={i} className="px-5 py-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 font-bold text-sm">
                        {s}
                    </span>
                ))}
            </div>
            <button 
                onClick={() => window.print()}
                className="px-12 py-5 bg-white text-black rounded-2xl font-black hover:bg-indigo-50 transition-all flex items-center justify-center gap-3 mx-auto shadow-xl"
            >
                📥 DOWNLOAD FULL PDF REPORT
            </button>
        </div>
      </div>
    </div>
  );
}

export default InterviewReport;
