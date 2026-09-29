// Call before importing "@/lib/firebase/admin". Returns true when --project was given.
export function setRemoteProject(argv: string[]): boolean {
  const i = argv.indexOf("--project");
  if (i < 0) return false;
  const emulator = Object.keys(process.env).find((k) => k.endsWith("_EMULATOR_HOST"));
  if (emulator) throw new Error(`${emulator} is set — refusing to write to a real project`);
  const projectId = argv[i + 1];
  if (!projectId) throw new Error("Missing project id after --project");
  const storageBucket =
    process.env.STORAGE_BUCKET ?? `${projectId}.firebasestorage.app`;
  process.env.FIREBASE_CONFIG = JSON.stringify({ projectId, storageBucket });
  return true;
}
