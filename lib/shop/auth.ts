import "server-only";

export type ShopUser = { uid: string; email: string | null; admin: boolean };

/** Stub until shop:auth — always null. */
export async function getUser(): Promise<ShopUser | null> {
  return null;
}

export async function requireUser(): Promise<ShopUser> {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requireAdmin(): Promise<ShopUser> {
  const user = await requireUser();
  if (!user.admin) throw new Error("Forbidden");
  return user;
}
