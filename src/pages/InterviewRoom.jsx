import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import api from '../api';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

function InterviewRoom() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { role: 'ai', content: state?.firstQuestion || "Hello! I'm your AI interviewer. Let's get started." }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [stage, setStage] = useState('Introduction');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isThinking, setIsThinking] = useState(false);
  const [showStartSpeaking, setShowStartSpeaking] = useState(false);
  const scrollRef = useRef();
  const socketRef = useRef();
  const videoRef = useRef();
  const [localStream, setLocalStream] = useState(null);

  // Initialize Camera for Real-time Experience
  useEffect(() => {
    let stream;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setLocalStream(stream);
      } catch (err) {
        console.warn("Interview Camera failed:", err);
      }
    };
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Update video source whenever localStream is set
  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const endInterviewManually = async () => {
    if (!window.confirm("Are you sure you want to end this interview? It will be marked as cancelled.")) return;
    try {
        // Mark as cancelled/completed so 'Resume' doesn't show
        await api.post(`/api/interviews/submit-answer`, {
            interviewId: id,
            answer: "[USER ENDED SESSION MANUALLY]",
            forceComplete: true
        });
        navigate('/dashboard');
    } catch (err) {
        console.error("Failed to end interview:", err);
        navigate('/dashboard');
    }
  };

  // Speech Recognition
  const recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const sr = recognition ? new recognition() : null;
  if (sr) {
    sr.continuous = true;
    sr.interimResults = true;
  }

  const startThinkTimer = () => {
    setIsThinking(true);
    setShowStartSpeaking(false);
    setTimeLeft(10);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsThinking(false);
          setShowStartSpeaking(true);
          // Hide the "Start Speaking" text after 3 seconds
          setTimeout(() => setShowStartSpeaking(false), 3000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const speak = (text) => {
    if (!isVoiceMode) {
        startThinkTimer();
        return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1;
    utterance.onend = () => {
        startThinkTimer();
    };
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (stage !== 'Conclusion') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [stage]);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL);
    socketRef.current.emit('start_interview', { interviewId: id });
    
    const initializeInterview = async () => {
        if (!state?.firstQuestion) {
            try {
                const res = await api.get(`/api/interviews/${id}`);
                if (res.data.conversation && res.data.conversation.length > 0) {
                    setMessages(res.data.conversation);
                    setStage(res.data.stage);
                    // If the last message was from AI, don't speak it again unless it's new
                    // But for resumption, we just show history.
                } else {
                    // Fallback if no conversation exists yet
                    speak("Hello! I'm your AI interviewer. Let's get started.");
                    startThinkTimer();
                }
            } catch (err) {
                console.error("Failed to resume interview:", err);
            }
        } else {
            // New interview from setup
            speak(state.firstQuestion);
            startThinkTimer();
        }
    };

    initializeInterview();

    return () => socketRef.current.disconnect();
  }, [id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || isTyping || isThinking) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'candidate', content: userMessage }]);
    setIsTyping(true);

    try {
      const res = await api.post('/api/interviews/submit-answer', {
        interviewId: id,
        answer: userMessage
      });

      setMessages(prev => [...prev, { role: 'ai', content: res.data.aiResponse }]);
      setStage(res.data.stage);
      speak(res.data.aiResponse);

      if (res.data.isCompleted) {
        setTimeout(() => navigate(`/interview/report/${id}`), 4000);
      }
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleRecording = () => {
    if (!sr) return alert("System incompatibility: Web Speech API missing.");
    
    if (isRecording) {
      sr.stop();
      setIsRecording(false);
      handleSend();
    } else {
      sr.start();
      setIsRecording(true);
      sr.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        setInput(transcript);
      };
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col md:flex-row overflow-hidden font-sans">
      {/* Sidebar - Timeline & Stage */}
      <aside className="w-full md:w-80 border-r border-white/10 bg-[#0a0a0a] p-8 flex flex-col gap-10">
        <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-2xl shadow-lg shadow-indigo-500/20">🤖</div>
            <div>
                <h2 className="font-black tracking-tight text-lg">AI PANEL</h2>
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em]">Live Connection</p>
            </div>
        </div>

        {/* Real-time Candidate Camera */}
        <div className="relative aspect-video rounded-3xl overflow-hidden bg-white/5 border border-white/10 shadow-2xl group">
            {localStream ? (
                <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover scale-x-[-1]" 
                />
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                    <span className="text-2xl animate-pulse">📷</span>
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Camera Required</span>
                </div>
            )}
            <div className="absolute top-3 right-3 flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
            </div>
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                <span className="text-[8px] font-black uppercase tracking-widest">Candidate Preview</span>
            </div>
        </div>

        <div className="space-y-6">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Interview Timeline</h3>
            <div className="space-y-4">
                {['Introduction', 'Technical', 'Behavioral', 'Conclusion'].map((s, i) => (
                    <div key={i} className={`flex items-center gap-4 transition-all duration-500 ${stage === s ? 'opacity-100 translate-x-2' : 'opacity-30'}`}>
                        <div className={`w-2 h-10 rounded-full ${stage === s ? 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-white/10'}`}></div>
                        <span className={`font-bold text-sm ${stage === s ? 'text-white' : 'text-slate-400'}`}>{s}</span>
                    </div>
                ))}
            </div>
        </div>

        <div className="mt-auto p-6 rounded-3xl bg-white/5 border border-white/10">
            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">AI Engine Status</h4>
            <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-xs font-bold">Gemini 1.5 Pro Active</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">Monitoring technical depth, sentiment, and communication clarity.</p>
        </div>
      </aside>

      {/* Main Experience */}
      <div className="flex-1 flex flex-col relative bg-[radial-gradient(circle_at_50%_-20%,#1a1a1a_0%,#050505_100%)]">
        {/* Top Control Bar */}
        <div className="p-6 flex justify-between items-center backdrop-blur-md bg-black/20 border-b border-white/5">
            <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">Session Active</span>
                <span className="text-xs font-bold text-slate-500 tracking-tighter">ID: {id.substring(0,8)}...</span>
            </div>
            <div className="flex items-center gap-4">
                <button onClick={endInterviewManually} className="px-6 py-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 font-black text-[10px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-lg shadow-rose-500/5">End Interview</button>
            </div>
        </div>

        {/* Conversation Feed */}
        <main className="flex-1 overflow-y-auto p-6 md:p-12 space-y-10 custom-scrollbar">
            {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'ai' ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-6 duration-700`}>
                    <div className={`max-w-[85%] md:max-w-[75%] p-8 rounded-[2.5rem] ${
                        m.role === 'ai' 
                        ? 'bg-white/5 border border-white/10 rounded-tl-none shadow-2xl backdrop-blur-md' 
                        : 'bg-white text-black rounded-tr-none font-bold shadow-2xl shadow-white/5'
                    }`}>
                        {m.role === 'ai' && (
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-sm shadow-lg shadow-indigo-500/20">🤖</div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Senior Technical Interviewer</span>
                            </div>
                        )}
                        <p className={`text-base md:text-lg leading-relaxed ${m.role === 'ai' ? 'text-slate-200 font-medium' : 'text-black'}`}>
                            {m.content}
                        </p>
                    </div>
                </div>
            ))}
            {isTyping && (
                <div className="flex justify-start">
                    <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] rounded-tl-none flex gap-2 items-center">
                        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"></div>
                        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce delay-150"></div>
                        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce delay-300"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4 animate-pulse">Analyzing Performance...</span>
                    </div>
                </div>
            )}
            <div ref={scrollRef} />
        </main>

        {/* AI Speaking Waveform (Fixed Bottom) */}
        {isTyping && (
            <div className="h-20 flex items-center justify-center gap-1 mb-4">
                {[...Array(20)].map((_, i) => (
                    <div key={i} className="w-1 bg-indigo-500/40 rounded-full animate-wave" style={{ height: `${Math.random() * 40 + 10}px`, animationDelay: `${i * 0.05}s` }}></div>
                ))}
            </div>
        )}

        {/* Input Matrix */}
        <footer className="p-8 md:p-12 border-t border-white/10 bg-black/60 backdrop-blur-3xl">
            <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-6">
                <div className="flex-1 relative group">
                    {isThinking && (
                        <div className="absolute -top-12 left-0 right-0 flex justify-center animate-bounce">
                            <div className="bg-indigo-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2 border border-white/20">
                                🧠 Thinking Time: {timeLeft}s
                            </div>
                        </div>
                    )}
                    {showStartSpeaking && (
                        <div className="absolute -top-12 left-0 right-0 flex justify-center animate-pulse">
                            <div className="bg-emerald-600 px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2 border border-white/20">
                                🎤 Start Speaking Now
                            </div>
                        </div>
                    )}
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isThinking}
                        placeholder={isThinking ? "Synthesizing thoughts..." : "Articulate your response..."}
                        className={`w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-5 pr-20 focus:outline-none focus:border-indigo-500/50 transition-all resize-none h-20 md:h-24 font-bold text-lg text-white selection:bg-indigo-500/30 ${isThinking ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                    />
                    <button
                        type="button"
                        onClick={toggleRecording}
                        disabled={isThinking}
                        className={`absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-rose-500 shadow-lg shadow-rose-500/40 animate-pulse' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'} ${isThinking ? 'opacity-30 cursor-not-allowed' : ''}`}
                    >
                        {isRecording ? '⏹' : '🎤'}
                    </button>
                </div>
                <button
                    type="submit"
                    disabled={!input.trim() || isTyping || isThinking}
                    className="w-20 h-20 md:w-24 md:h-24 bg-white text-black rounded-3xl flex items-center justify-center text-3xl shadow-2xl hover:bg-indigo-50 transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-30 disabled:grayscale"
                >
                    {isThinking ? '⏳' : '➔'}
                </button>
            </form>
            <div className="flex justify-center gap-10 mt-8">
                <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-slate-500 font-bold">ENTER</kbd>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">To Dispatch</span>
                </div>
                <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-slate-500 font-bold">SHIFT + ENTER</kbd>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">For New Line</span>
                </div>
            </div>
        </footer>
      </div>
    </div>
  );
}

export default InterviewRoom;
