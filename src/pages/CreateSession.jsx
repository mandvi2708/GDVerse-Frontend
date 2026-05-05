import { useEffect, useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

function CreateSession() {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    isInterviewMode: false,
    jobDescription: '',
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
    
    // Validation for scheduled meetings
    if (!isImmediate && (!formData.date || !formData.time)) {
      alert("Please select both a date and time for your meeting.");
      return;
    }

    setIsCreating(true);

    try {
      const payload = {
        ...formData,
        aiCount: formData.isInterviewMode ? 1 : 0,
        isImmediate
      };
      const res = await api.post('/api/sessions/create', payload);
      setInviteLink(res.data.inviteLink);
      setShowSuccess(true);
    } catch (err) {
      console.error('Creation error:', err);
      const msg = err.response?.data?.message || 'Server connection failed. Please try again.';
      alert(msg);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 px-4 py-8 font-sans">
      <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full border border-slate-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Create Session</h2>
          <p className="text-slate-500 text-sm">Configure your virtual discussion space</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Date</label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" required />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Time</label>
              <input type="time" name="time" value={formData.time} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" required />
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-all group">
              <input
                type="checkbox"
                name="isInterviewMode"
                checked={formData.isInterviewMode}
                onChange={(e) => setFormData(prev => ({ ...prev, isInterviewMode: e.target.checked }))}
                className="w-5 h-5 accent-indigo-600 cursor-pointer"
              />
              <div>
                <span className="block text-sm font-bold text-slate-800">Enable AI Interview Mode</span>
                <span className="block text-[10px] text-slate-500 uppercase tracking-tighter">AI will behave as a Recruiter</span>
              </div>
            </label>

            {formData.isInterviewMode && (
              <div className="space-y-1 animate-fade-in">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Job Description</label>
                <textarea
                  name="jobDescription"
                  value={formData.jobDescription}
                  onChange={handleChange}
                  placeholder="e.g. Senior Software Engineer..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-24 resize-none text-sm"
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isCreating}
              className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
            >
              {isCreating ? 'Creating...' : 'Schedule'}
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(null, true)}
              disabled={isCreating}
              className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg"
            >
              Start Now
            </button>
          </div>
        </form>

        {showSuccess && (
          <div className="mt-8 p-6 bg-indigo-50 rounded-3xl border border-indigo-100 animate-fade-in">
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Share Invite Link</p>
            <div className="flex items-center bg-white p-2 rounded-xl border border-indigo-200 mb-4">
              <span className="text-xs font-bold text-indigo-600 truncate flex-1 px-2">{`${window.location.origin}/session/${inviteLink}`}</span>
              <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/session/${inviteLink}`); alert('Copied!'); }} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg material-icons text-sm">content_copy</button>
            </div>
            <button onClick={() => navigate(`/session/${inviteLink}`)} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg">Join Meeting</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CreateSession;