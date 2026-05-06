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
    simulateAIResponse("Welcome to the GDVerse Interactive Demo! I am the AI Moderator. How would you like to test my capabilities today?");
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
      userText = "Generate the Minutes of Meeting (MOM).";
      aiResponse = "Generating MOM...\n\n**Executive Summary:**\nThe team reviewed the Q3 roadmap and finalized the AI integration.\n\n**Action Items:**\n- Mandvi: Deploy backend to Render.\n- Team: Review dashboard analytics.";
    } else if (action === 'interview') {
      userText = "Act as a technical interviewer.";
      aiResponse = "Absolutely. Let's begin the mock interview.\n\nCan you explain the difference between REST and GraphQL, and in what scenarios you would choose one over the other?";
    } else if (action === 'feedback') {
      userText = "Give me feedback on my performance.";
      aiResponse = "**Participant Feedback Report:**\n\n- **Clarity:** 9/10 (Excellent articulation)\n- **Confidence:** 8/10\n- **Strengths:** Strong technical depth on React.\n- **Improvement:** Try to summarize answers more concisely.";
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
    <div className="min-h-screen bg-[#050505] text-white overflow-hidden relative selection:bg-fuchsia-500/30 font-sans">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px]"></div>
        <div className="absolute top-[40%] right-[-10%] w-[50%] h-[50%] rounded-full bg-fuchsia-600/10 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[30%] h-[30%] rounded-full bg-cyan-600/10 blur-[120px]"></div>
      </div>
      
      {/* Floating Particles */}
      {[...Array(12)].map((_, i) => (
        <div 
          key={i}
          className="absolute rounded-full bg-fuchsia-500/20 shadow-[0_0_15px_rgba(217,70,239,0.5)]"
          style={{
            width: `${Math.random() * 6 + 2}px`,
            height: `${Math.random() * 6 + 2}px`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animation: `float ${Math.random() * 10 + 10}s linear infinite`,
            animationDelay: `${Math.random() * 5}s`
          }}
        />
      ))}

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10 md:py-20">
        {/* Navigation */}
        <nav className="flex justify-between items-center mb-24 bg-white/5 backdrop-blur-xl border border-white/10 px-6 py-4 rounded-3xl shadow-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-fuchsia-400">GDVerse</span>
          </div>
          <div className="flex space-x-4">
            <Link to="/login" className="px-6 py-2.5 text-sm font-bold text-slate-300 hover:text-white transition bg-white/5 hover:bg-white/10 rounded-xl border border-white/5">Login</Link>
            <Link to="/register" className="px-6 py-2.5 text-sm font-bold bg-gradient-to-r from-indigo-500 to-fuchsia-500 hover:from-indigo-400 hover:to-fuchsia-400 text-white rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all hover:scale-105">Register</Link>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="text-center max-w-5xl mx-auto mb-32">
          <div className="inline-flex items-center px-5 py-2 mb-10 bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-fuchsia-300 text-sm font-bold shadow-inner">
            <span className="w-2.5 h-2.5 bg-fuchsia-500 rounded-full mr-3 animate-pulse shadow-[0_0_10px_rgba(217,70,239,0.8)]"></span>
            GDVerse Platform Phase 3 Live
          </div>

          <h1 className="text-6xl md:text-7xl lg:text-8xl font-black mb-8 leading-tight tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-fuchsia-400">
              Professional Meetings
            </span>
            <br />
            <span className="text-white">Reimagined.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
            Experience crystal-clear audio, intelligent AI moderation, and real-time collaboration that transforms how teams work.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-6 mb-16">
            <Link 
              to="/register" 
              className="px-10 py-5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 hover:from-indigo-400 hover:to-fuchsia-400 rounded-2xl font-black text-lg shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] flex items-center justify-center text-white"
            >
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Deploy Your Instance
            </Link>
          </div>
        </div>

        {/* Feature Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
          <div className="bg-white/5 backdrop-blur-xl p-10 rounded-[2rem] border border-white/10 hover:border-indigo-500/50 transition-all duration-500 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform duration-500">
                <span className="text-2xl">🎙️</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Quantum Audio</h3>
              <p className="text-slate-400 leading-relaxed font-medium">Studio-quality voice processing with neural noise suppression ensures perfect clarity.</p>
            </div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-xl p-10 rounded-[2rem] border border-white/10 hover:border-fuchsia-500/50 transition-all duration-500 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-gradient-to-br from-fuchsia-500 to-pink-500 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-fuchsia-500/30 group-hover:scale-110 transition-transform duration-500">
                <span className="text-2xl">🧠</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">AI Moderation</h3>
              <p className="text-slate-400 leading-relaxed font-medium">Autonomous assistants guide discussions, prevent overlaps, and maintain meeting focus.</p>
            </div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-xl p-10 rounded-[2rem] border border-white/10 hover:border-cyan-500/50 transition-all duration-500 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform duration-500">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Neural Insights</h3>
              <p className="text-slate-400 leading-relaxed font-medium">Real-time analytical feedback translates raw conversations into structured intelligence.</p>
            </div>
          </div>
        </div>

        {/* Interactive Demo Section */}
        <div className="mb-32 relative z-20">
          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.15)] backdrop-blur-xl">
            <div className="p-10 md:p-14">
              <div className="text-center mb-10">
                <h2 className="text-4xl md:text-5xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-rose-400">Experience GDVerse AI</h2>
                <p className="text-slate-400 text-lg max-w-2xl mx-auto font-medium">Interact with our live simulation matrix to see how GDVerse transforms unstructured discussions into actionable intelligence.</p>
              </div>
              
              <div className="bg-[#0a0c10] rounded-3xl border border-white/10 h-[500px] flex flex-col overflow-hidden relative shadow-2xl">
                {/* Window Controls */}
                <div className="h-10 bg-white/5 border-b border-white/5 flex items-center px-4 gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                  <div className="ml-4 text-xs font-mono text-slate-500">gdverse-ai-terminal</div>
                </div>

                {!demoActive ? (
                  <div className="absolute inset-0 top-10 flex flex-col items-center justify-center bg-gradient-to-b from-transparent to-indigo-900/10 z-10">
                    <div className="relative mb-8">
                      <div className="absolute inset-0 bg-fuchsia-500/30 rounded-full blur-xl animate-pulse"></div>
                      <div className="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center relative z-10 shadow-[0_0_30px_rgba(217,70,239,0.5)]">
                        <span className="text-5xl">🤖</span>
                      </div>
                    </div>
                    <button 
                      onClick={startDemo}
                      className="px-10 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl font-bold backdrop-blur-md transition-all hover:scale-105 hover:border-fuchsia-500/50 shadow-lg"
                    >
                      Initialize AI Matrix
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar bg-gradient-to-b from-transparent to-fuchsia-900/5">
                      {demoMessages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                          <div className={`max-w-[85%] p-5 rounded-3xl shadow-lg ${msg.sender === 'user' ? 'bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white rounded-br-sm' : 'bg-white/10 backdrop-blur-md text-slate-200 border border-white/10 rounded-bl-sm'}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[10px] font-black uppercase tracking-widest text-white/50">
                                {msg.sender === 'user' ? 'GUEST USER' : 'GDVERSE OVERSEER'}
                              </span>
                            </div>
                            <pre className="whitespace-pre-wrap font-sans text-[15px] leading-relaxed">{msg.text}</pre>
                          </div>
                        </div>
                      ))}
                      {isTyping && (
                        <div className="flex justify-start">
                          <div className="bg-white/10 backdrop-blur-md border border-white/10 px-5 py-4 rounded-3xl rounded-bl-sm flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 bg-fuchsia-400 rounded-full animate-bounce shadow-[0_0_10px_rgba(217,70,239,0.8)]" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2.5 h-2.5 bg-fuchsia-400 rounded-full animate-bounce shadow-[0_0_10px_rgba(217,70,239,0.8)]" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2.5 h-2.5 bg-fuchsia-400 rounded-full animate-bounce shadow-[0_0_10px_rgba(217,70,239,0.8)]" style={{ animationDelay: '300ms' }}></span>
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                    
                    <div className="p-5 bg-[#050505]/80 backdrop-blur-xl border-t border-white/10 flex flex-wrap gap-3">
                      <button 
                        onClick={() => handleDemoAction('mom')}
                        disabled={isTyping}
                        className="flex-1 md:flex-none px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-bold text-cyan-300 rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-50"
                      >
                        📄 Generate MOM
                      </button>
                      <button 
                        onClick={() => handleDemoAction('interview')}
                        disabled={isTyping}
                        className="flex-1 md:flex-none px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-bold text-fuchsia-300 rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-50"
                      >
                        🎯 Mock Interview
                      </button>
                      <button 
                        onClick={() => handleDemoAction('feedback')}
                        disabled={isTyping}
                        className="flex-1 md:flex-none px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-bold text-amber-300 rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-50"
                      >
                        📊 Get Feedback
                      </button>
                      <button 
                        onClick={() => { setDemoActive(false); setDemoMessages([]); }}
                        className="flex-1 md:flex-none px-5 py-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-sm font-bold text-rose-400 rounded-xl transition-all md:ml-auto hover:-translate-y-0.5"
                      >
                        Reset Matrix
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center relative overflow-hidden p-16 rounded-[3rem] border border-white/10 mb-20 shadow-2xl bg-black">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-fuchsia-600/20 z-0"></div>
          <div className="relative z-10">
            <h2 className="text-5xl font-black mb-6 text-white tracking-tight">Ready to Enter the GDVerse?</h2>
            <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto font-medium">Join thousands of professionals scaling their communication with intelligent nodes.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Link 
                to="/register" 
                className="px-10 py-5 bg-white text-black hover:bg-slate-200 rounded-2xl font-black text-lg transition-all hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
              >
                Initialize Account
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black/50 border-t border-white/5 py-16 backdrop-blur-xl relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-8 md:mb-0">
              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-fuchsia-400">G</span>
              </div>
              <span className="text-lg font-bold text-white">GDVerse</span>
            </div>
            
            <p className="text-slate-500 text-sm font-medium">© {new Date().getFullYear()} GDVerse Protocol. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Floating Animation Styles */}
      <style jsx="true" global="true">{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-30px) scale(1.1); }
        }
      `}</style>
    </div>
  );
}

export default LandingPage;