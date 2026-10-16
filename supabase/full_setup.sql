-- ====================================================================
-- TINYPLAYSTUDIOZ CRM — COMPLETE ONE-CLICK DATABASE SETUP SCRIPT
-- Paste this entire script into your Supabase SQL Editor and click "RUN"
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. SCHEMA DEFINITION

-- Staff Profiles
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

CREATE INDEX IF NOT EXISTS idx_staff_profiles_staff_id ON public.staff_profiles(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_role ON public.staff_profiles(role);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_is_active ON public.staff_profiles(is_active);

-- Packages
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

-- Contacts / Confirmed Customers
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

-- Leads
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

-- Follow-ups
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

-- Customer Notes
CREATE TABLE IF NOT EXISTS public.customer_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author_id UUID REFERENCES public.staff_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Confirmed Projects
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

-- Payments
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

-- Activity Logs
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

-- 3. RLS HELPER FUNCTIONS & POLICIES
CREATE OR REPLACE FUNCTION public.current_staff_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT id FROM public.staff_profiles WHERE id = auth.uid() AND is_active = true LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.staff_profiles 
        WHERE id = auth.uid() 
          AND role = 'SUPER_ADMIN' 
          AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_active_staff()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.staff_profiles 
        WHERE id = auth.uid() 
          AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Enable RLS
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Active staff can view staff directory"
    ON public.staff_profiles FOR SELECT
    USING (public.is_active_staff());

CREATE POLICY "Super Admin can insert staff profiles"
    ON public.staff_profiles FOR INSERT
    WITH CHECK (public.is_super_admin() OR auth.uid() = id);

CREATE POLICY "Super Admin can update staff profiles"
    ON public.staff_profiles FOR UPDATE
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

CREATE POLICY "Super Admin can delete staff profiles"
    ON public.staff_profiles FOR DELETE
    USING (public.is_super_admin());

CREATE POLICY "Active staff can view packages"
    ON public.packages FOR SELECT
    USING (public.is_active_staff());

CREATE POLICY "Super Admin can manage packages"
    ON public.packages FOR ALL
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

CREATE POLICY "Staff can view assigned or created contacts; Admin views all"
    ON public.contacts FOR SELECT
    USING (
        public.is_super_admin() OR 
        (public.is_active_staff() AND (assigned_to = public.current_staff_id() OR created_by = public.current_staff_id()))
    );

CREATE POLICY "Active staff can create contacts"
    ON public.contacts FOR INSERT
    WITH CHECK (public.is_active_staff());

CREATE POLICY "Staff can update assigned contacts; Admin updates all"
    ON public.contacts FOR UPDATE
    USING (
        public.is_super_admin() OR 
        (public.is_active_staff() AND (assigned_to = public.current_staff_id() OR created_by = public.current_staff_id()))
    )
    WITH CHECK (
        public.is_super_admin() OR 
        (public.is_active_staff() AND (assigned_to = public.current_staff_id() OR created_by = public.current_staff_id()))
    );

CREATE POLICY "Super Admin can delete contacts"
    ON public.contacts FOR DELETE
    USING (public.is_super_admin());

CREATE POLICY "Staff can view assigned or created leads; Admin views all"
    ON public.leads FOR SELECT
    USING (
        public.is_super_admin() OR 
        (public.is_active_staff() AND (assigned_to = public.current_staff_id() OR created_by = public.current_staff_id()))
    );

CREATE POLICY "Active staff can insert leads"
    ON public.leads FOR INSERT
    WITH CHECK (public.is_active_staff());

CREATE POLICY "Staff can update assigned or created leads; Admin updates all"
    ON public.leads FOR UPDATE
    USING (
        public.is_super_admin() OR 
        (public.is_active_staff() AND (assigned_to = public.current_staff_id() OR created_by = public.current_staff_id()))
    )
    WITH CHECK (
        public.is_super_admin() OR 
        (public.is_active_staff() AND (assigned_to = public.current_staff_id() OR created_by = public.current_staff_id()))
    );

CREATE POLICY "Super Admin can delete leads"
    ON public.leads FOR DELETE
    USING (public.is_super_admin());

CREATE POLICY "Staff can view assigned or created follow-ups; Admin views all"
    ON public.follow_ups FOR SELECT
    USING (
        public.is_super_admin() OR 
        (public.is_active_staff() AND (assigned_to = public.current_staff_id() OR created_by = public.current_staff_id()))
    );

CREATE POLICY "Active staff can create follow-ups"
    ON public.follow_ups FOR INSERT
    WITH CHECK (public.is_active_staff());

CREATE POLICY "Staff can update assigned follow-ups; Admin updates all"
    ON public.follow_ups FOR UPDATE
    USING (
        public.is_super_admin() OR 
        (public.is_active_staff() AND (assigned_to = public.current_staff_id() OR created_by = public.current_staff_id()))
    );

CREATE POLICY "Super Admin can delete follow-ups"
    ON public.follow_ups FOR DELETE
    USING (public.is_super_admin());

CREATE POLICY "Active staff can view notes on accessible entities"
    ON public.customer_notes FOR SELECT
    USING (public.is_active_staff());

CREATE POLICY "Active staff can create notes"
    ON public.customer_notes FOR INSERT
    WITH CHECK (public.is_active_staff());

CREATE POLICY "Staff can view assigned projects; Admin views all"
    ON public.projects FOR SELECT
    USING (
        public.is_super_admin() OR 
        (public.is_active_staff() AND (assigned_salesperson = public.current_staff_id() OR created_by = public.current_staff_id()))
    );

CREATE POLICY "Active staff can create projects"
    ON public.projects FOR INSERT
    WITH CHECK (public.is_active_staff());

CREATE POLICY "Staff can update assigned projects; Admin updates all"
    ON public.projects FOR UPDATE
    USING (
        public.is_super_admin() OR 
        (public.is_active_staff() AND assigned_salesperson = public.current_staff_id())
    );

CREATE POLICY "Super Admin can delete projects"
    ON public.projects FOR DELETE
    USING (public.is_super_admin());

CREATE POLICY "Staff can view payments for accessible projects; Admin views all"
    ON public.payments FOR SELECT
    USING (
        public.is_super_admin() OR 
        (public.is_active_staff() AND EXISTS (
            SELECT 1 FROM public.projects p 
            WHERE p.id = project_id 
              AND (p.assigned_salesperson = public.current_staff_id() OR p.created_by = public.current_staff_id())
        ))
    );

CREATE POLICY "Active staff can record payments"
    ON public.payments FOR INSERT
    WITH CHECK (public.is_active_staff());

CREATE POLICY "Super Admin can manage payments"
    ON public.payments FOR ALL
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

CREATE POLICY "Super Admin can view activity logs"
    ON public.activity_logs FOR SELECT
    USING (public.is_super_admin());

CREATE POLICY "Active staff or triggers can append activity logs"
    ON public.activity_logs FOR INSERT
    WITH CHECK (public.is_active_staff());

CREATE POLICY "Disallow activity log updates"
    ON public.activity_logs FOR UPDATE
    USING (false);

CREATE POLICY "Disallow activity log deletions"
    ON public.activity_logs FOR DELETE
    USING (false);

-- 4. AUTOMATED AUDIT TRIGGERS
CREATE OR REPLACE FUNCTION public.audit_lead_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_actor_id UUID;
    v_actor_staff_id TEXT := 'SYSTEM';
    v_actor_name TEXT := 'System Automation';
    v_desc TEXT;
    v_action TEXT;
BEGIN
    v_actor_id := auth.uid();
    IF v_actor_id IS NOT NULL THEN
        SELECT staff_id, full_name INTO v_actor_staff_id, v_actor_name 
        FROM public.staff_profiles 
        WHERE id = v_actor_id;
    END IF;

    IF (TG_OP = 'INSERT') THEN
        v_action := 'CREATE';
        v_desc := coalesce(v_actor_staff_id, 'STAFF') || ' added new lead for ' || NEW.customer_name || ' (' || NEW.platform || ' @' || NEW.handle || ')';
        
        INSERT INTO public.activity_logs (
            actor_id, actor_staff_id, actor_name, 
            entity_type, entity_id, action, 
            description, new_values
        ) VALUES (
            v_actor_id, v_actor_staff_id, v_actor_name,
            'lead', NEW.id, v_action,
            v_desc, to_jsonb(NEW)
        );
        RETURN NEW;

    ELSIF (TG_OP = 'UPDATE') THEN
        IF (OLD.status IS DISTINCT FROM NEW.status) THEN
            v_action := 'STATUS_CHANGE';
            v_desc := coalesce(v_actor_staff_id, 'STAFF') || ' changed customer status from ' || OLD.status || ' to ' || NEW.status;
        ELSIF (OLD.is_converted IS FALSE AND NEW.is_converted IS TRUE) THEN
            v_action := 'CONVERT';
            v_desc := coalesce(v_actor_staff_id, 'STAFF') || ' converted lead ' || NEW.customer_name || ' into a confirmed customer';
        ELSIF (OLD.assigned_to IS DISTINCT FROM NEW.assigned_to) THEN
            v_action := 'REASSIGN';
            DECLARE
                v_new_assignee_name TEXT := 'unassigned';
            BEGIN
                IF NEW.assigned_to IS NOT NULL THEN
                    SELECT coalesce(staff_id || ' (' || full_name || ')', full_name) 
                    INTO v_new_assignee_name 
                    FROM public.staff_profiles 
                    WHERE id = NEW.assigned_to;
                END IF;
                v_desc := coalesce(v_actor_staff_id, 'STAFF') || ' reassigned lead ' || NEW.customer_name || ' to ' || v_new_assignee_name;
            END;
        ELSE
            v_action := 'UPDATE';
            v_desc := coalesce(v_actor_staff_id, 'STAFF') || ' updated lead details for ' || NEW.customer_name;
        END IF;

        INSERT INTO public.activity_logs (
            actor_id, actor_staff_id, actor_name, 
            entity_type, entity_id, action, 
            description, old_values, new_values
        ) VALUES (
            v_actor_id, v_actor_staff_id, v_actor_name,
            'lead', NEW.id, v_action,
            v_desc, to_jsonb(OLD), to_jsonb(NEW)
        );
        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_lead ON public.leads;
CREATE TRIGGER trg_audit_lead
AFTER INSERT OR UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.audit_lead_changes();

-- Projects Trigger
CREATE OR REPLACE FUNCTION public.audit_project_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_actor_id UUID;
    v_actor_staff_id TEXT := 'SYSTEM';
    v_actor_name TEXT := 'System Automation';
    v_desc TEXT;
    v_action TEXT;
BEGIN
    v_actor_id := auth.uid();
    IF v_actor_id IS NOT NULL THEN
        SELECT staff_id, full_name INTO v_actor_staff_id, v_actor_name 
        FROM public.staff_profiles 
        WHERE id = v_actor_id;
    END IF;

    IF (TG_OP = 'INSERT') THEN
        v_action := 'CREATE';
        v_desc := coalesce(v_actor_staff_id, 'STAFF') || ' created project "' || NEW.title || '" with agreed price ৳' || NEW.agreed_price_bdt;
        
        INSERT INTO public.activity_logs (
            actor_id, actor_staff_id, actor_name, 
            entity_type, entity_id, action, 
            description, new_values
        ) VALUES (
            v_actor_id, v_actor_staff_id, v_actor_name,
            'project', NEW.id, v_action,
            v_desc, to_jsonb(NEW)
        );
        RETURN NEW;

    ELSIF (TG_OP = 'UPDATE') THEN
        IF (OLD.stage IS DISTINCT FROM NEW.stage) THEN
            v_action := 'STATUS_CHANGE';
            v_desc := coalesce(v_actor_staff_id, 'STAFF') || ' moved project "' || NEW.title || '" stage to ' || NEW.stage;
        ELSE
            v_action := 'UPDATE';
            v_desc := coalesce(v_actor_staff_id, 'STAFF') || ' updated project "' || NEW.title || '"';
        END IF;

        INSERT INTO public.activity_logs (
            actor_id, actor_staff_id, actor_name, 
            entity_type, entity_id, action, 
            description, old_values, new_values
        ) VALUES (
            v_actor_id, v_actor_staff_id, v_actor_name,
            'project', NEW.id, v_action,
            v_desc, to_jsonb(OLD), to_jsonb(NEW)
        );
        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_project ON public.projects;
CREATE TRIGGER trg_audit_project
AFTER INSERT OR UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.audit_project_changes();

-- Payments Trigger
CREATE OR REPLACE FUNCTION public.audit_payment_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_actor_id UUID;
    v_actor_staff_id TEXT := 'SYSTEM';
    v_actor_name TEXT := 'System Automation';
    v_project_title TEXT := 'Project';
    v_desc TEXT;
BEGIN
    v_actor_id := auth.uid();
    IF v_actor_id IS NOT NULL THEN
        SELECT staff_id, full_name INTO v_actor_staff_id, v_actor_name 
        FROM public.staff_profiles 
        WHERE id = v_actor_id;
    END IF;

    SELECT title INTO v_project_title FROM public.projects WHERE id = NEW.project_id;

    IF (TG_OP = 'INSERT') THEN
        v_desc := coalesce(v_actor_staff_id, 'STAFF') || ' recorded ' || NEW.payment_type || ' payment of ৳' || NEW.amount_bdt || ' via ' || NEW.payment_method || ' for "' || coalesce(v_project_title, 'Project') || '"';
        
        INSERT INTO public.activity_logs (
            actor_id, actor_staff_id, actor_name, 
            entity_type, entity_id, action, 
            description, new_values
        ) VALUES (
            v_actor_id, v_actor_staff_id, v_actor_name,
            'payment', NEW.id, 'PAYMENT_RECORDED',
            v_desc, to_jsonb(NEW)
        );
        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_payment ON public.payments;
CREATE TRIGGER trg_audit_payment
AFTER INSERT ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.audit_payment_changes();

-- 5. DEFAULT PACKAGES SEED
INSERT INTO public.packages (name, code, base_price_bdt, description, features)
VALUES 
    (
        'Starter 2D Runner', 
        'PK-2D-RUNNER', 
        12000.00, 
        'Personalized endless runner featuring the client as the hero with custom obstacle graphics and music.',
        '["1 Custom Character Sprite", "Custom Endless Backdrop", "Theme Music & SFX", "High Score Leaderboard", "Web / Mobile Web APK"]'::jsonb
    ),
    (
        'Standard Arcade Challenge', 
        'PK-ARCADE', 
        18000.00, 
        'Action arcade tap game (Flappy / Dodging) with 2 skins, personalized powerups, and social share card.',
        '["2 Hero Costumes", "Custom Powerup Items", "Branded Intro Splash", "Audio Soundtrack", "Social Score Share Card"]'::jsonb
    ),
    (
        'Multi-Level Platformer Pro', 
        'PK-PLATFORMER-PRO', 
        35000.00, 
        'Classic side-scrolling adventure across 5 themed stages with story dialog and a custom boss showdown.',
        '["5 Handcrafted Stages", "Custom Boss Battle", "Narrative Dialog Bubbles", "Collectible Secrets", "Windows / Android Builds"]'::jsonb
    ),
    (
        'Custom Story RPG / Quest', 
        'PK-RPG-QUEST', 
        60000.00, 
        'Bespoke pixel or vector RPG with branching dialogues, inventory, customized avatars, and heartfelt ending.',
        '["Custom RPG World Map", "Branching Dialogue Trees", "Inventory & Equipment", "Original Soundtrack Theme", "Full Cross-Platform Export"]'::jsonb
    )
ON CONFLICT (code) DO NOTHING;

-- 6. ONE-TIME SUPER ADMIN BOOTSTRAP FUNCTION
CREATE OR REPLACE FUNCTION public.bootstrap_super_admin(
    p_staff_id TEXT,
    p_email TEXT,
    p_password TEXT,
    p_full_name TEXT DEFAULT 'TinyPlay Super Admin'
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_encrypted_pw TEXT;
    v_result JSONB;
BEGIN
    -- Check if user already exists
    SELECT id INTO v_user_id FROM auth.users WHERE email = lower(p_email);
    
    IF v_user_id IS NULL THEN
        v_user_id := gen_random_uuid();
        v_encrypted_pw := crypt(p_password, gen_salt('bf'));

        -- Insert into auth.users
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            created_at,
            updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            v_user_id,
            'authenticated',
            'authenticated',
            lower(p_email),
            v_encrypted_pw,
            now(),
            '{"provider": "email", "providers": ["email"]}'::jsonb,
            jsonb_build_object('full_name', p_full_name, 'staff_id', upper(p_staff_id)),
            false,
            now(),
            now()
        );

        -- Insert into auth.identities (Required by Supabase GoTrue Auth)
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            provider_id,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            v_user_id,
            v_user_id,
            jsonb_build_object('sub', v_user_id::text, 'email', lower(p_email)),
            'email',
            v_user_id::text,
            now(),
            now(),
            now()
        );
    END IF;

    -- Upsert into public.staff_profiles
    INSERT INTO public.staff_profiles (
        id,
        staff_id,
        full_name,
        email,
        role,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        v_user_id,
        upper(p_staff_id),
        p_full_name,
        lower(p_email),
        'SUPER_ADMIN',
        true,
        now(),
        now()
    )
    ON CONFLICT (id) DO UPDATE SET
        role = 'SUPER_ADMIN',
        is_active = true,
        staff_id = upper(p_staff_id),
        full_name = p_full_name,
        updated_at = now();

    v_result := jsonb_build_object(
        'status', 'SUCCESS',
        'message', 'Super Admin successfully bootstrapped',
        'user_id', v_user_id,
        'staff_id', upper(p_staff_id),
        'email', lower(p_email)
    );

    RETURN v_result;
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'status', 'ERROR',
        'message', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. AUTOMATICALLY BOOTSTRAP INITIAL SUPER ADMIN (ADMIN-001)
SELECT public.bootstrap_super_admin(
    'ADMIN-001',
    'admin-001.tinyplay@gmail.com',
    'password123',
    'Studio Super Admin'
);
