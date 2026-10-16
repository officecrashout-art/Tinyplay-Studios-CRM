-- Migration 001: Initial Schema for TinyPlayStudioz Internal Sales CRM & Game Project Manager

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Staff Profiles
CREATE TABLE IF NOT EXISTS public.staff_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    staff_id TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN', 'SALES')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for quick lookup by staff_id & role
CREATE INDEX IF NOT EXISTS idx_staff_profiles_staff_id ON public.staff_profiles(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_role ON public.staff_profiles(role);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_is_active ON public.staff_profiles(is_active);

-- 2. Packages (Configurable game packages with prices)
CREATE TABLE IF NOT EXISTS public.packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    base_price_bdt NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    description TEXT,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_packages_is_active ON public.packages(is_active);

-- 3. Contacts / Confirmed Customers
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('Instagram', 'Facebook', 'WhatsApp', 'Other')),
    handle TEXT NOT NULL,
    profile_url TEXT,
    phone TEXT,
    email TEXT,
    notes TEXT,
    lead_id UUID,
    created_by UUID REFERENCES public.staff_profiles(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES public.staff_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contacts_platform_handle ON public.contacts(platform, lower(handle));
CREATE INDEX IF NOT EXISTS idx_contacts_assigned_to ON public.contacts(assigned_to);

-- 4. Leads (Potential Customers)
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('Instagram', 'Facebook', 'WhatsApp', 'Other')),
    handle TEXT NOT NULL,
    profile_url TEXT,
    phone TEXT,
    game_type TEXT NOT NULL,
    package_id UUID REFERENCES public.packages(id) ON DELETE SET NULL,
    estimated_budget_bdt NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    lead_source TEXT NOT NULL DEFAULT 'Instagram DM',
    status TEXT NOT NULL DEFAULT 'New' CHECK (status IN (
        'New', 'Contacted', 'Interested', 'Follow-up Scheduled', 
        'Contact Later', 'Negotiating', 'Confirmed', 'Lost'
    )),
    priority TEXT NOT NULL DEFAULT 'Warm' CHECK (priority IN ('Hot', 'Warm', 'Cold')),
    conversation_notes TEXT,
    next_follow_up_at TIMESTAMPTZ,
    follow_up_reason TEXT,
    assigned_to UUID REFERENCES public.staff_profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.staff_profiles(id) ON DELETE SET NULL,
    is_converted BOOLEAN NOT NULL DEFAULT false,
    converted_at TIMESTAMPTZ,
    converted_customer_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Foreign key back from contacts.lead_id to leads.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_contacts_lead' AND table_name = 'contacts'
    ) THEN
        ALTER TABLE public.contacts 
        ADD CONSTRAINT fk_contacts_lead FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_leads_platform_handle ON public.leads(platform, lower(handle));
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_priority ON public.leads(priority);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_next_follow_up_at ON public.leads(next_follow_up_at);
CREATE INDEX IF NOT EXISTS idx_leads_is_converted ON public.leads(is_converted);

-- 5. Follow-ups
CREATE TABLE IF NOT EXISTS public.follow_ups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Rescheduled', 'Cancelled')),
    result_notes TEXT,
    completed_at TIMESTAMPTZ,
    assigned_to UUID REFERENCES public.staff_profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.staff_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_follow_ups_scheduled_at ON public.follow_ups(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_follow_ups_status ON public.follow_ups(status);
CREATE INDEX IF NOT EXISTS idx_follow_ups_assigned_to ON public.follow_ups(assigned_to);
CREATE INDEX IF NOT EXISTS idx_follow_ups_lead_id ON public.follow_ups(lead_id);

-- 6. Customer & Lead Notes
CREATE TABLE IF NOT EXISTS public.customer_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author_id UUID REFERENCES public.staff_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_notes_lead_id ON public.customer_notes(lead_id);
CREATE INDEX IF NOT EXISTS idx_customer_notes_contact_id ON public.customer_notes(contact_id);

-- 7. Confirmed Game Projects
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    package_id UUID REFERENCES public.packages(id) ON DELETE SET NULL,
    package_name_snapshot TEXT,
    agreed_price_bdt NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    custom_requirements TEXT,
    assigned_developer TEXT,
    stage TEXT NOT NULL DEFAULT 'Requirements Analysis' CHECK (stage IN (
        'Requirements Analysis', 'Awaiting Advance', 'Confirmed', 
        'In Development', 'Demo/Review', 'Revisions', 
        'Ready for Delivery', 'Delivered', 'Cancelled'
    )),
    target_delivery_date DATE,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reference_links JSONB NOT NULL DEFAULT '[]'::jsonb,
    project_notes TEXT,
    assigned_salesperson UUID REFERENCES public.staff_profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.staff_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_contact_id ON public.projects(contact_id);
CREATE INDEX IF NOT EXISTS idx_projects_stage ON public.projects(stage);
CREATE INDEX IF NOT EXISTS idx_projects_assigned_salesperson ON public.projects(assigned_salesperson);

-- 8. Payments
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    amount_bdt NUMERIC(12, 2) NOT NULL CHECK (amount_bdt > 0),
    payment_type TEXT NOT NULL CHECK (payment_type IN ('Advance', 'Partial', 'Final')),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('bKash', 'Nagad', 'Bank Transfer', 'Cash', 'Other')),
    transaction_ref TEXT,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    recorded_by UUID REFERENCES public.staff_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_project_id ON public.payments(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.payments(payment_date);

-- 9. Activity Logs (Immutable Audit Trail)
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.staff_profiles(id) ON DELETE SET NULL,
    actor_staff_id TEXT,
    actor_name TEXT,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    action TEXT NOT NULL,
    description TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_actor_id ON public.activity_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id);
