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
    <div className="flex h-screen bg-[#0B0E14] text-[#F5F7FA] overflow-hidden relative">
      {/* Apple Subtle Ambient Depth — Restrained, cool-toned graphite glow */}
      <div className="fixed -top-32 left-1/4 w-[600px] h-[600px] bg-[#1E293B]/20 rounded-full blur-[160px] pointer-events-none z-0" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-[#0F172A]/30 rounded-full blur-[150px] pointer-events-none z-0" />

      {/* Desktop Sidebar (Level 1 Structural Glass) */}
      <div className="hidden lg:block relative z-20 shrink-0">
        <Sidebar pendingFollowUpsCount={pendingCount} />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden animate-in fade-in duration-200">
          <div
            className="fixed inset-0 apple-backdrop"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-64 h-full shadow-2xl animate-in slide-in-from-left duration-200">
            <Sidebar
              pendingFollowUpsCount={pendingCount}
              onNavigate={() => setMobileMenuOpen(false)}
            />
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
          navigate('/leads');
        }}
      />
    </div>
  );
};
