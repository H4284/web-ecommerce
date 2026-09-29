import { setRemoteProject } from "./lib/remote";

async function main() {
  setRemoteProject(process.argv);
  const { db } = await import("@/lib/firebase/admin");
  await db.collection("meta").doc("seed").set({ at: new Date().toISOString() });
  console.log("Wrote meta/seed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
