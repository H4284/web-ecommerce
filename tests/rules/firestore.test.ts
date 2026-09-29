import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  assertFails,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { afterAll, beforeAll, describe, it } from "vitest";

let testEnv: RulesTestEnvironment;

const PATHS = [
  ["meta", "seed"],
  ["categories", "women"],
  ["brands", "sanem"],
  ["products", "prod-01"],
  ["settings", "shop"],
] as const;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "demo-sanem",
    firestore: {
      rules: readFileSync(resolve("firestore.rules"), "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

async function assertNoClientAccess(
  db: ReturnType<ReturnType<RulesTestEnvironment["unauthenticatedContext"]>["firestore"]>,
) {
  for (const [collection, id] of PATHS) {
    await assertFails(getDoc(doc(db, collection, id)));
    await assertFails(setDoc(doc(db, collection, id), { probe: true }));
  }
  await assertFails(getDoc(doc(db, "products", "prod-01", "variants", "50ml")));
  await assertFails(
    setDoc(doc(db, "products", "prod-01", "variants", "50ml"), { stock: 1 }),
  );
}

describe("firestore.rules deny-all for shop collections", () => {
  it("anonymous cannot read or write catalog, settings, variants", async () => {
    await assertNoClientAccess(testEnv.unauthenticatedContext().firestore());
  });

  it("signed-in cannot read or write catalog, settings, variants", async () => {
    await assertNoClientAccess(testEnv.authenticatedContext("user-1").firestore());
  });
});
