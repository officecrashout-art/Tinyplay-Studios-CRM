import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#07070C] text-[#61C9F6] gap-3">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-xs font-mono text-zinc-400">Authenticating TinyPlay CRM Session...</p>
      </div>
    );
  }

  if (!user || !user.is_active) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
