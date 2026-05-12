import { Link, useLocation, useNavigate } from 'react-router-dom';

function Sidebar({ active }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menuItems = [
    { id: 'home', label: 'Home', path: '/', icon: '🏠' },
    { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { id: 'interview', label: 'AI Interview', path: '/interview/setup', icon: '🎤' },
    { id: 'quiz', label: 'AI Quiz', path: '/quiz/setup', icon: '🧪' },
    { id: 'reports', label: 'Reports & History', path: '/reports', icon: '📄' },
    { id: 'profile', label: 'Profile & Settings', path: '/profile', icon: '⚙️' },
  ];

  return (
    <aside className="w-72 bg-white/5 border-r border-white/10 flex flex-col p-6 hidden md:flex">
      <div className="flex items-center gap-3 mb-12 px-2">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <span className="font-black text-xl">G</span>
        </div>
        <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-fuchsia-400">GDVerse</span>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all ${
              active === item.id 
                ? 'bg-gradient-to-r from-indigo-600/20 to-fuchsia-600/20 text-white border border-white/10 shadow-lg' 
                : 'text-slate-500 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t border-white/10">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
        >
          <span className="text-xl">🚪</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
