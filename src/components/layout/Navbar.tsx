import { useNavigate } from 'react-router-dom';
import { Search, Bell, LogOut, User } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/authApi';

export function Navbar() {
  const navigate = useNavigate();
  const clearAuth = useAuthStore(state => state.clearAuth);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error', error);
    } finally {
      clearAuth();
      navigate('/login');
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
      <div className="flex items-center flex-1">
        <div className="relative w-full max-w-md hidden md:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search employee, document, etc..."
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-md leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 sm:text-sm transition-colors cursor-not-allowed opacity-70"
            disabled
            title="Căutare în curs de dezvoltare"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button 
          className="text-slate-400 hover:text-slate-500 relative p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-not-allowed" 
          disabled 
          title="Notificări în curs de dezvoltare"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>
        
        <div className="h-6 w-px bg-slate-200 mx-1" />
        
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-1.5 rounded-full text-slate-500">
            <User className="h-5 w-5" />
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors p-1.5 rounded-md hover:bg-slate-100"
            title="Deconectare"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
