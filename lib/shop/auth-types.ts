export type ShopUser = { uid: string; email: string | null; admin: boolean };

export const SESSION_COOKIE = "__session";
export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 14;
