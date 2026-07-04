import { useState } from 'react'; import type { FormEvent } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '@/api/authApi';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore(state => state.setAuth);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionExpired = searchParams.get('sessionExpired') === 'true';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await authApi.login({ email, password });
      setAuth(response.accessToken, response.requiresPasswordChange);

      if (response.requiresPasswordChange) {
        navigate('/change-password');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      console.error('Login error:', err.response?.data || err.message);
      
      if (err.response) {
        if (err.response.status === 401 || err.response.status === 400) {
          setError('Email sau parolă incorectă.');
        } else {
          setError(`Eroare de server (${err.response.status}). Te rugăm să încerci mai târziu.`);
        }
      } else {
        setError('Eroare de rețea. Te rugăm să verifici conexiunea.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-center text-slate-900 mb-6">Autentificare</h2>
        
        {sessionExpired && (
          <div className="mb-4 p-3 bg-amber-50 text-amber-800 text-sm rounded border border-amber-200 text-center">
            Sesiunea a expirat. Te rugăm să te autentifici din nou.
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded border border-red-200 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Parolă</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-500 focus:border-slate-500"
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Se procesează...' : 'Autentificare'}
          </Button>
        </form>
      </div>
    </div>
  );
}
