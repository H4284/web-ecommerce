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

describe("firestore.rules deny-all", () => {
  it("anonymous cannot read or write meta", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, "meta", "seed")));
    await assertFails(setDoc(doc(db, "meta", "seed"), { at: "x" }));
  });

  it("signed-in cannot read or write meta", async () => {
    const db = testEnv.authenticatedContext("user-1").firestore();
    await assertFails(getDoc(doc(db, "meta", "seed")));
    await assertFails(setDoc(doc(db, "meta", "seed"), { at: "x" }));
  });
});
