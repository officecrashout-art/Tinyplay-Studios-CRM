-- ====================================================================
-- TINYPLAY CRM — MAKE ALL USERS PEAK (ONE-CLICK SUPABASE PROVISIONING)
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/smiebsuofiiewtwkospr/sql/new
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Helper procedure to safely create or link any staff user in Supabase Auth
CREATE OR REPLACE FUNCTION public._sync_peak_user(
  p_staff_id TEXT,
  p_full_name TEXT,
  p_email TEXT,
  p_role TEXT,
  p_default_password TEXT,
  p_phone TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_user_id UUID;
  v_clean_staff_id TEXT := UPPER(TRIM(p_staff_id));
  v_clean_email TEXT := LOWER(TRIM(p_email));
BEGIN
  -- Check if user already exists in auth.users by email
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = v_clean_email LIMIT 1;

  -- If not found by email, check if exists by staff_profiles staff_id
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id FROM public.staff_profiles WHERE staff_id = v_clean_staff_id LIMIT 1;
  END IF;

  IF v_user_id IS NOT NULL THEN
    -- User already exists: update and ensure confirmed
    UPDATE auth.users
    SET 
      email = v_clean_email,
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      raw_user_meta_data = jsonb_build_object(
        'full_name', p_full_name,
        'staff_id', v_clean_staff_id,
        'role', p_role
      ),
      updated_at = now()
    WHERE id = v_user_id;

    -- Update or create identity
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (
      v_user_id,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_clean_email),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    )
    ON CONFLICT (provider, provider_id) DO UPDATE SET
      identity_data = jsonb_build_object('sub', v_user_id::text, 'email', v_clean_email),
      updated_at = now();

  ELSE
    -- User does not exist: create brand new confirmed user
    v_user_id := gen_random_uuid();

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
      v_clean_email,
      crypt(p_default_password, gen_salt('bf')),
      now(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('full_name', p_full_name, 'staff_id', v_clean_staff_id, 'role', p_role),
      false,
      now(),
      now()
    );

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (
      v_user_id,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_clean_email),
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
    phone,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_clean_staff_id,
    p_full_name,
    v_clean_email,
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
    is_active = true,
    phone = COALESCE(EXCLUDED.phone, public.staff_profiles.phone),
    updated_at = now();

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Provision / Sync All 5 Accounts from your Staff Roster
-- Default initial password for all sales accounts: TinyplaySales2026! (they can reset it via email anytime)
SELECT public._sync_peak_user('ADMIN-001', 'Admin', 'officecrashout@gmail.com', 'SUPER_ADMIN', 'TinyplayAdmin2026!', '+8801910693101');
SELECT public._sync_peak_user('SALES-001', 'Ramisa', 'kneejhum0@gmail.com', 'SALES', 'TinyplaySales2026!');
SELECT public._sync_peak_user('SALES-002', 'Raida', 'nasibaraida495@gmail.com', 'SALES', 'TinyplaySales2026!');
SELECT public._sync_peak_user('SALES-003', 'Esha', 'sales-003@staff.tinyplaystudioz.internal', 'SALES', 'TinyplaySales2026!');
SELECT public._sync_peak_user('SALES-004', 'Nishat', 'jamlessmochi201@gmail.com', 'SALES', 'TinyplaySales2026!');

-- Cleanup temporary helper function
DROP FUNCTION IF EXISTS public._sync_peak_user(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

-- Drop existing functions first to avoid PostgreSQL 42P13 return type conflict
DROP FUNCTION IF EXISTS public.admin_change_staff_password(text, text);
DROP FUNCTION IF EXISTS public.admin_delete_staff(uuid);
DROP FUNCTION IF EXISTS public.admin_create_staff(text, text, text, text, text, text);
DROP FUNCTION IF EXISTS public.admin_create_staff(text, text, text, text, text);
DROP FUNCTION IF EXISTS public.admin_create_staff(text, text, text, text);
DROP FUNCTION IF EXISTS public.get_staff_email_for_login(text);

-- 3. Ensure Login Helper Function works for Staff IDs and Emails
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

-- 4. In-CRM Super Admin Provisioning RPC with Custom Email
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
  SELECT role INTO v_caller_role FROM public.staff_profiles WHERE id = auth.uid();
  IF v_caller_role != 'SUPER_ADMIN' THEN
    RAISE EXCEPTION 'Unauthorized: Only Super Admin can create staff accounts.';
  END IF;

  v_email := LOWER(TRIM(COALESCE(p_email, '')));
  IF v_email = '' OR v_email NOT LIKE '%@%' THEN
    v_email := LOWER(v_clean_staff_id) || '.tinyplay@gmail.com';
  END IF;

  IF EXISTS (SELECT 1 FROM public.staff_profiles WHERE staff_id = v_clean_staff_id) THEN
    RAISE EXCEPTION 'Staff ID % already exists in TinyPlay CRM.', v_clean_staff_id;
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
    RAISE EXCEPTION 'Email % is already registered.', v_email;
  END IF;

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
    v_email, crypt(p_password, gen_salt('bf')), now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    jsonb_build_object('full_name', p_full_name, 'staff_id', v_clean_staff_id, 'role', p_role),
    false, now(), now()
  );

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (v_user_id, v_user_id, jsonb_build_object('sub', v_user_id::text, 'email', v_email), 'email', v_user_id::text, now(), now(), now());

  INSERT INTO public.staff_profiles (id, staff_id, full_name, email, role, is_active, phone, created_at, updated_at)
  VALUES (v_user_id, v_clean_staff_id, p_full_name, v_email, p_role, true, p_phone, now(), now());

  RETURN jsonb_build_object('id', v_user_id, 'staff_id', v_clean_staff_id, 'full_name', p_full_name, 'email', v_email, 'role', p_role, 'is_active', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Complete Account Deletion RPC
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

-- 6. Direct Password Reset RPC by Super Admin
CREATE OR REPLACE FUNCTION public.admin_change_staff_password(
  p_staff_id TEXT,
  p_new_password TEXT
)
RETURNS void AS $$
DECLARE
  v_caller_role TEXT;
  v_target_user_id UUID;
BEGIN
  SELECT role INTO v_caller_role FROM public.staff_profiles WHERE id = auth.uid();
  IF v_caller_role != 'SUPER_ADMIN' THEN
    RAISE EXCEPTION 'Unauthorized: Only Super Admin can change staff passwords.';
  END IF;

  SELECT id INTO v_target_user_id FROM public.staff_profiles WHERE staff_id = upper(trim(p_staff_id));
  IF v_target_user_id IS NULL THEN
    RAISE EXCEPTION 'Staff ID % not found.', upper(trim(p_staff_id));
  END IF;

  UPDATE auth.users
  SET encrypted_password = crypt(p_new_password, gen_salt('bf')),
      updated_at = now()
  WHERE id = v_target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
