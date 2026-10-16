-- ====================================================================
-- FIX: PERMANENTLY RESOLVE "Database error creating new user"
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/smiebsuofiiewtwkospr/sql/new
-- ====================================================================

-- 1. Replace the broken trigger function with a smart, collision-free handler
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger AS $$
DECLARE
  v_staff_id TEXT;
  v_role TEXT;
  v_name TEXT;
BEGIN
  -- Extract staff_id from metadata or derive from email prefix
  v_staff_id := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'staff_id'), ''),
    UPPER(SPLIT_PART(NEW.email, '.', 1)),
    UPPER(SPLIT_PART(NEW.email, '@', 1)),
    'STAFF-' || SUBSTRING(NEW.id::text FROM 1 FOR 6)
  );

  -- Clean up staff_id
  v_staff_id := UPPER(TRIM(v_staff_id));

  -- Prevent duplicate staff_id collision with existing users
  IF EXISTS (SELECT 1 FROM public.staff_profiles WHERE staff_id = v_staff_id AND id != NEW.id) THEN
    v_staff_id := v_staff_id || '-' || SUBSTRING(NEW.id::text FROM 1 FOR 4);
  END IF;

  -- Extract or derive full name
  v_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    INITCAP(REPLACE(SPLIT_PART(NEW.email, '@', 1), '.', ' ')),
    'Sales Representative'
  );

  -- Extract role (default to SALES for safety)
  v_role := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'role'), ''),
    'SALES'
  );

  -- Ensure role is valid
  IF v_role NOT IN ('SUPER_ADMIN', 'SALES') THEN
    v_role := 'SALES';
  END IF;

  -- Insert or update staff_profiles without throwing constraint errors
  INSERT INTO public.staff_profiles (id, staff_id, full_name, email, role, is_active)
  VALUES (
    NEW.id,
    v_staff_id,
    v_name,
    NEW.email,
    v_role,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    staff_id = EXCLUDED.staff_id,
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    is_active = true;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Re-attach trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
