import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';

import Sidebar from '../components/Sidebar';

function InterviewPortal() {
  const location = useLocation();
  const isQuizRoute = location.pathname.includes('quiz');
  const [activeTab, setActiveTab] = useState(isQuizRoute ? 'quiz' : 'interview'); // 'interview' or 'quiz'
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    jobRole: '',
    yearsExperience: '',
    jdText: '',
    topic: ''
  });
  const [resume, setResume] = useState(null);
  const [jd, setJd] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.name === 'resume') setResume(e.target.files[0]);
    if (e.target.name === 'jd') setJd(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (resume) data.append('resume', resume);
    if (jd) data.append('jd', jd);

    try {
      if (activeTab === 'interview') {
        const res = await api.post('/api/interviews/start', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        navigate(`/interview/${res.data.interviewId}`, { state: { firstQuestion: res.data.firstQuestion } });
      } else {
        const res = await api.post('/api/quizzes/generate', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        navigate(`/quiz/${res.data._id}`);
      }
    } catch (err) {
      console.error('Portal error:', err);
      const errorMsg = err.response?.data?.message || 'Initialization failed. Ensure all mandatory fields and resume are provided.';
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#050505] text-white font-sans selection:bg-indigo-500/30">
      <Sidebar active={activeTab === 'interview' ? 'interview' : 'quiz'} />
      
      <main className="flex-1 p-8 md:p-12 overflow-y-auto flex flex-col items-center">
        <div className="max-w-4xl w-full">
            {/* Header */}
            <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-400 to-slate-600 mb-4 uppercase">
                AI Assessment Center
            </h1>
            <p className="text-slate-400 font-medium tracking-wide">Test your skills with AI-powered interviews and quizzes.</p>
            </div>

            {/* Tabs */}
            <div className="flex p-1.5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl mb-10 w-full md:w-fit mx-auto gap-2 shadow-2xl">
                <button 
                    onClick={() => setActiveTab('interview')}
                    className={`px-8 py-3.5 rounded-xl font-bold text-sm transition-all duration-500 ${activeTab === 'interview' ? 'bg-white text-black shadow-xl shadow-white/10' : 'text-slate-400 hover:text-white'}`}
                >
                    🎯 Mock Interview
                </button>
                <button 
                    onClick={() => setActiveTab('quiz')}
                    className={`px-8 py-3.5 rounded-xl font-bold text-sm transition-all duration-500 ${activeTab === 'quiz' ? 'bg-white text-black shadow-xl shadow-white/10' : 'text-slate-400 hover:text-white'}`}
                >
                    🧪 AI Quiz
                </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8 backdrop-blur-3xl bg-white/5 border border-white/10 p-8 md:p-12 rounded-[3rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-fuchsia-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            
            <div className="space-y-6 relative z-10">
                <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Full Name</label>
                <input required name="fullName" value={formData.fullName} onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-indigo-500/50 transition-all font-medium" placeholder="John Doe" />
                </div>
                
                <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Job Role</label>
                <input required name="jobRole" value={formData.jobRole} onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-indigo-500/50 transition-all font-medium" placeholder="Senior Frontend Engineer" />
                </div>

                <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Email Address</label>
                <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-indigo-500/50 transition-all font-medium" placeholder="john@example.com" />
                </div>

                <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Years of Experience</label>
                <input required type="number" name="yearsExperience" value={formData.yearsExperience} onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-indigo-500/50 transition-all font-medium" placeholder="5" />
                </div>

                {activeTab === 'quiz' && (
                <div className="space-y-2 animate-in slide-in-from-left-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-fuchsia-400 ml-1">Assessment Topic</label>
                    <input required name="topic" value={formData.topic} onChange={handleInputChange} className="w-full bg-fuchsia-500/5 border border-fuchsia-500/20 rounded-2xl px-6 py-4 focus:outline-none focus:border-fuchsia-500/50 transition-all font-medium" placeholder="React Performance & Architecture" />
                </div>
                )}
            </div>

            <div className="space-y-6 relative z-10">
                <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Upload Resume</label>
                <div className="relative group/file">
                    <input required type="file" name="resume" accept=".pdf,.docx" onChange={handleFileChange} className="hidden" id="resume-upload" />
                    <label htmlFor="resume-upload" className="w-full flex flex-col items-center justify-center gap-2 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl py-10 cursor-pointer group-hover/file:border-indigo-500/50 group-hover/file:bg-indigo-500/5 transition-all">
                    <span className="text-3xl">{resume ? '📄' : '☁️'}</span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{resume ? resume.name : 'Select Resume File'}</span>
                    </label>
                </div>
                </div>

                <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Job Description (Optional)</label>
                <textarea name="jdText" value={formData.jdText} onChange={handleInputChange} rows="4" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-indigo-500/50 transition-all resize-none font-medium text-sm" placeholder="Paste the Job Description here..." />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-5 rounded-2xl font-black text-lg transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 ${activeTab === 'interview' ? 'bg-gradient-to-r from-indigo-600 to-blue-600 shadow-xl shadow-indigo-500/20 text-white' : 'bg-gradient-to-r from-fuchsia-600 to-rose-600 shadow-xl shadow-fuchsia-500/20 text-white'}`}
                >
                    {loading ? 'PREPARING...' : `START ${activeTab.toUpperCase()}`}
                </button>
            </div>
            </form>

            <p className="text-center mt-12 text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">
                Zero Hardcoded Logic. 100% Adaptive AI Orchestration.
            </p>
        </div>
      </main>
    </div>
  );
}

export default InterviewPortal;
