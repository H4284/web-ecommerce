import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import type { z } from "zod";
import { db } from "@/lib/firebase/admin";
import { requireAdmin, type ShopUser } from "@/lib/shop/auth";

type AdminActionOptions<S extends z.ZodTypeAny, R> = {
  schema: S;
  action: string;
  target: string | ((data: z.infer<S>) => string);
  input: unknown;
  fn: (data: z.infer<S>, user: ShopUser) => Promise<R>;
};

/** requireAdmin → zod → fn → auditLogs entry. */
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

  await db.collection("auditLogs").add({
    uid: user.uid,
    email: user.email,
    action: options.action,
    target,
    at: FieldValue.serverTimestamp(),
  });

  return result;
}
