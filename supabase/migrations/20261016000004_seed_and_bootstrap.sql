-- Migration 004: Seed Data & One-Time Super Admin Bootstrap Procedure

-- 1. Insert Default Packages
INSERT INTO public.packages (name, code, base_price_bdt, description, features)
VALUES 
    (
        'Starter 2D Runner', 
        'PK-2D-RUNNER', 
        12000.00, 
        'Personalized endless runner featuring the client as the hero with custom obstacle graphics and music.',
        '["1 Custom Character Sprite", "Custom Endless Backdrop", "Theme Music & SFX", "High Score Leaderboard", "Web / Mobile Web APK"]'::jsonb
    ),
    (
        'Standard Arcade Challenge', 
        'PK-ARCADE', 
        18000.00, 
        'Action arcade tap game (Flappy / Dodging) with 2 skins, personalized powerups, and social share card.',
        '["2 Hero Costumes", "Custom Powerup Items", "Branded Intro Splash", "Audio Soundtrack", "Social Score Share Card"]'::jsonb
    ),
    (
        'Multi-Level Platformer Pro', 
        'PK-PLATFORMER-PRO', 
        35000.00, 
        'Classic side-scrolling adventure across 5 themed stages with story dialog and a custom boss showdown.',
        '["5 Handcrafted Stages", "Custom Boss Battle", "Narrative Dialog Bubbles", "Collectible Secrets", "Windows / Android Builds"]'::jsonb
    ),
    (
        'Custom Story RPG / Quest', 
        'PK-RPG-QUEST', 
        60000.00, 
        'Bespoke pixel or vector RPG with branching dialogues, inventory, customized avatars, and heartfelt ending.',
        '["Custom RPG World Map", "Branching Dialogue Trees", "Inventory & Equipment", "Original Soundtrack Theme", "Full Cross-Platform Export"]'::jsonb
    )
ON CONFLICT (code) DO NOTHING;

-- 2. One-Time Super Admin Bootstrap Function
-- This function can be run directly from the Supabase SQL Editor to safely bootstrap the first Super Admin.
CREATE OR REPLACE FUNCTION public.bootstrap_super_admin(
    p_staff_id TEXT,
    p_email TEXT,
    p_password TEXT,
    p_full_name TEXT DEFAULT 'TinyPlay Super Admin'
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_encrypted_pw TEXT;
    v_result JSONB;
BEGIN
    -- Check if user already exists
    SELECT id INTO v_user_id FROM auth.users WHERE email = lower(p_email);
    
    IF v_user_id IS NULL THEN
        v_user_id := gen_random_uuid();
        v_encrypted_pw := crypt(p_password, gen_salt('bf'));

        -- Insert into auth.users
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
            created_at,
            updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            v_user_id,
            'authenticated',
            'authenticated',
            lower(p_email),
            v_encrypted_pw,
            now(),
            '{"provider": "email", "providers": ["email"]}'::jsonb,
            jsonb_build_object('full_name', p_full_name, 'staff_id', upper(p_staff_id)),
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
        created_at,
        updated_at
    ) VALUES (
        v_user_id,
        upper(p_staff_id),
        p_full_name,
        lower(p_email),
        'SUPER_ADMIN',
        true,
        now(),
        now()
    )
    ON CONFLICT (id) DO UPDATE SET
        role = 'SUPER_ADMIN',
        is_active = true,
        staff_id = upper(p_staff_id),
        full_name = p_full_name,
        updated_at = now();

    v_result := jsonb_build_object(
        'status', 'SUCCESS',
        'message', 'Super Admin successfully bootstrapped',
        'user_id', v_user_id,
        'staff_id', upper(p_staff_id),
        'email', lower(p_email)
    );

    RETURN v_result;
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'status', 'ERROR',
        'message', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
