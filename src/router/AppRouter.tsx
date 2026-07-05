import { Routes, Route } from 'react-router-dom';
import LoginPage from '@/pages/auth/LoginPage';
import ChangePasswordPage from '@/pages/auth/ChangePasswordPage';
import DashboardPage from '@/pages/DashboardPage';
import ProfilePage from '@/pages/ProfilePage';
import AnnouncementsPage from '@/pages/AnnouncementsPage';
import QuickLinksPage from '@/pages/QuickLinksPage';
import AdminPage from '@/pages/admin/AdminPage';
import DepartmentsPage from '@/pages/admin/DepartmentsPage';
import TeamsPage from '@/pages/admin/TeamsPage';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleGuard } from './RoleGuard';

import DirectoryPage from '@/pages/DirectoryPage';
import EmployeeDetailPage from '@/pages/EmployeeDetailPage';
import OnboardingPage from '@/pages/OnboardingPage';
import BuddyPage from '@/pages/BuddyPage';
import BuddyAdminPage from '@/pages/BuddyAdminPage';
import DeskBookingPage from '@/pages/DeskBookingPage';
import CalendarPage from '@/pages/CalendarPage';
import HRTicketsPage from '@/pages/HRTicketsPage';
import LeaveRequestsPage from '@/pages/LeaveRequestsPage';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      <Route element={<ProtectedRoute />}>
        <Route path="/change-password" element={<ChangePasswordPage />} />
        
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/news" element={<AnnouncementsPage />} />
          <Route path="/links" element={<QuickLinksPage />} />
          <Route path="/directory" element={<DirectoryPage />} />
          <Route path="/directory/:id" element={<EmployeeDetailPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/buddy" element={<BuddyPage />} />
          <Route path="/desk-booking" element={<DeskBookingPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/hr-tickets" element={<HRTicketsPage />} />
          <Route path="/leave" element={<LeaveRequestsPage />} />
          
          <Route element={<RoleGuard requiredRole="Admin" />}>
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/departments" element={<DepartmentsPage />} />
            <Route path="/admin/teams" element={<TeamsPage />} />
            <Route path="/directory/:employeeId/onboarding" element={<OnboardingPage />} />
            <Route path="/buddy/admin" element={<BuddyAdminPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
