import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

function QuizPlay() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(45); // 45 seconds per question
  const [totalTime, setTotalTime] = useState(0);
  const timerRef = useRef();

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await api.get(`/api/quizzes/${id}`);
        setQuiz(res.data);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [id]);

  useEffect(() => {
    if (loading || isAnswered || !quiz) return;
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleNext(true); // Auto-next on timeout
          return 45;
        }
        return prev - 1;
      });
      setTotalTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentIdx, isAnswered, loading]);

  const handleOptionSelect = (idx) => {
    if (isAnswered) return;
    clearInterval(timerRef.current);
    setSelectedOption(idx);
    setIsAnswered(true);
    if (idx === quiz.questions[currentIdx].correctAnswer) {
      setScore(s => s + 1);
    }
  };

  const handleNext = async (isTimeout = false) => {
    if (currentIdx + 1 < quiz.questions.length) {
      setCurrentIdx(currentIdx + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setTimeLeft(45);
    } else {
      setLoading(true);
      const accuracy = (score / quiz.questions.length) * 100;
      const averageSpeed = totalTime / quiz.questions.length;
      
      try {
        const res = await api.post('/api/quizzes/submit', {
          quizId: id,
          score,
          totalQuestions: quiz.questions.length,
          accuracy,
          averageSpeed,
          topicBreakdown: {} 
        });
        navigate(`/quiz/report/${id}`, { state: { result: res.data.result } });
      } catch (err) {
        console.error('Submit error:', err);
        navigate('/dashboard');
      }
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-8">
      <div className="w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6 shadow-[0_0_40px_rgba(99,102,241,0.3)]"></div>
      <p className="font-black tracking-[0.4em] uppercase text-xs animate-pulse text-indigo-400">Synchronizing Neural Assessment</p>
    </div>
  );

  const q = quiz.questions[currentIdx];

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans p-4 md:p-10 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-indigo-500/20 to-transparent blur-[100px]"></div>
      </div>

      {/* Header */}
      <header className="max-w-5xl mx-auto w-full flex justify-between items-center mb-12 relative z-10">
        <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl shadow-2xl">🧪</div>
            <div>
                <h1 className="text-2xl font-black tracking-tighter uppercase">{quiz.topic} Assessment</h1>
                <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Question {currentIdx + 1} of {quiz.questions.length}</span>
                </div>
            </div>
        </div>
        <div className="flex items-center gap-6">
            <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all duration-500 ${timeLeft < 10 ? 'border-rose-500 text-rose-500 animate-pulse' : 'border-white/10 text-white'}`}>
                <span className="text-2xl font-black">{timeLeft}s</span>
            </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto w-full flex-1 flex flex-col relative z-10">
        <div className="bg-white/5 backdrop-blur-3xl border border-white/10 p-10 md:p-16 rounded-[3.5rem] shadow-2xl flex-1 flex flex-col">
            <div className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                    <span className="px-4 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-indigo-400">{q.type}</span>
                    <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${q.difficulty === 'Hard' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>{q.difficulty} Level</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold leading-tight tracking-tight text-white/90">
                    {q.question}
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {q.options.map((opt, i) => {
                    let style = "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-indigo-500/30";
                    if (isAnswered) {
                        if (i === q.correctAnswer) style = "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 scale-[1.02] shadow-xl shadow-emerald-500/10";
                        else if (i === selectedOption) style = "bg-rose-500/20 border-rose-500/50 text-rose-400 scale-[0.98] opacity-70";
                        else style = "bg-white/5 border-white/5 text-slate-600 opacity-40";
                    }

                    return (
                        <button
                            key={i}
                            onClick={() => handleOptionSelect(i)}
                            disabled={isAnswered}
                            className={`p-8 rounded-[2rem] border transition-all duration-300 flex items-center justify-between group ${style}`}
                        >
                            <span className="font-bold text-lg">{opt}</span>
                            <div className={`w-8 h-8 rounded-full border border-white/10 flex items-center justify-center transition-all ${isAnswered && i === q.correctAnswer ? 'bg-emerald-500 border-emerald-500' : ''}`}>
                                {isAnswered && i === q.correctAnswer && <span className="text-white">✓</span>}
                            </div>
                        </button>
                    );
                })}
            </div>

            {isAnswered && (
                <div className="mt-auto animate-in slide-in-from-bottom-8 duration-700">
                    <div className="bg-indigo-500/5 border border-indigo-500/20 p-8 rounded-[2.5rem] mb-10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl">💡</div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-3">AI Deep Explanation</h4>
                        <p className="text-slate-300 font-medium leading-relaxed italic">
                            "{q.explanation}"
                        </p>
                    </div>
                    <button 
                        onClick={() => handleNext()} 
                        className="w-full py-6 bg-white text-black rounded-3xl font-black text-xl hover:bg-indigo-50 transition-all shadow-2xl transform active:scale-[0.98]"
                    >
                        {currentIdx + 1 === quiz.questions.length ? 'COMPLETE ASSESSMENT' : 'NEXT CHALLENGE'}
                    </button>
                </div>
            )}
        </div>
        
        {/* Progress Timeline */}
        <div className="flex gap-2 mt-10 px-4">
            {quiz.questions.map((_, i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i === currentIdx ? 'bg-indigo-500 scale-y-150' : (i < currentIdx ? 'bg-indigo-500/40' : 'bg-white/5')}`}></div>
            ))}
        </div>
      </main>

      <footer className="mt-12 text-center text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">
        Advanced Assessment Protocol V2.1 // No Duplication // Anti-Cheat Matrix Active
      </footer>
    </div>
  );
}

export default QuizPlay;
