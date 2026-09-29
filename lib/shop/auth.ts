import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "@/lib/firebase/admin";
import { safeNextPath } from "@/lib/shop/auth-path";
import {
  SESSION_COOKIE,
  type ShopUser,
} from "@/lib/shop/auth-types";

export type { ShopUser } from "@/lib/shop/auth-types";
export { SESSION_COOKIE, SESSION_MAX_AGE_SEC } from "@/lib/shop/auth-types";

export async function getUser(): Promise<ShopUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const decoded = await adminAuth.verifySessionCookie(token, true);
    const claims = decoded as typeof decoded & { admin?: boolean };
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      admin: claims.admin === true,
    };
  } catch {
    return null;
  }
}

export async function requireUser(next = "/account"): Promise<ShopUser> {
  const user = await getUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(safeNextPath(next, "/account"))}`);
  }
  return user;
}

export async function requireAdmin(): Promise<ShopUser> {
  const user = await getUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/admin")}`);
  }
  if (!user.admin) {
    redirect("/");
  }
  return user;
}
