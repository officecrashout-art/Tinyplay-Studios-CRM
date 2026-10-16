# TinyPlayStudioz — Internal Sales CRM & Game Project Manager

A production-ready internal web application designed for personalized game development sales, follow-ups, and project delivery pipelines.

---

## 🌟 Key Capabilities

1. **Staff ID Authentication & Access Control (No public registration or personal emails)**:
   - Built on Supabase Auth underneath with an internal virtual identifier mapping (`<staff_id>@staff.tinyplaystudioz.internal`).
   - Two strict roles: `SUPER_ADMIN` and `SALES`.
   - **Super Admin** exclusive capabilities:
     - Provision salesperson accounts with custom Staff IDs (`SALES-001`, `SALES-002`) and passwords.
     - Reset staff passwords.
     - Activate or instantly disable staff accounts (with real-time session invalidation).
     - Access company-wide financial reports, revenue summaries, and team performance metrics.
     - Inspect the immutable Activity Audit Log.
     - Reassign leads and projects between staff.
   - **Salespeople**:
     - Log in with Staff ID and password.
     - Restricted by Row Level Security (RLS) to assigned inquiries and projects.
     - Blocked from admin financial dashboards, staff management, and activity logs.

2. **Leads / Potential Customer CRM**:
   - Track customer name, platform (Instagram, Facebook, WhatsApp, Other), handle, direct profile link, phone, game type, package, budget in ৳ (BDT), lead source, status, and priority (Hot, Warm, Cold).
   - Real-time duplicate detection by platform and social handle.
   - Dated conversation notes log with author attribution.
   - One-click lead conversion into Confirmed Customer and Game Project without losing historical inquiry data.

3. **Follow-ups Engine**:
   - Categorized tabs: Due Today, Tomorrow, Overdue, Upcoming, Completed, and Calendar.
   - In-app reminder notification badge with dropdown alerts for overdue and today's calls.
   - Log outcome notes and automatically chain next scheduled follow-up dates.

4. **Game Projects & Payment Milestones**:
   - Track project title, description, custom requirements, assigned developer, production stage, target delivery date, and deliverables/reference links.
   - Production stages: *Requirements Analysis → Awaiting Advance → Confirmed → In Development → Demo/Review → Revisions → Ready for Delivery → Delivered → Cancelled*.
   - Multi-stage payment recording: Advance, Partial, and Final in Bangladeshi Taka (৳).
   - Real-time auto-calculation: `Remaining Balance = Agreed Project Price - Total Payments Received`.
   - Standardized packages with frozen historical agreed prices on confirmed projects.

5. **Staff Activity Monitoring & Audit Trail**:
   - Automated server-side triggers recording actor identity, timestamps, old/new snapshot values, and human-readable descriptions (e.g., `SALES-002 changed customer status from Interested to Confirmed`).
   - Immutable: RLS prevents modification or deletion of activity logs by any user.

6. **Spreadsheet Importer (`PROJECTS.xlsx`)**:
   - Import historical workbooks with column mapping and validation.
   - Detects duplicates, ambiguous dates without years, non-URL links, and uncertain payment amounts (e.g. text labels like "half").
   - Requires explicit Super Admin review and confirmation before database persistence.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS v4, Lucide React icons, Canvas Confetti.
- **Routing**: React Router (with `ProtectedRoute` and `AdminRoute` guards).
- **Backend & Database**: Supabase PostgreSQL with UUID keys, foreign key constraints, and Row Level Security (RLS).
- **Privileged Backend**: Supabase Edge Functions (`manage-staff`) using Service Role Key.
- **Hosting Target**: Cloudflare Pages (includes SPA `_redirects`).
- **Testing**: Vitest automated security test suite.

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Copy the `.env.example` file to `.env.local`:
```bash
cp .env.example .env.local
```

Configure your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```
> **Note**: If you run without live Supabase credentials, the CRM automatically runs on the built-in resilient local data engine, allowing you to test all pages, roles, and workflows immediately!

### 3. Start Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 🔐 Super Admin Bootstrap & Credentials

### Default Test Account Presets (Ready to test immediately)
- **Super Admin**:
  - Staff ID: `ADMIN-001`
  - Password: `password123`
- **Sales Representative**:
  - Staff ID: `SALES-001`
  - Password: `password123`

---

## 🗄️ Database Migrations & Supabase Setup

All migrations are located in `supabase/migrations/`:

1. `20261016000001_initial_schema.sql`: Normalized tables (`staff_profiles`, `packages`, `contacts`, `leads`, `follow_ups`, `customer_notes`, `projects`, `payments`, `activity_logs`).
2. `20261016000002_rls_and_security.sql`: Helper functions (`is_super_admin()`, `current_staff_id()`, `is_active_staff()`) and RLS policies on all tables.
3. `20261016000003_audit_triggers.sql`: Automated triggers on `leads`, `projects`, and `payments` that insert audit entries into `activity_logs`.
4. `20261016000004_seed_and_bootstrap.sql`: Default packages and the `bootstrap_super_admin` PostgreSQL function.

### Applying Migrations via Supabase CLI
```bash
supabase db push
```
*Or execute the contents of each `.sql` file sequentially inside your Supabase project's SQL Editor.*

### Bootstrapping Your First Super Admin in Supabase
Run this one-time SQL query in your Supabase SQL Editor:
```sql
SELECT public.bootstrap_super_admin(
    'ADMIN-001',
    'admin@staff.tinyplaystudioz.internal',
    'YourSecureAdminPasswordHere',
    'TinyPlay Super Admin'
);
```

---

## ⚡ Deploying Supabase Edge Function (`manage-staff`)

The Edge Function handles privileged actions like creating salesperson auth accounts, resetting passwords, and revoking sessions.

Deploy to your Supabase project:
```bash
supabase functions deploy manage-staff --no-verify-jwt
```
Set the necessary environment secrets in Supabase:
```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 🌐 Cloudflare Pages Deployment

This project is fully compatible with Cloudflare Pages as a Single Page Application:

1. **Build Command**: `npm run build`
2. **Output Directory**: `dist`
3. **Root Directory**: `/`
4. The file `public/_redirects` ensures all deep routes (e.g. `/leads/123`, `/projects/456`) route to `/index.html` with HTTP 200.
5. Set environment variables in your Cloudflare Pages dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

---

## 🧪 Automated Security Test Suite

Run the Vitest test suite to verify role restrictions and end-to-end business flows:
```bash
npx vitest run
```
Tests verify:
- Super Admin company-wide access and financial report visibility.
- Salesperson access restrictions (blocked from activity logs and peers' leads).
- Deactivated staff account blocking.
- Complete end-to-end lifecycle: Admin creates staff → Sales adds lead → Follow-up → Converts to Project → Records payment → Admin inspects audit trail.
