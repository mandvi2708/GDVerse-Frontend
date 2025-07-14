import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function CreateSession() {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    aiCount: 2,
    humanCount: 2,
  });

  const [inviteLink, setInviteLink] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      const res = await axios.post('http://localhost:5000/api/sessions/create', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInviteLink(res.data.inviteLink);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create session');
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-indigo-200 to-pink-200 px-4">
      <div className="bg-white p-8 rounded-lg shadow max-w-md w-full">
        <h2 className="text-2xl font-bold text-center text-indigo-700 mb-6">📅 Schedule New GD Session</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Time</label>
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">AI Participants</label>
              <input
                type="number"
                name="aiCount"
                min="0"
                max="5"
                value={formData.aiCount}
                onChange={handleChange}
                className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Human Participants</label>
              <input
                type="number"
                name="humanCount"
                min="0"
                max="5"
                value={formData.humanCount}
                onChange={handleChange}
                className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded hover:bg-indigo-700 transition"
          >
            ➕ Create Session
          </button>
        </form>

        {inviteLink && (
          <div className="mt-6 bg-green-100 border border-green-400 text-green-800 px-4 py-2 rounded">
            ✅ Session Created! Invite Link: <br />
            <code className="text-sm break-all">{inviteLink}</code>
          </div>
        )}
      </div>
    </div>
  );
}

export default CreateSession;
