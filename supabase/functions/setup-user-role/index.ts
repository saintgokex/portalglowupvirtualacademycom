import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SetupUserRequest {
  userId: string;
  role: "student" | "teacher";
  displayName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the caller's authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Missing token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create client with user's token to verify identity
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsError } = await userSupabase.auth.getClaims(token);
    
    if (claimsError || !claims?.claims?.sub) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const callerId = claims.claims.sub;

    // Use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, role, displayName }: SetupUserRequest = await req.json();

    // Ensure the caller is setting up their own role (not someone else's)
    if (callerId !== userId) {
      return new Response(
        JSON.stringify({ error: "Forbidden - You can only set up your own role" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate role - only allow student or teacher (not superadmin)
    if (!["student", "teacher"].includes(role)) {
      return new Response(
        JSON.stringify({ error: "Invalid role. Must be 'student' or 'teacher'" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user already has a role
    const { data: existingRole } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (existingRole) {
      return new Response(
        JSON.stringify({ error: "User already has a role assigned" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Insert user role
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role });

    if (roleError) {
      console.error("Role insert error:", roleError);
      throw new Error("Failed to assign role");
    }

    // If student, create a student record
    if (role === "student") {
      const { error: studentError } = await supabase
        .from("students")
        .insert({
          user_id: userId,
          name: displayName,
          status: "active",
          progress: 0
        });

      if (studentError) {
        console.error("Student insert error:", studentError);
        // Rollback role if student creation fails
        await supabase.from("user_roles").delete().eq("user_id", userId);
        throw new Error("Failed to create student record");
      }
    }

    return new Response(
      JSON.stringify({ success: true, role }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in setup-user-role function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
