// Supabase Edge Function: manage-staff
// Privileged administrative actions for Super Admin only
// Uses Deno standard serve and @supabase/supabase-js

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing Supabase configuration in environment");
    }

    // Verify caller's JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const userClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Admin Client with Service Role Key
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Check if caller is SUPER_ADMIN
    const { data: callerProfile, error: profileError } = await adminClient
      .from("staff_profiles")
      .select("role, is_active, staff_id")
      .eq("id", user.id)
      .single();

    if (profileError || !callerProfile || callerProfile.role !== "SUPER_ADMIN" || !callerProfile.is_active) {
      return new Response(
        JSON.stringify({ error: "Forbidden: Only active Super Admins can manage staff" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { action } = body;

    // 1. ACTION: create_staff
    if (action === "create_staff") {
      const { staff_id, full_name, password, phone, role = "SALES" } = body;

      if (!staff_id || !full_name || !password) {
        return new Response(
          JSON.stringify({ error: "staff_id, full_name, and password are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const cleanStaffId = staff_id.trim().toUpperCase();
      const internalEmail = `${cleanStaffId.toLowerCase()}@staff.tinyplaystudioz.internal`;

      // Check if staff ID already exists
      const { data: existingStaff } = await adminClient
        .from("staff_profiles")
        .select("id")
        .eq("staff_id", cleanStaffId)
        .maybeSingle();

      if (existingStaff) {
        return new Response(
          JSON.stringify({ error: `Staff ID ${cleanStaffId} already exists.` }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create Supabase Auth user
      const { data: newUser, error: createAuthError } = await adminClient.auth.admin.createUser({
        email: internalEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          staff_id: cleanStaffId,
          full_name: full_name,
        },
      });

      if (createAuthError || !newUser?.user) {
        return new Response(
          JSON.stringify({ error: createAuthError?.message || "Failed to create auth account" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Upsert profile in staff_profiles
      const { data: profile, error: insertProfileError } = await adminClient
        .from("staff_profiles")
        .upsert({
          id: newUser.user.id,
          staff_id: cleanStaffId,
          full_name: full_name.trim(),
          email: internalEmail,
          role: role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "SALES",
          phone: phone || null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertProfileError) {
        return new Response(
          JSON.stringify({ error: insertProfileError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Log activity
      await adminClient.from("activity_logs").insert({
        actor_id: user.id,
        actor_staff_id: callerProfile.staff_id,
        actor_name: "Super Admin",
        entity_type: "staff",
        entity_id: newUser.user.id,
        action: "CREATE",
        description: `${callerProfile.staff_id} created new staff account for ${full_name} (${cleanStaffId})`,
      });

      return new Response(
        JSON.stringify({ success: true, profile }),
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. ACTION: change_password
    if (action === "change_password") {
      const { user_id, new_password } = body;
      if (!user_id || !new_password || new_password.length < 6) {
        return new Response(
          JSON.stringify({ error: "user_id and valid new_password (min 6 chars) are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: updateError } = await adminClient.auth.admin.updateUserById(user_id, {
        password: new_password,
      });

      if (updateError) {
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Log activity
      await adminClient.from("activity_logs").insert({
        actor_id: user.id,
        actor_staff_id: callerProfile.staff_id,
        actor_name: "Super Admin",
        entity_type: "staff",
        entity_id: user_id,
        action: "UPDATE",
        description: `${callerProfile.staff_id} changed password for staff member`,
      });

      return new Response(
        JSON.stringify({ success: true, message: "Password updated successfully" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. ACTION: toggle_active
    if (action === "toggle_active") {
      const { user_id, is_active } = body;
      if (!user_id || typeof is_active !== "boolean") {
        return new Response(
          JSON.stringify({ error: "user_id and boolean is_active required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Prevent disabling yourself
      if (user_id === user.id) {
        return new Response(
          JSON.stringify({ error: "You cannot disable your own Super Admin account" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: updatedProfile, error: updateError } = await adminClient
        .from("staff_profiles")
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq("id", user_id)
        .select()
        .single();

      if (updateError) {
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // If disabling, revoke sessions by signing out
      if (!is_active) {
        try {
          await adminClient.auth.admin.signOut(user_id);
        } catch (_err) {
          // ignore if already logged out
        }
      }

      await adminClient.from("activity_logs").insert({
        actor_id: user.id,
        actor_staff_id: callerProfile.staff_id,
        actor_name: "Super Admin",
        entity_type: "staff",
        entity_id: user_id,
        action: is_active ? "ACTIVATE" : "DISABLE",
        description: `${callerProfile.staff_id} ${is_active ? "activated" : "disabled"} account for ${updatedProfile.staff_id}`,
      });

      return new Response(
        JSON.stringify({ success: true, profile: updatedProfile }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Unknown action: ${action}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
