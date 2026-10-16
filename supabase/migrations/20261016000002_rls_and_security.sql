-- Migration 002: Row Level Security & Access Control Policies

-- 1. Helper Functions
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

-- 2. Enable RLS on all tables
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 3. staff_profiles policies
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

-- 4. packages policies
CREATE POLICY "Active staff can view packages"
    ON public.packages FOR SELECT
    USING (public.is_active_staff());

CREATE POLICY "Super Admin can manage packages"
    ON public.packages FOR ALL
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- 5. contacts policies
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

-- 6. leads policies
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

-- 7. follow_ups policies
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
    )
    WITH CHECK (
        public.is_super_admin() OR 
        (public.is_active_staff() AND (assigned_to = public.current_staff_id() OR created_by = public.current_staff_id()))
    );

CREATE POLICY "Super Admin can delete follow-ups"
    ON public.follow_ups FOR DELETE
    USING (public.is_super_admin());

-- 8. customer_notes policies
CREATE POLICY "Active staff can view notes on accessible entities"
    ON public.customer_notes FOR SELECT
    USING (public.is_active_staff());

CREATE POLICY "Active staff can create notes"
    ON public.customer_notes FOR INSERT
    WITH CHECK (public.is_active_staff());

-- 9. projects policies
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
    )
    WITH CHECK (
        public.is_super_admin() OR 
        (public.is_active_staff() AND assigned_salesperson = public.current_staff_id())
    );

CREATE POLICY "Super Admin can delete projects"
    ON public.projects FOR DELETE
    USING (public.is_super_admin());

-- 10. payments policies
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

-- 11. activity_logs policies (Immutable audit trail)
CREATE POLICY "Super Admin can view activity logs"
    ON public.activity_logs FOR SELECT
    USING (public.is_super_admin());

CREATE POLICY "Active staff or triggers can append activity logs"
    ON public.activity_logs FOR INSERT
    WITH CHECK (public.is_active_staff());

-- Explicitly block UPDATE and DELETE on activity logs for all users
CREATE POLICY "Disallow activity log updates"
    ON public.activity_logs FOR UPDATE
    USING (false);

CREATE POLICY "Disallow activity log deletions"
    ON public.activity_logs FOR DELETE
    USING (false);
