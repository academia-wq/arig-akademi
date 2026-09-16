import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data: authUsers, error: authErr } = await supabase.auth.admin.listUsers();
if (authErr) {
  console.error(authErr);
  process.exit(1);
}
const user = authUsers.users.find((u) => u.email === "academia@ariganya.com");
console.log("auth user id:", user?.id, "email:", user?.email);

if (user) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  console.log("profile:", profile, error);
}
