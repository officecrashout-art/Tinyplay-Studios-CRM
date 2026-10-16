import {
  StaffProfile,
  Package,
  Lead,
  FollowUp,
  Contact,
  Project,
  Payment,
  ActivityLog,
} from '@/types';

// Production Initial Roster — Only Super Admin bootstrap entry
export const INITIAL_STAFF: StaffProfile[] = [
  {
    id: 'usr-admin-001',
    staff_id: 'ADMIN-001',
    full_name: 'Studio Super Admin',
    email: 'admin-001.tinyplay@gmail.com',
    role: 'SUPER_ADMIN',
    is_active: true,
    phone: null,
    avatar_url: null,
    created_at: new Date().toISOString(),
  },
];

// Standardized Studio Package Tiers
export const INITIAL_PACKAGES: Package[] = [
  {
    id: 'pkg-tier-1',
    name: 'Tier 1 — Mini',
    code: 'TIER-1-MINI',
    base_price_bdt: 999,
    description: 'A simple, memorable birthday greeting mini-game with custom name and message. Delivery: 2-4 Days.',
    features: [
      '1 Simple Mini-Game',
      'Personalized Name & Photos',
      'Custom Birthday Message',
      'Basic Custom Theme',
      'Shareable Web Link',
      'Delivery: 2-4 Days',
    ],
    is_active: true,
    created_at: '2026-09-01T00:00:00Z',
  },
  {
    id: 'pkg-tier-2',
    name: 'Tier 2 — Best Value',
    code: 'TIER-2-VALUE',
    base_price_bdt: 1999,
    description: 'The ideal blend of custom mini-games, personal memories, and custom background music. Delivery: 7-10 Days.',
    features: [
      '2-3 Custom Mini-Games',
      'Fully Personalized Design',
      'Add Photos & Memories',
      'Custom Background Music Track',
      'Animations & Special FX',
      'Interactive Birthday Letter',
      'Personal Web Portal',
      '100% Mobile Optimized',
      '2 Revisions Included',
      'Delivery: 7-10 Days',
    ],
    is_active: true,
    created_at: '2026-09-01T00:00:00Z',
  },
  {
    id: 'pkg-tier-3',
    name: 'Tier 3 — Premium',
    code: 'TIER-3-PREMIUM',
    base_price_bdt: 3999,
    description: 'The ultimate interactive digital adventure and fully bespoke custom web experience. Delivery: 10-15 Days.',
    features: [
      '4+ Custom Mini-Games',
      'Bespoke Custom Website',
      'Advanced Animations & Particles',
      'Photos, Videos & Memories Gallery',
      'Custom Audio Track',
      'Personalized Storyline',
      'Special Easter Eggs & Surprises',
      'Unlimited Revisions',
      'Delivery: 10-15 Days',
    ],
    is_active: true,
    created_at: '2026-09-01T00:00:00Z',
  },
];

// Production Clean Data: Fresh Studio State
export const INITIAL_LEADS: Lead[] = [];
export const INITIAL_CONTACTS: Contact[] = [];
export const INITIAL_PROJECTS: Project[] = [];
export const INITIAL_PAYMENTS: Payment[] = [];
export const INITIAL_FOLLOW_UPS: FollowUp[] = [];
export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [];
