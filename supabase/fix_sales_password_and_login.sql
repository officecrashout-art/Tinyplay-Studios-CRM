-- ====================================================================
-- TINYPLAY CRM — FIX "INVALID CREDENTIALS" / SCHEMA ERROR ON LOGIN
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/smiebsuofiiewtwkospr/sql/new
-- ====================================================================

-- 1. CRITICAL: Fix all NULL token columns in auth.users that cause
--    Supabase GoTrue to crash with "500: Database error querying schema"
--    and display "Invalid credentials"
UPDATE auth.users
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  email_change = COALESCE(email_change, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  reauthentication_token = COALESCE(reauthentication_token, ''),
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  updated_at = now();

-- 2. Ensure auth.identities exist for all staff users so email sign-in works
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
SELECT 
  u.id, 
  u.id, 
  jsonb_build_object('sub', u.id::text, 'email', u.email), 
  'email', 
  u.id::text, 
  now(), 
  now(), 
  now()
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM auth.identities i WHERE i.user_id = u.id AND i.provider = 'email'
);

-- 3. Drop old functions to avoid return type conflicts
DROP FUNCTION IF EXISTS public.admin_change_staff_password(text, text);
DROP FUNCTION IF EXISTS public.get_staff_email_for_login(text);

-- 4. Update get_staff_email_for_login to support Staff ID (SALES-001, sales-1, sales1, etc.), full name, or email
CREATE OR REPLACE FUNCTION public.get_staff_email_for_login(p_staff_id TEXT)
RETURNS TEXT AS $$
DECLARE
  v_email TEXT;
  v_clean TEXT := LOWER(TRIM(p_staff_id));
  v_num TEXT;
BEGIN
  -- A. Exact staff_id match
  SELECT email INTO v_email
  FROM public.staff_profiles
  WHERE LOWER(TRIM(staff_id)) = v_clean
    AND is_active = true
  LIMIT 1;

  -- B. Flexible format: e.g. "sales1", "sales-1", "sales 01" -> "SALES-001"
  IF v_email IS NULL THEN
    v_num := REGEXP_REPLACE(v_clean, '[^0-9]', '', 'g');
    IF v_num != '' THEN
      IF v_clean LIKE '%sales%' THEN
        SELECT email INTO v_email
        FROM public.staff_profiles
        WHERE staff_id = 'SALES-' || LPAD(v_num, 3, '0')
          AND is_active = true
        LIMIT 1;
      ELSIF v_clean LIKE '%admin%' THEN
        SELECT email INTO v_email
        FROM public.staff_profiles
        WHERE staff_id = 'ADMIN-' || LPAD(v_num, 3, '0')
          AND is_active = true
        LIMIT 1;
      END IF;
    END IF;
  END IF;

  -- C. Match full name (e.g. "Ramisa", "Raida", "Esha", "Nishat")
  IF v_email IS NULL THEN
    SELECT email INTO v_email
    FROM public.staff_profiles
    WHERE LOWER(TRIM(full_name)) ILIKE '%' || v_clean || '%'
      AND is_active = true
    LIMIT 1;
  END IF;

  -- D. Match email directly
  IF v_email IS NULL THEN
    SELECT email INTO v_email
    FROM public.staff_profiles
    WHERE LOWER(TRIM(email)) = v_clean
      AND is_active = true
    LIMIT 1;
  END IF;

  RETURN v_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Update admin_change_staff_password to also sanitize token columns on every password update
CREATE OR REPLACE FUNCTION public.admin_change_staff_password(
  p_staff_id TEXT,
  p_new_password TEXT
)
RETURNS void AS $$
DECLARE
  v_caller_role TEXT;
  v_target_user_id UUID;
  v_clean_staff_id TEXT := UPPER(TRIM(p_staff_id));
BEGIN
  -- Verify caller role if authenticated in Supabase
  IF auth.uid() IS NOT NULL THEN
    SELECT role INTO v_caller_role FROM public.staff_profiles WHERE id = auth.uid();
    IF v_caller_role != 'SUPER_ADMIN' THEN
      RAISE EXCEPTION 'Unauthorized: Only Super Admin can change staff passwords.';
    END IF;
  END IF;

  -- Find user by staff_id or id
  SELECT id INTO v_target_user_id 
  FROM public.staff_profiles 
  WHERE staff_id = v_clean_staff_id 
     OR id::text = p_staff_id;

  -- Fallback: check by email or name
  IF v_target_user_id IS NULL THEN
    SELECT id INTO v_target_user_id 
    FROM public.staff_profiles 
    WHERE LOWER(TRIM(email)) = LOWER(TRIM(p_staff_id))
       OR LOWER(TRIM(full_name)) = LOWER(TRIM(p_staff_id));
  END IF;

  IF v_target_user_id IS NULL THEN
    RAISE EXCEPTION 'Staff member % not found.', p_staff_id;
  END IF;

  -- Update encrypted password and ensure all GoTrue token columns are empty strings (not NULL)
  UPDATE auth.users
  SET encrypted_password = crypt(p_new_password, gen_salt('bf')),
      confirmation_token = COALESCE(confirmation_token, ''),
      recovery_token = COALESCE(recovery_token, ''),
      email_change_token_new = COALESCE(email_change_token_new, ''),
      email_change_token_current = COALESCE(email_change_token_current, ''),
      email_change = COALESCE(email_change, ''),
      phone_change = COALESCE(phone_change, ''),
      phone_change_token = COALESCE(phone_change_token, ''),
      reauthentication_token = COALESCE(reauthentication_token, ''),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      updated_at = now()
  WHERE id = v_target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Set default initial passwords if you want to ensure all sales accounts are known:
SELECT public.admin_change_staff_password('SALES-001', 'TinyplaySales2026!');
SELECT public.admin_change_staff_password('SALES-002', 'TinyplaySales2026!');
SELECT public.admin_change_staff_password('SALES-003', 'TinyplaySales2026!');
SELECT public.admin_change_staff_password('SALES-004', 'TinyplaySales2026!');
