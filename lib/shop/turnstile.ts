import "server-only";

/**
 * Verify a Cloudflare Turnstile token.
 * With no secret (local/emulator), accepts any non-empty token.
 */
export async function verifyTurnstile(token: string): Promise<boolean> {
  const trimmed = token.trim();
  if (!trimmed) return false;

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return true;
  }

  const body = new URLSearchParams({
    secret,
    response: trimmed,
  });

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { success?: boolean };
  return data.success === true;
}
