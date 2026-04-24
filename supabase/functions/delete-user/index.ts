import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Admin client — uses service_role key, the only way to call auth.admin.deleteUser
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify the caller's JWT and get their user ID
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;
    console.log("[delete-user] Deleting account for:", userId);

    // 1. Delete hosted events — FK cascade removes attendees and ratings
    const { error: eventsErr } = await supabaseAdmin
      .from("events")
      .delete()
      .eq("host_id", userId);
    if (eventsErr) {
      console.error("[delete-user] events delete error:", eventsErr);
      throw new Error(eventsErr.message);
    }

    // 2. Delete public.users row — must happen before auth.users due to FK constraint
    const { error: profileErr } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", userId);
    if (profileErr) {
      console.error("[delete-user] public.users delete error:", profileErr);
      throw new Error(profileErr.message);
    }

    // 3. Delete the auth.users record — this is what frees the email for re-registration
    //    Only possible with the service_role key via auth.admin.deleteUser()
    const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authErr) {
      console.error("[delete-user] auth.admin.deleteUser error:", authErr);
      throw new Error(authErr.message);
    }

    console.log("[delete-user] Account fully deleted:", userId);
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[delete-user] Unhandled error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
