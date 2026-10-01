import "server-only";
import type { z } from "zod";
import { requireAdmin, type ShopUser } from "@/lib/shop/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type AdminActionOptions<S extends z.ZodTypeAny, R> = {
  schema: S;
  action: string;
  target: string | ((data: z.infer<S>) => string);
  input: unknown;
  fn: (data: z.infer<S>, user: ShopUser) => Promise<R>;
};

/** requireAdmin → zod → fn → audit_logs entry. */
export async function adminAction<S extends z.ZodTypeAny, R>(
  options: AdminActionOptions<S, R>,
): Promise<R> {
  const user = await requireAdmin();
  const parsed = options.schema.safeParse(options.input);
  if (!parsed.success) {
    throw new Error("Invalid admin action input");
  }

  const result = await options.fn(parsed.data, user);
  const target =
    typeof options.target === "function"
      ? options.target(parsed.data)
      : options.target;

  const [entity, entityId] = target.includes("/")
    ? (target.split("/", 2) as [string, string])
    : [target, null];

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("audit_logs").insert({
    actor_uid: user.uid,
    action: options.action,
    entity,
    entity_id: entityId,
    meta: { email: user.email, target },
  });
  if (error) {
    console.error("[audit_logs]", error.message);
  }

  return result;
}
