-- ====================================================================
-- TINYPLAY CRM — FULL EMAIL SUPPORT & PASSWORD RESETS VIA SUPABASE
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/smiebsuofiiewtwkospr/sql/new
-- ====================================================================

-- 1. Auto-confirm any pending unconfirmed users (e.g. sales-002)
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE email_confirmed_at IS NULL;

-- 2. Enhanced admin_create_staff: accepts custom email address for password resets
CREATE OR REPLACE FUNCTION public.admin_create_staff(
  p_staff_id TEXT,
  p_full_name TEXT,
  p_password TEXT,
  p_email TEXT DEFAULT NULL,
  p_role TEXT DEFAULT 'SALES',
  p_phone TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := gen_random_uuid();
  v_email TEXT;
  v_caller_role TEXT;
  v_clean_staff_id TEXT := UPPER(TRIM(p_staff_id));
BEGIN
  -- Verify caller is SUPER_ADMIN
  SELECT role INTO v_caller_role
  FROM public.staff_profiles
  WHERE id = auth.uid();

  IF v_caller_role != 'SUPER_ADMIN' THEN
    RAISE EXCEPTION 'Unauthorized: Only Super Admin can create staff accounts.';
  END IF;

  -- Format email: use provided email or derive fallback
  v_email := LOWER(TRIM(COALESCE(p_email, '')));
  IF v_email = '' OR v_email NOT LIKE '%@%' THEN
    v_email := LOWER(v_clean_staff_id) || '.tinyplay@gmail.com';
  END IF;

  -- Check duplicates
  IF EXISTS (SELECT 1 FROM public.staff_profiles WHERE staff_id = v_clean_staff_id) THEN
    RAISE EXCEPTION 'Staff ID % already exists in TinyPlay CRM.', v_clean_staff_id;
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
    RAISE EXCEPTION 'Email % is already registered to an account.', v_email;
  END IF;

  -- Insert into auth.users (Pre-confirmed so they can sign in and receive reset emails)
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
    v_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    jsonb_build_object('full_name', p_full_name, 'staff_id', v_clean_staff_id, 'role', p_role),
    false,
    now(),
    now()
  );

  -- Insert into auth.identities
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
    jsonb_build_object('sub', v_user_id::text, 'email', v_email),
    'email',
    v_user_id::text,
    now(),
    now(),
    now()
  );

  -- Insert into public.staff_profiles
  INSERT INTO public.staff_profiles (
    id,
    staff_id,
    full_name,
    email,
    role,
    is_active,
    phone,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_clean_staff_id,
    p_full_name,
    v_email,
    p_role,
    true,
    p_phone,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    staff_id = EXCLUDED.staff_id,
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone,
    is_active = true;

  RETURN jsonb_build_object(
    'id', v_user_id,
    'staff_id', v_clean_staff_id,
    'full_name', p_full_name,
    'email', v_email,
    'role', p_role,
    'is_active', true,
    'phone', p_phone,
    'created_at', now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Delete Staff RPC: Purges user from both staff_profiles and auth.users
CREATE OR REPLACE FUNCTION public.admin_delete_staff(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_caller_role TEXT;
BEGIN
  SELECT role INTO v_caller_role FROM public.staff_profiles WHERE id = auth.uid();
  IF v_caller_role != 'SUPER_ADMIN' THEN
    RAISE EXCEPTION 'Unauthorized: Only Super Admin can delete staff.';
  END IF;

  DELETE FROM public.staff_profiles WHERE id = p_user_id;
  DELETE FROM auth.identities WHERE user_id = p_user_id;
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
