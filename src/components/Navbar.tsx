import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Network, 
  Sparkles, 
  LogOut, 
  BookOpen, 
  Layers, 
  Building2, 
  UserCircle,
  FlaskConical
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, demoLogin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleDemo = async () => {
    try {
      await demoLogin();
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    }
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-emerald-500 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/35 transition-all">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Network className="w-5 h-5 text-indigo-400 group-hover:text-emerald-400 transition-colors" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white group-hover:text-indigo-200 transition-colors font-sans">
                ScholarMesh<span className="text-emerald-400 font-extrabold ml-0.5">AI</span>
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded font-mono">
                v2.5
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Multi-Source Synthesis & Evidence Discovery
            </p>
          </div>
        </Link>

        {/* Navigation Items */}
        {isAuthenticated ? (
          <div className="flex items-center gap-4 lg:gap-6">
            <div className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800/80">
              <Link
                to="/dashboard"
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive('/dashboard') || isActive('/workspaces')
                    ? 'bg-indigo-600/90 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Workspaces</span>
              </Link>
              <Link
                to="/saved-syntheses"
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive('/saved-syntheses')
                    ? 'bg-indigo-600/90 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Synthesis Library</span>
              </Link>
            </div>

            {/* Researcher Profile Info Badge */}
            <div className="hidden lg:flex items-center gap-3 pl-2 border-l border-slate-800">
              <div className="flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-200 flex items-center justify-end gap-1.5">
                  <UserCircle className="w-3.5 h-3.5 text-indigo-400" />
                  {user?.full_name}
                </span>
                <span className="text-[10px] text-slate-400 flex items-center justify-end gap-1 truncate max-w-[200px]">
                  <Building2 className="w-3 h-3 text-emerald-400" />
                  {user?.institution || 'Research Institute'}
                </span>
              </div>
            </div>

            {/* Logout Action */}
            <button
              onClick={logout}
              title="Sign Out"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-rose-400 bg-slate-900/80 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/20 rounded-lg transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={handleDemo}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/30 hover:border-emerald-500/50 rounded-lg transition-all shadow-sm shadow-emerald-900/20 cursor-pointer"
            >
              <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
              <span>1-Click Demo</span>
            </button>
            <Link
              to="/login"
              className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Get Started</span>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
