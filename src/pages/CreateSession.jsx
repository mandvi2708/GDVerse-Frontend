import { useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

function CreateSession() {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    aiCount: 1,
    humanCount: 2,
  });

  const [inviteLink, setInviteLink] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  const backendURL = import.meta.env.VITE_BACKEND_URL;

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e, isImmediate = false) => {
    if (e) e.preventDefault();
    setIsCreating(true);

    try {
      const res = await api.post('/api/sessions/create', { ...formData, isImmediate });
      setInviteLink(res.data.inviteLink);
      setShowSuccess(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create session');
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    alert('Invite link copied to clipboard!');
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 px-4 py-8">
      <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl max-w-md w-full border border-white/20 transform transition-all hover:scale-[1.01]">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Schedule New Session</h2>
          <p className="text-gray-600">Set up your group discussion parameters</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 pl-1">Session Date</label>
            <div className="relative">
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                required
              />
              <div className="absolute right-3 top-3 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 pl-1">Session Time</label>
            <div className="relative">
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                required
              />
              <div className="absolute right-3 top-3 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 pl-1">🤖 AI Participants</label>
              <div className="relative">
                <input
                  type="number"
                  name="aiCount"
                  min="0"
                  max="2"
                  value={formData.aiCount}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-1 flex items-end">
              <label className="flex items-center gap-2 cursor-pointer bg-slate-100 p-3 rounded-xl border border-slate-200 w-full hover:bg-slate-200 transition-all">
                <input
                  type="checkbox"
                  name="isInterviewMode"
                  checked={formData.isInterviewMode}
                  onChange={(e) => setFormData(prev => ({ ...prev, isInterviewMode: e.target.checked }))}
                  className="w-5 h-5 accent-indigo-600"
                />
                <span className="text-sm font-bold text-slate-700">Interview Mode</span>
              </label>
            </div>
          </div>

          {formData.isInterviewMode && (
            <div className="space-y-1 animate-fade-in">
              <label className="block text-sm font-medium text-gray-700 pl-1">💼 Job Description / Role</label>
              <textarea
                name="jobDescription"
                value={formData.jobDescription}
                onChange={handleChange}
                placeholder="e.g. Senior Frontend Developer with React expertise..."
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm h-24 resize-none"
              />
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isCreating}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold text-white transition-all shadow-lg ${
                isCreating 
                  ? 'bg-indigo-400 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-300'
              } flex items-center justify-center`}
            >
              {isCreating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  ...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Schedule
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(null, true)}
              disabled={isCreating}
              className="flex-1 py-3 px-4 rounded-xl font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <span className="text-lg">⚡</span>
              Start Now
            </button>
          </div>
        </form>

        {showSuccess && (
          <div className="mt-6 animate-fade-in-up bg-green-50/90 border border-green-200 rounded-xl overflow-hidden">
            <div className="bg-green-600 px-4 py-2 text-white font-medium flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Session Ready!
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-700 mb-2 font-semibold">Share this link with participants:</p>
              <div className="flex items-center bg-white rounded-lg border border-gray-200 p-2 mb-4 group hover:border-indigo-300 transition-all">
                <a 
                  href={`${window.location.origin}/session/${inviteLink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs break-all flex-1 text-indigo-600 font-bold hover:underline"
                >
                  {`${window.location.origin}/session/${inviteLink}`}
                </a>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/session/${inviteLink}`);
                    alert('Full link copied!');
                  }}
                  className="ml-2 p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors"
                  title="Copy link"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                </button>
              </div>
              <button
                onClick={() => navigate(`/session/${inviteLink}`)}
                className="w-full py-3 px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
              >
                <span>Join Meeting Now</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CreateSession;