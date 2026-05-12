import { useEffect, useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

function CreateSession() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: '30 mins',
    date: '',
    time: '',
    humanCount: 2,
  });

  const [inviteLink, setInviteLink] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
      navigate('/login');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e, isImmediate = false) => {
    if (e) e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      alert("Please provide both a discussion title and a description.");
      return;
    }
    
    let payloadDate = formData.date;
    let payloadTime = formData.time;

    if (isImmediate) {
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      payloadDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      payloadTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    }

    if (!isImmediate && (!payloadDate || !payloadTime)) {
      alert("Please select both a date and time for your meeting.");
      return;
    }

    setIsCreating(true);

    try {
      const payload = {
        ...formData,
        date: payloadDate,
        time: payloadTime,
        aiCount: 0,
        isImmediate
      };
      const res = await api.post('/api/sessions/create', payload);
      setInviteLink(res.data.inviteLink);
      setShowSuccess(true);
    } catch (err) {
      console.error('Full creation error:', err);
      let errorMsg = 'Server connection failed. Please check your internet or try again later.';
      
      if (err.response) {
        // The server responded with a status code that falls out of the range of 2xx
        errorMsg = err.response.data?.message || `Server Error (${err.response.status}). Please try again.`;
      } else if (err.request) {
        // The request was made but no response was received
        errorMsg = 'No response from server. The backend might be starting up (cold start). Please wait 30 seconds and try again.';
      }

      alert(errorMsg);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-[#050505] px-4 py-8 font-sans relative overflow-hidden selection:bg-fuchsia-500/30">
      
      {/* Background Matrix Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px]"></div>
        <div className="absolute bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-fuchsia-600/10 blur-[120px]"></div>
      </div>

      <div className="bg-white/5 backdrop-blur-2xl p-8 rounded-[2.5rem] shadow-2xl max-w-md w-full border border-white/10 relative z-10">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-fuchsia-400 mb-2">Create Session</h2>
          <p className="text-slate-400 text-sm font-medium">Configure your virtual discussion space</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-indigo-300 uppercase tracking-widest pl-1">Discussion Title <span className="text-rose-500">*</span></label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Q3 Roadmap Review" className="w-full px-4 py-3.5 rounded-xl bg-black/40 border border-white/10 focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 outline-none transition-all text-white placeholder:text-slate-600 shadow-inner" required />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-indigo-300 uppercase tracking-widest pl-1">Description / Agenda <span className="text-rose-500">*</span></label>
              <textarea name="description" value={formData.description} onChange={handleChange} placeholder="What will this session cover?" className="w-full px-4 py-3.5 rounded-xl bg-black/40 border border-white/10 focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 outline-none transition-all h-24 resize-none text-sm text-white placeholder:text-slate-600 shadow-inner" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-indigo-300 uppercase tracking-widest pl-1">Date</label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full px-3 py-3.5 rounded-xl bg-black/40 border border-white/10 focus:border-fuchsia-500/50 outline-none transition-all text-white text-sm" required />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-indigo-300 uppercase tracking-widest pl-1">Time</label>
              <input type="time" name="time" value={formData.time} onChange={handleChange} className="w-full px-3 py-3.5 rounded-xl bg-black/40 border border-white/10 focus:border-fuchsia-500/50 outline-none transition-all text-white text-sm" required />
            </div>

          </div>


          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isCreating}
              className="flex-1 py-4 bg-gradient-to-r from-indigo-500 to-fuchsia-500 hover:from-indigo-400 hover:to-fuchsia-400 text-white rounded-2xl font-bold transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] disabled:opacity-50 hover:-translate-y-1"
            >
              {isCreating ? 'Initializing...' : 'Schedule Sync'}
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(null, true)}
              disabled={isCreating}
              className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-bold hover:bg-white/10 transition-all border border-white/10 hover:-translate-y-1"
            >
              Start Now
            </button>
          </div>
        </form>

        {showSuccess && (
          <div className="mt-8 p-6 bg-emerald-500/10 rounded-3xl border border-emerald-500/20 animate-in fade-in zoom-in duration-500">
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Gateway Established
            </p>
            <div className="flex items-center bg-black/40 p-2 rounded-xl border border-emerald-500/20 mb-5">
              <span className="text-xs font-mono text-emerald-300 truncate flex-1 px-3">{`${window.location.origin}/session/${inviteLink}`}</span>
              <button 
                onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/session/${inviteLink}`); alert('Copied to clipboard!'); }} 
                className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-colors flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
            <button 
              onClick={() => navigate(`/session/${inviteLink}`)} 
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black rounded-2xl font-black transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:-translate-y-1 tracking-wide"
            >
              ENTER MEETING
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CreateSession;