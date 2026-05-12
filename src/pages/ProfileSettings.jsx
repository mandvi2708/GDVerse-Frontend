import { useState } from 'react';
import Sidebar from '../components/Sidebar';

function ProfileSettings() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#050505] text-white font-sans selection:bg-indigo-500/30">
      <Sidebar active="profile" />
      
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <header className="mb-12">
            <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">
                Profile & Settings
            </h1>
            <p className="text-slate-400 mt-2 font-medium">Manage your identity and preferences.</p>
        </header>

        <div className="max-w-4xl space-y-8">
            <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-12">
                <div className="flex flex-col md:flex-row gap-10 items-start md:items-center mb-12">
                    <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 to-fuchsia-500 rounded-[2.5rem] flex items-center justify-center text-5xl shadow-2xl shadow-indigo-500/20">
                        {user.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1">
                        <h2 className="text-3xl font-black mb-2">{user.name || 'User Name'}</h2>
                        <p className="text-indigo-400 font-bold uppercase tracking-widest text-xs">Premium Candidate Account</p>
                        <div className="mt-6 flex gap-4">
                            <button className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold transition-all">
                                Change Avatar
                            </button>
                            <button 
                                onClick={() => setIsEditing(!isEditing)}
                                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20"
                            >
                                {isEditing ? 'Save Changes' : 'Edit Profile'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Full Name</label>
                        <input 
                            type="text" 
                            disabled={!isEditing}
                            value={user.name}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold focus:outline-none focus:border-indigo-500/50 transition-all disabled:opacity-50"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Email Address</label>
                        <input 
                            type="email" 
                            disabled={!isEditing}
                            value={user.email}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold focus:outline-none focus:border-indigo-500/50 transition-all disabled:opacity-50"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Preferred Role</label>
                        <input 
                            type="text" 
                            disabled={!isEditing}
                            placeholder="e.g. Senior Fullstack Engineer"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold focus:outline-none focus:border-indigo-500/50 transition-all disabled:opacity-50"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Experience Level</label>
                        <select 
                            disabled={!isEditing}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold focus:outline-none focus:border-indigo-500/50 transition-all disabled:opacity-50 appearance-none"
                        >
                            <option>Junior (0-2 years)</option>
                            <option>Mid-level (2-5 years)</option>
                            <option>Senior (5-8 years)</option>
                            <option>Lead / Architect (8+ years)</option>
                        </select>
                    </div>
                </div>
            </section>

            <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-12">
                <h3 className="text-xl font-bold mb-8 flex items-center gap-3 text-rose-400">
                    <span className="text-2xl">🔒</span> Security & Account
                </h3>
                <div className="space-y-6">
                    <div className="flex justify-between items-center p-6 bg-white/5 border border-white/10 rounded-2xl">
                        <div>
                            <h4 className="font-bold">Password</h4>
                            <p className="text-xs text-slate-500 mt-1">Last changed 3 months ago</p>
                        </div>
                        <button className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition-all">Update</button>
                    </div>
                    <div className="flex justify-between items-center p-6 bg-white/5 border border-white/10 rounded-2xl">
                        <div>
                            <h4 className="font-bold">Two-Factor Authentication</h4>
                            <p className="text-xs text-slate-500 mt-1">Add an extra layer of security</p>
                        </div>
                        <button className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition-all">Enable</button>
                    </div>
                </div>
            </section>
        </div>
      </main>
    </div>
  );
}

export default ProfileSettings;
