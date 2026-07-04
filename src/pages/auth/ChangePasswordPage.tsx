import { useState } from 'react'; import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/api/authApi';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore(state => state.setAuth);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmNewPassword) {
      setError('Noua parolă și confirmarea nu coincid.');
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.changePassword({ 
        currentPassword, 
        newPassword, 
        confirmNewPassword 
      });
      
      setAuth(response.accessToken, response.requiresPasswordChange);
      navigate('/');
    } catch (err: any) {
      console.error('Change password error:', err.response?.data || err.message);
      if (err.response && err.response.status === 400) {
        setError('Parola curentă este incorectă sau noua parolă nu respectă cerințele de securitate.');
      } else {
        setError('A apărut o eroare. Te rugăm să încerci din nou.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-center text-slate-900 mb-2">Schimbare Parolă</h2>
        <p className="text-center text-sm text-slate-500 mb-6">
          Contul tău necesită o nouă parolă pentru a continua.
        </p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded border border-red-200 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Parola curentă</label>
            <input 
              type="password" 
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Noua parolă</label>
            <input 
              type="password" 
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirmare noua parolă</label>
            <input 
              type="password" 
              required
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500"
            />
          </div>
          
          <Button type="submit" className="w-full mt-6" disabled={loading}>
            {loading ? 'Se salvează...' : 'Schimbă Parola'}
          </Button>
        </form>
      </div>
    </div>
  );
}
