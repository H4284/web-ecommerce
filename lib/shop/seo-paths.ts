export const PRIVATE_PATH_PREFIXES = [
  "/admin",
  "/account",
  "/checkout",
  "/cart",
  "/shporta",
  "/orders",
  "/api",
  "/search",
  "/login",
  "/forgot-password",
  "/dev",
] as const;

export function isPrivatePath(path: string): boolean {
  return PRIVATE_PATH_PREFIXES.some(
    (p) => path === p || path.startsWith(`${p}/`),
  );
}
