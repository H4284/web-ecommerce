import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/** Creates `profiles/{id}` on first sign-in. */
export async function ensureUserDoc(input: {
  id: string;
  email: string | null;
  name?: string | null;
}): Promise<void> {
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("profiles")
    .select("id")
    .eq("id", input.id)
    .maybeSingle();
  if (data) return;

  const { error } = await admin.from("profiles").insert({
    id: input.id,
    email: input.email ?? "",
    is_admin: false,
  });
  if (error && error.code !== "23505") {
    throw error;
  }
}
