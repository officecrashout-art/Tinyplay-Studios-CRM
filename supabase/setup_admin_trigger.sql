-- ====================================================================
-- SUPABASE CLEANUP & AUTH SYNC SETUP
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/smiebsuofiiewtwkospr/sql
-- ====================================================================

-- 1. Remove the broken manually-inserted record
DELETE FROM public.staff_profiles WHERE staff_id = 'ADMIN-001' OR email LIKE '%admin%';
DELETE FROM auth.identities WHERE identity_data->>'email' LIKE '%admin%' OR provider_id LIKE '%admin%';
DELETE FROM auth.users WHERE email LIKE '%admin%';

-- 2. Helper function to look up email by Staff ID for login
CREATE OR REPLACE FUNCTION public.get_staff_email_for_login(p_staff_id text)
RETURNS text AS $$
DECLARE
  v_email text;
BEGIN
  SELECT email INTO v_email
  FROM public.staff_profiles
  WHERE staff_id = upper(trim(p_staff_id))
    AND is_active = true
  LIMIT 1;

  RETURN v_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Automatic Trigger to link any newly created Auth user to staff_profiles
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.staff_profiles (id, staff_id, full_name, email, role, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'staff_id', 'ADMIN-001'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Studio Super Admin'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'SUPER_ADMIN'),
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    staff_id = EXCLUDED.staff_id,
    role = EXCLUDED.role,
    is_active = true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
