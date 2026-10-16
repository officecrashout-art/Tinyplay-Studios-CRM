-- ====================================================================
-- TINYPLAY CRM: SYNC AUTH USERS & ENABLE DELETIONS / EDITS
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/smiebsuofiiewtwkospr/sql/new
-- ====================================================================

-- 1. Auto-confirm any pending emails (e.g. sales-002 waiting for verification)
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE email_confirmed_at IS NULL;

-- 2. Sync all existing users from auth.users (Tanvir Hossain, ramisa, etc.) into public.staff_profiles
INSERT INTO public.staff_profiles (id, staff_id, full_name, email, role, is_active)
SELECT 
  u.id,
  COALESCE(
    NULLIF(TRIM(u.raw_user_meta_data->>'staff_id'), ''),
    UPPER(SPLIT_PART(u.email, '.', 1)),
    UPPER(SPLIT_PART(u.email, '@', 1)),
    'STAFF-' || SUBSTRING(u.id::text FROM 1 FOR 6)
  ),
  COALESCE(
    NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(u.raw_user_meta_data->>'name'), ''),
    INITCAP(REPLACE(SPLIT_PART(u.email, '@', 1), '.', ' ')),
    'Sales Representative'
  ),
  u.email,
  COALESCE(NULLIF(TRIM(u.raw_user_meta_data->>'role'), ''), 'SALES'),
  true
FROM auth.users u
ON CONFLICT (id) DO UPDATE SET
  staff_id = EXCLUDED.staff_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  role = CASE 
    WHEN public.staff_profiles.role = 'SUPER_ADMIN' THEN 'SUPER_ADMIN' 
    ELSE EXCLUDED.role 
  END,
  is_active = true;

-- 3. Create secure RPC for Super Admin to delete staff accounts completely (auth.users + staff_profiles)
CREATE OR REPLACE FUNCTION public.admin_delete_staff(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_caller_role TEXT;
BEGIN
  -- Verify caller is SUPER_ADMIN
  SELECT role INTO v_caller_role FROM public.staff_profiles WHERE id = auth.uid();
  IF v_caller_role != 'SUPER_ADMIN' THEN
    RAISE EXCEPTION 'Unauthorized: Only Super Admin can delete staff.';
  END IF;

  -- Delete from profiles and auth
  DELETE FROM public.staff_profiles WHERE id = p_user_id;
  DELETE FROM auth.identities WHERE user_id = p_user_id;
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Ensure future users created in Supabase Auth automatically sync with proper role
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger AS $$
DECLARE
  v_staff_id TEXT;
  v_role TEXT;
  v_name TEXT;
BEGIN
  v_staff_id := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'staff_id'), ''),
    UPPER(SPLIT_PART(NEW.email, '.', 1)),
    UPPER(SPLIT_PART(NEW.email, '@', 1)),
    'STAFF-' || SUBSTRING(NEW.id::text FROM 1 FOR 6)
  );

  v_staff_id := UPPER(TRIM(v_staff_id));

  IF EXISTS (SELECT 1 FROM public.staff_profiles WHERE staff_id = v_staff_id AND id != NEW.id) THEN
    v_staff_id := v_staff_id || '-' || SUBSTRING(NEW.id::text FROM 1 FOR 4);
  END IF;

  v_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    INITCAP(REPLACE(SPLIT_PART(NEW.email, '@', 1), '.', ' ')),
    'Sales Representative'
  );

  v_role := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'role'), ''), 'SALES');
  IF v_role NOT IN ('SUPER_ADMIN', 'SALES') THEN
    v_role := 'SALES';
  END IF;

  INSERT INTO public.staff_profiles (id, staff_id, full_name, email, role, is_active)
  VALUES (NEW.id, v_staff_id, v_name, NEW.email, v_role, true)
  ON CONFLICT (id) DO UPDATE SET
    staff_id = EXCLUDED.staff_id,
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    is_active = true;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
