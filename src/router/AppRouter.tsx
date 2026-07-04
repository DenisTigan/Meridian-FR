import { Routes, Route } from 'react-router-dom';
import LoginPage from '@/pages/auth/LoginPage';
import ChangePasswordPage from '@/pages/auth/ChangePasswordPage';
import DashboardPage from '@/pages/DashboardPage';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';

export function AppRouter() {
  return (
    <Routes>
      {/* Rute publice (fără layout) */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Rute protejate care necesită autentificare */}
      <Route element={<ProtectedRoute />}>
        {/* Ruta fără layout principal, dar protejată */}
        <Route path="/change-password" element={<ChangePasswordPage />} />
        
        {/* Rutele cu layout principal */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          {/* Alte rute vor veni aici */}
        </Route>
      </Route>
    </Routes>
  );
}
