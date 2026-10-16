-- ====================================================================
-- TINYPLAY CRM — ONE-CLICK STAFF CREATION & PASSWORD MANAGEMENT HELPER
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/smiebsuofiiewtwkospr/sql
-- ====================================================================

-- 1. Helper Function: Allows Super Admin to create new staff accounts directly from the CRM UI
CREATE OR REPLACE FUNCTION public.admin_create_staff(
  p_staff_id TEXT,
  p_full_name TEXT,
  p_password TEXT,
  p_role TEXT DEFAULT 'SALES',
  p_phone TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := gen_random_uuid();
  v_email TEXT;
  v_caller_role TEXT;
  v_result JSONB;
BEGIN
  -- Verify caller is SUPER_ADMIN
  SELECT role INTO v_caller_role
  FROM public.staff_profiles
  WHERE id = auth.uid();

  IF v_caller_role != 'SUPER_ADMIN' THEN
    RAISE EXCEPTION 'Unauthorized: Only Super Admin can create staff accounts.';
  END IF;

  v_email := lower(trim(p_staff_id)) || '.tinyplay@gmail.com';

  -- Check duplicate
  IF EXISTS (SELECT 1 FROM public.staff_profiles WHERE staff_id = upper(trim(p_staff_id))) THEN
    RAISE EXCEPTION 'Staff ID % already exists in TinyPlay CRM.', upper(trim(p_staff_id));
  END IF;

  -- Insert into auth.users (Pre-confirmed email)
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
    jsonb_build_object('full_name', p_full_name, 'staff_id', upper(trim(p_staff_id)), 'role', p_role),
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

  -- Insert into public.staff_profiles (Handles trigger conflict gracefully)
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
    upper(trim(p_staff_id)),
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
    is_active = EXCLUDED.is_active,
    phone = EXCLUDED.phone,
    updated_at = now();

  SELECT jsonb_build_object(
    'id', v_user_id,
    'staff_id', upper(trim(p_staff_id)),
    'full_name', p_full_name,
    'email', v_email,
    'role', p_role,
    'is_active', true
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Helper Function: Allows Super Admin to reset staff passwords directly from the CRM UI
CREATE OR REPLACE FUNCTION public.admin_change_staff_password(
  p_staff_id TEXT,
  p_new_password TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_caller_role TEXT;
  v_target_user_id UUID;
BEGIN
  SELECT role INTO v_caller_role
  FROM public.staff_profiles
  WHERE id = auth.uid();

  IF v_caller_role != 'SUPER_ADMIN' THEN
    RAISE EXCEPTION 'Unauthorized: Only Super Admin can change staff passwords.';
  END IF;

  SELECT id INTO v_target_user_id
  FROM public.staff_profiles
  WHERE staff_id = upper(trim(p_staff_id));

  IF v_target_user_id IS NULL THEN
    RAISE EXCEPTION 'Staff ID % not found.', upper(trim(p_staff_id));
  END IF;

  UPDATE auth.users
  SET encrypted_password = crypt(p_new_password, gen_salt('bf')),
      updated_at = now()
  WHERE id = v_target_user_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
