-- ====================================================================
-- FIX & RE-BOOTSTRAP SUPER ADMIN (ADMIN-001)
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/smiebsuofiiewtwkospr/sql
-- ====================================================================

DO $$
DECLARE
  v_user_id UUID := gen_random_uuid();
  v_email TEXT := 'admin-001.tinyplay@gmail.com';
  v_pw TEXT := 'password123';
BEGIN
  -- 1. Remove any old conflicting rows
  DELETE FROM public.staff_profiles WHERE staff_id = 'ADMIN-001' OR email = v_email OR email LIKE '%admin%';
  DELETE FROM auth.identities WHERE identity_data->>'email' = v_email OR identity_data->>'email' LIKE '%admin%';
  DELETE FROM auth.users WHERE email = v_email OR email LIKE '%admin%';

  -- 2. Create user in auth.users
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
    crypt(v_pw, gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "Studio Super Admin", "staff_id": "ADMIN-001"}'::jsonb,
    false,
    now(),
    now()
  );

  -- 3. Create identity in auth.identities (id is UUID in Supabase)
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

  -- 4. Create the corresponding staff_profile
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
    'ADMIN-001',
    'Studio Super Admin',
    v_email,
    'SUPER_ADMIN',
    true,
    now(),
    now()
  );

  RAISE NOTICE 'Super Admin successfully bootstrapped: ADMIN-001 with ID %', v_user_id;
END $$;
