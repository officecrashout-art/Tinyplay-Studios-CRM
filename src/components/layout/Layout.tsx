import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { CreateLeadModal } from '@/components/modals/CreateLeadModal';
import { apiFollowUps } from '@/services/api';
import { FollowUp } from '@/types';

export const Layout: React.FC = () => {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [isQuickLeadOpen, setIsQuickLeadOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const loadFollowUps = async () => {
    try {
      const data = await apiFollowUps.listFollowUps();
      setFollowUps(data);
    } catch (err) {
      console.error('Failed to load follow-ups for header', err);
    }
  };

  useEffect(() => {
    loadFollowUps();
  }, [location.pathname]);

  const pendingCount = followUps.filter((f) => f.status === 'Pending').length;

  // Derive title from current path
  const getPageInfo = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) {
      return { title: 'Executive Overview', subtitle: 'Pipeline metrics, revenue insights & daily action items' };
    }
    if (path.startsWith('/leads/new')) {
      return { title: 'Add Potential Customer', subtitle: 'Register and assign a new prospective client' };
    }
    if (path.startsWith('/leads')) {
      return { title: 'Leads & Sales CRM', subtitle: 'Manage inquiries, qualify prospects and schedule conversations' };
    }
    if (path.startsWith('/follow-ups')) {
      return { title: 'Follow-ups Management', subtitle: 'Due today, tomorrow, and overdue reminder schedules' };
    }
    if (path.startsWith('/customers')) {
      return { title: 'Confirmed Customers', subtitle: 'Directory of converted clients and game buyers' };
    }
    if (path.startsWith('/projects')) {
      return { title: 'Game Projects Tracker', subtitle: 'Development stages, payment milestones and delivery targets' };
    }
    if (path.startsWith('/team')) {
      return { title: 'Staff & Team Directory', subtitle: 'Provision salesperson accounts, assign Staff IDs and credentials' };
    }
    if (path.startsWith('/activity')) {
      return { title: 'Activity Audit Log', subtitle: 'Immutable company-wide event timeline and security trail' };
    }
    if (path.startsWith('/settings')) {
      return { title: 'Packages & Studio Pricing', subtitle: 'Manage standardized game offerings and base prices' };
    }
    if (path.startsWith('/import')) {
      return { title: 'Spreadsheet Importer', subtitle: 'Migrate and validate historical records from Excel / CSV' };
    }
    return { title: 'TinyPlayStudioz CRM', subtitle: 'Internal Sales & Project Management' };
  };

  const { title, subtitle } = getPageInfo();

  return (
    <div className="flex h-screen bg-[#07070C] text-zinc-100 overflow-hidden relative">
      {/* Dynamic Ambient Glass Glow Orbs (#61C9F6 Lightish Sky Blue) */}
      <div className="fixed -top-24 left-64 w-[550px] h-[550px] bg-[#61C9F6]/15 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed top-1/4 -right-20 w-[500px] h-[500px] bg-[#0284C7]/15 rounded-full blur-[150px] pointer-events-none z-0" />
      <div className="fixed -bottom-28 left-1/3 w-[600px] h-[600px] bg-[#38BDF8]/10 rounded-full blur-[160px] pointer-events-none z-0" />

      {/* Desktop Sidebar */}
      <div className="hidden lg:block relative z-20">
        <Sidebar pendingFollowUpsCount={pendingCount} />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-64 shadow-2xl">
            <Sidebar pendingFollowUpsCount={pendingCount} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        <Header
          title={title}
          subtitle={subtitle}
          onOpenQuickLead={() => setIsQuickLeadOpen(true)}
          followUps={followUps}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet context={{ refreshGlobalFollowUps: loadFollowUps }} />
          </div>
        </main>
      </div>

      {/* Global Quick Add Lead Modal */}
      <CreateLeadModal
        isOpen={isQuickLeadOpen}
        onClose={() => setIsQuickLeadOpen(false)}
        onSuccess={(_newLead) => {
          loadFollowUps();
          // Navigate to leads list to view newly created lead
          navigate('/leads');
        }}
      />
    </div>
  );
};
