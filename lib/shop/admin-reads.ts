import "server-only";
import { requireAdmin } from "@/lib/shop/auth";

/** Admin home payload — every admin read calls requireAdmin(). */
export async function getAdminDashboard() {
  const user = await requireAdmin();
  return {
    email: user.email,
    uid: user.uid,
  };
}
