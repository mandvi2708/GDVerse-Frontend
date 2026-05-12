import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

function LandingPage() {
  const [demoActive, setDemoActive] = useState(false);
  const [demoMessages, setDemoMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const startDemo = () => {
    setDemoActive(true);
    setDemoMessages([]);
    simulateAIResponse("AI Assistant Online. I can help you practice interviews, generate meeting summaries, or provide detailed performance feedback. What would you like to do today?");
  };

  const simulateAIResponse = (text) => {
    setIsTyping(true);
    setTimeout(() => {
      setDemoMessages(prev => [...prev, { sender: 'ai', text }]);
      setIsTyping(false);
    }, 1500);
  };

  const handleDemoAction = (action) => {
    let userText = "";
    let aiResponse = "";
    
    if (action === 'mom') {
      userText = "Generate meeting summary.";
      aiResponse = "**Meeting Summary Generated**\n\n- **Summary:** Discussed project scalability.\n- **Decisions:** Move to Microservices.\n- **Actions:** @Mandvi to finalize API specs.";
    } else if (action === 'interview') {
      userText = "Start Technical Mock.";
      aiResponse = "Objective: Technical Proficiency Test.\n\nQuestion: How does the virtual DOM improve React performance, and are there cases where it might add overhead?";
    } else if (action === 'feedback') {
      userText = "Analyze my output.";
      aiResponse = "**Performance Feedback:**\n\n- Clarity: 92%\n- Technical Depth: 85%\n- Suggestion: Elaborate on edge-case handling.";
    }

    setDemoMessages(prev => [...prev, { sender: 'user', text: userText }]);
    simulateAIResponse(aiResponse);
  };

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [demoMessages, isTyping]);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 overflow-hidden relative selection:bg-indigo-500/30 font-sans">
      {/* Dynamic Background Mesh */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-600/20 blur-[160px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-fuchsia-600/15 blur-[160px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[30%] left-[40%] w-[40%] h-[40%] rounded-full bg-cyan-600/10 blur-[140px] animate-pulse" style={{ animationDelay: '4s' }}></div>
        
        {/* Grid Overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
        <div className="absolute inset-0 border-t border-white/[0.03]" style={{ backgroundSize: '40px 40px', backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px)' }}></div>
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 md:py-12">
        {/* Navigation */}
        <nav className="flex justify-between items-center mb-24 sticky top-6 z-[100] bg-slate-900/40 backdrop-blur-2xl border border-white/10 px-8 py-5 rounded-[2.5rem] shadow-2xl">
          <div className="flex items-center space-x-4 group cursor-pointer">
            <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 via-purple-500 to-fuchsia-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/40 transition-transform group-hover:rotate-12">
               <span className="text-2xl">⚡</span>
            </div>
            <span className="text-2xl font-black tracking-tighter text-white">GDVerse</span>
          </div>
          <div className="flex items-center space-x-8">
            <Link to="/contact" className="hidden md:block text-sm font-bold text-slate-400 hover:text-indigo-400 transition-colors uppercase tracking-widest">Contact</Link>
            <Link to="/login" className="px-7 py-3 text-sm font-black text-slate-200 hover:text-white transition-all bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10">Sign In</Link>
            <Link to="/register" className="px-7 py-3 text-sm font-black bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-[0_0_30px_rgba(79,70,229,0.4)] transition-all hover:scale-105 active:scale-95">Sign Up</Link>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="text-center max-w-6xl mx-auto mb-40 pt-10">
          <div className="inline-flex items-center px-6 py-2.5 mb-12 bg-indigo-500/10 backdrop-blur-xl border border-indigo-500/20 rounded-full text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl animate-in fade-in slide-in-from-top-4 duration-1000">
            <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3 animate-ping"></span>
            AI Interview Platform Online
          </div>

          <h1 className="text-6xl md:text-8xl lg:text-[9rem] font-black mb-10 leading-[0.9] tracking-tighter animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <span className="text-white">EVOLVE YOUR</span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-fuchsia-400">CAREER.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-400 mb-16 max-w-3xl mx-auto leading-relaxed font-medium animate-in fade-in duration-1000 delay-300">
            The next generation of AI-driven interview intelligence. Simple, powerful, and built for your success.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
            <Link 
              to="/register" 
              className="group relative px-12 py-6 bg-white text-black rounded-3xl font-black text-xl transition-all duration-500 hover:scale-105 hover:shadow-[0_0_50px_rgba(255,255,255,0.2)] overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-3">
                START FREE NOW
                <span className="text-2xl group-hover:translate-x-2 transition-transform">→</span>
              </span>
            </Link>
            <button 
              onClick={startDemo}
              className="px-12 py-6 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl font-black text-xl text-white transition-all hover:bg-white/10"
            >
              SEE IT IN ACTION
            </button>
          </div>
        </div>

        {/* Feature Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-40">
          {[
            { icon: "🎙️", title: "Voice AI", desc: "Hyper-realistic conversational AI with zero-latency speech recognition.", color: "indigo" },
            { icon: "🛰️", title: "Smart Analysis", desc: "AI analysis of your career history to generate custom technical questions.", color: "fuchsia" },
            { icon: "📈", title: "Performance Reports", desc: "Detailed behavioral and technical feedback visualized in high-fidelity reports.", color: "cyan" }
          ].map((f, i) => (
            <div key={i} className="group p-1 bg-gradient-to-b from-white/10 to-transparent rounded-[3rem] transition-all hover:scale-[1.02] duration-500">
              <div className="h-full bg-slate-900/60 backdrop-blur-3xl p-10 rounded-[2.9rem] border border-white/5 relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-32 h-32 bg-${f.color}-500/10 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                <div className="text-5xl mb-8 group-hover:scale-110 transition-transform duration-500">{f.icon}</div>
                <h3 className="text-2xl font-black mb-4 text-white uppercase tracking-tight">{f.title}</h3>
                <p className="text-slate-400 leading-relaxed font-medium">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Interactive Matrix Demo */}
        <div className={`mb-40 transition-all duration-1000 ${demoActive ? 'scale-100 opacity-100' : 'scale-95 opacity-50'}`}>
          <div className="bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent p-1 rounded-[3.5rem]">
            <div className="bg-[#020617] border border-white/10 rounded-[3.4rem] overflow-hidden shadow-2xl">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="p-10 md:p-16 border-r border-white/5">
                  <h2 className="text-4xl md:text-5xl font-black mb-8 text-white tracking-tighter italic">AI DEMO <span className="text-indigo-500">CENTER</span></h2>
                  <p className="text-slate-400 text-lg mb-10 font-medium">Experience our AI engine in real-time. Select a feature to see how we process your meeting data.</p>
                  
                  <div className="flex flex-col gap-4">
                    {[
                      { id: 'interview', label: 'Try Mock Interview', icon: '🎯' },
                      { id: 'mom', label: 'Generate Summary', icon: '📄' },
                      { id: 'feedback', label: 'Get AI Feedback', icon: '📊' }
                    ].map(btn => (
                      <button 
                        key={btn.id}
                        onClick={() => handleDemoAction(btn.id)}
                        disabled={!demoActive || isTyping}
                        className="group flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-3xl transition-all hover:bg-white/10 hover:border-indigo-500/50 disabled:opacity-30"
                      >
                        <span className="flex items-center gap-4 text-sm font-black uppercase tracking-widest text-slate-200">
                          <span className="text-2xl">{btn.icon}</span> {btn.label}
                        </span>
                        <span className="text-xl opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-black/40 backdrop-blur-3xl flex flex-col h-[600px] relative">
                   {!demoActive ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center bg-black/60">
                         <div className="w-24 h-24 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin mb-8"></div>
                         <h3 className="text-xl font-black text-white mb-4 uppercase tracking-widest">AI System Ready</h3>
                         <button onClick={startDemo} className="px-8 py-4 bg-indigo-600 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/40">Start Demo</button>
                      </div>
                   ) : (
                      <>
                        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar font-mono text-sm">
                           {demoMessages.map((msg, i) => (
                             <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-6 rounded-2xl ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-800 text-indigo-300 border border-indigo-500/30 rounded-bl-none'}`}>
                                   <div className="text-[10px] font-black opacity-50 mb-2 uppercase tracking-widest">{msg.sender === 'user' ? 'YOU' : 'AI ASSISTANT'}</div>
                                   <pre className="whitespace-pre-wrap font-mono leading-relaxed text-sm">{msg.text}</pre>
                                </div>
                             </div>
                           ))}
                           {isTyping && (
                             <div className="flex justify-start">
                               <div className="bg-slate-800 border border-indigo-500/30 p-6 rounded-2xl rounded-bl-none">
                                  <div className="flex gap-2">
                                     <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                                     <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-150"></div>
                                     <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-300"></div>
                                  </div>
                               </div>
                             </div>
                           )}
                           <div ref={chatEndRef} />
                        </div>
                        <div className="p-4 bg-slate-900/80 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">System Version: 4.1.0-STABLE</span>
                            <button onClick={() => setDemoActive(false)} className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline">Close Demo</button>
                        </div>
                      </>
                   )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Global CTA */}
        <div className="text-center p-20 rounded-[4rem] bg-indigo-600 relative overflow-hidden group shadow-[0_0_100px_rgba(79,70,229,0.3)]">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 via-indigo-600 to-purple-800 opacity-90 group-hover:scale-110 transition-transform duration-700"></div>
          <div className="relative z-10">
            <h2 className="text-5xl md:text-7xl font-black mb-8 text-white tracking-tighter leading-tight italic">READY TO<br />START?</h2>
            <p className="text-xl text-indigo-100 mb-12 max-w-2xl mx-auto font-medium">Ready to see how you rank against other professionals? Create your account now.</p>
            <Link 
              to="/register" 
              className="px-14 py-6 bg-white text-black hover:bg-slate-100 rounded-3xl font-black text-xl transition-all shadow-2xl hover:scale-105 inline-block"
            >
              GET STARTED
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5 bg-black/40 backdrop-blur-3xl relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center space-x-4">
             <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black">G</div>
             <span className="text-xl font-black tracking-tighter text-white uppercase">GDVerse</span>
          </div>
          <div className="flex gap-10 text-slate-500 text-[10px] font-black uppercase tracking-widest">
             <span className="hover:text-white cursor-pointer transition-colors">Terms</span>
             <span className="hover:text-white cursor-pointer transition-colors">Privacy</span>
             <span className="hover:text-white cursor-pointer transition-colors">Security</span>
          </div>
          <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">© {new Date().getFullYear()} GDVerse AI.</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;