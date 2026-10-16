import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert } from 'lucide-react';

export const AdminRoute: React.FC = () => {
  const { isSuperAdmin, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
