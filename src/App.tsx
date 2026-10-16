import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { Layout } from '@/components/layout/Layout';

// Pages
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { LeadsPage } from '@/pages/LeadsPage';
import { NewLeadPage } from '@/pages/NewLeadPage';
import { LeadDetailPage } from '@/pages/LeadDetailPage';
import { FollowUpsPage } from '@/pages/FollowUpsPage';
import { CustomersPage } from '@/pages/CustomersPage';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { ProjectDetailPage } from '@/pages/ProjectDetailPage';
import { TeamManagementPage } from '@/pages/TeamManagementPage';
import { ActivityLogPage } from '@/pages/ActivityLogPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { SettingsPackagesPage } from '@/pages/SettingsPackagesPage';
import { ImportPage } from '@/pages/ImportPage';

export function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* Public Authentication Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected CRM App Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/leads" element={<LeadsPage />} />
                <Route path="/leads/new" element={<NewLeadPage />} />
                <Route path="/leads/:id" element={<LeadDetailPage />} />
                <Route path="/follow-ups" element={<FollowUpsPage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/projects/:id" element={<ProjectDetailPage />} />
                <Route path="/import" element={<ImportPage />} />

                {/* Super Admin Only Protected Routes */}
                <Route element={<AdminRoute />}>
                  <Route path="/team" element={<TeamManagementPage />} />
                  <Route path="/activity" element={<ActivityLogPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/settings" element={<SettingsPackagesPage />} />
                </Route>
              </Route>
            </Route>

            {/* Root and Fallback redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
