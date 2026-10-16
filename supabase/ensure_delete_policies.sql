-- ============================================================================
-- TinyPlay Studioz CRM: Super Admin Delete Permissions & Cascade Verification
-- Run this in your Supabase Project -> SQL Editor
-- ============================================================================

-- 1. Ensure Super Admin detection function exists and is stable
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

-- 2. LEADS: Super Admin Delete Policy
DROP POLICY IF EXISTS "Super Admin can delete leads" ON public.leads;
CREATE POLICY "Super Admin can delete leads"
    ON public.leads FOR DELETE
    USING (public.is_super_admin());

-- 3. CONTACTS (Customers): Super Admin Delete Policy
DROP POLICY IF EXISTS "Super Admin can delete contacts" ON public.contacts;
CREATE POLICY "Super Admin can delete contacts"
    ON public.contacts FOR DELETE
    USING (public.is_super_admin());

-- 4. PROJECTS: Super Admin Delete Policy
DROP POLICY IF EXISTS "Super Admin can delete projects" ON public.projects;
CREATE POLICY "Super Admin can delete projects"
    ON public.projects FOR DELETE
    USING (public.is_super_admin());

-- 5. PAYMENTS: Super Admin Delete & Manage Policy
DROP POLICY IF EXISTS "Super Admin can manage payments" ON public.payments;
DROP POLICY IF EXISTS "Super Admin can delete payments" ON public.payments;
CREATE POLICY "Super Admin can manage payments"
    ON public.payments FOR ALL
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- 6. FOLLOW-UPS: Super Admin Delete Policy
DROP POLICY IF EXISTS "Super Admin can delete follow-ups" ON public.follow_ups;
CREATE POLICY "Super Admin can delete follow-ups"
    ON public.follow_ups FOR DELETE
    USING (public.is_super_admin());

-- 7. CUSTOMER NOTES: Super Admin Delete Policy
DROP POLICY IF EXISTS "Super Admin can delete customer notes" ON public.customer_notes;
CREATE POLICY "Super Admin can delete customer notes"
    ON public.customer_notes FOR DELETE
    USING (public.is_super_admin());

-- 8. PACKAGES: Super Admin Delete & Manage Policy
DROP POLICY IF EXISTS "Super Admin can manage packages" ON public.packages;
CREATE POLICY "Super Admin can manage packages"
    ON public.packages FOR ALL
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- 9. STAFF PROFILES: Super Admin Delete Policy
DROP POLICY IF EXISTS "Super Admin can delete staff profiles" ON public.staff_profiles;
CREATE POLICY "Super Admin can delete staff profiles"
    ON public.staff_profiles FOR DELETE
    USING (public.is_super_admin());

-- 10. IMMUTABLE AUDIT LOGS: Confirm nobody can delete security audit logs
DROP POLICY IF EXISTS "Disallow activity log deletions" ON public.activity_logs;
CREATE POLICY "Disallow activity log deletions"
    ON public.activity_logs FOR DELETE
    USING (false);
