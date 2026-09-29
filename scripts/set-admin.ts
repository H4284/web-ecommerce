import { setRemoteProject } from "./lib/remote";

async function main() {
  setRemoteProject(process.argv);

  const email = process.argv
    .slice(2)
    .filter((a, i, arr) => a !== "--project" && arr[i - 1] !== "--project")[0];

  if (!email || !email.includes("@")) {
    console.error("Usage: pnpm run:local scripts/set-admin.ts <email>");
    console.error("   or: pnpm run:remote scripts/set-admin.ts <email> --project <id>");
    process.exit(1);
  }

  const { adminAuth } = await import("@/lib/firebase/admin");

  let user;
  try {
    user = await adminAuth.getUserByEmail(email);
  } catch {
    user = await adminAuth.createUser({ email });
    console.log(`Created user ${user.uid} for ${email}`);
  }

  await adminAuth.setCustomUserClaims(user.uid, { admin: true });
  const link = await adminAuth.generatePasswordResetLink(email);

  console.log(`Admin claim set for ${email} (${user.uid}).`);
  console.log("Sign in again so the claim is in the session.");
  console.log(`Password reset link:\n${link}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
