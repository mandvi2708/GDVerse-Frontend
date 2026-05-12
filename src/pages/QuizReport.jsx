import { useLocation, useNavigate } from 'react-router-dom';

function QuizReport() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const report = state?.result;

  if (!report) return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-8">
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No result data available.</p>
        <button onClick={() => navigate('/dashboard')} className="mt-6 px-8 py-3 bg-white text-black rounded-xl font-bold">Return to Dashboard</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-16 flex flex-col items-center">
      <div className="max-w-4xl w-full">
        <header className="text-center mb-16">
            <div className="inline-block px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-6">Assessment Artifact Generated</div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 italic uppercase">Assessment Scorecard</h1>
            <p className="text-slate-400 font-medium">Detailed breakdown of technical proficiency and skill gaps.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] text-center group transition-all hover:border-indigo-500/30">
                <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Total Score</div>
                <div className="text-6xl font-black text-white mb-2">{report.score}<span className="text-slate-600">/</span>{report.totalQuestions}</div>
                <div className="text-xs font-bold text-indigo-400 uppercase tracking-tighter">{report.accuracy}% Accuracy</div>
            </div>

            <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] text-center flex flex-col justify-center items-center">
                <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Readiness Level</div>
                <div className={`text-2xl font-black uppercase tracking-tight ${report.readinessLevel === 'Strong Hire Potential' ? 'text-emerald-400' : 'text-indigo-400'}`}>
                    {report.readinessLevel}
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] text-center flex flex-col justify-center items-center">
                <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Average Velocity</div>
                <div className="text-3xl font-black text-white">{Math.round(report.averageSpeed)}s</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Per Question</div>
            </div>
        </div>

        {/* Skill Gap Analysis Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-8">
                <h2 className="text-2xl font-black flex items-center gap-4">
                    <span className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20">🔍</span>
                    Skill Gap Analysis
                </h2>
                <div className="bg-white/5 border border-white/10 p-10 rounded-[3rem] space-y-6">
                    {report.gapAnalysis?.topGaps?.map((gap, i) => (
                        <div key={i} className="flex items-center gap-4 group">
                            <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"></div>
                            <span className="text-lg font-bold text-slate-200 group-hover:text-white transition-all uppercase tracking-tighter">{gap}</span>
                        </div>
                    ))}
                    {(!report.gapAnalysis?.topGaps || report.gapAnalysis.topGaps.length === 0) && (
                        <p className="text-emerald-400 font-bold uppercase tracking-widest text-xs">No significant gaps detected. Exceptional performance.</p>
                    )}
                </div>
            </div>

            <div className="space-y-8">
                <h2 className="text-2xl font-black flex items-center gap-4">
                    <span className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20">💡</span>
                    Learning Path
                </h2>
                <div className="bg-white/5 border border-white/10 p-10 rounded-[3rem] space-y-4">
                    {report.gapAnalysis?.recommendations?.map((rec, i) => (
                        <div key={i} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex gap-4 items-start">
                            <span className="text-indigo-400">➔</span>
                            <p className="text-sm font-medium text-slate-300 leading-relaxed">{rec}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        <div className="mt-16 bg-white/5 border border-white/10 p-10 rounded-[3rem] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10 text-4xl italic font-black">AI SUMMARY</div>
            <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4">Strategic Assessment Summary</h3>
            <p className="text-xl font-bold text-slate-200 leading-relaxed italic">
                "{report.gapAnalysis?.readinessSummary || 'Strategic overview pending deep analysis.'}"
            </p>
        </div>

        <div className="flex gap-6 mt-16">
            <button onClick={() => window.print()} className="flex-1 py-5 bg-white/5 border border-white/10 text-white rounded-3xl font-black text-sm uppercase tracking-[0.2em] hover:bg-white/10 transition-all">Download Report</button>
            <button onClick={() => navigate('/dashboard')} className="flex-1 py-5 bg-white text-black rounded-3xl font-black text-sm uppercase tracking-[0.2em] hover:bg-indigo-50 transition-all">Hub Command</button>
        </div>
      </div>
    </div>
  );
}

export default QuizReport;
