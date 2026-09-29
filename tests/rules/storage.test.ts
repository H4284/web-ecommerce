import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { getBytes, listAll, ref, uploadBytes } from "firebase/storage";
import { afterAll, beforeAll, describe, it } from "vitest";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "demo-sanem",
    storage: {
      rules: readFileSync(resolve("storage.rules"), "utf8"),
      host: "127.0.0.1",
      port: 9199,
    },
  });

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const storage = context.storage();
    const payload = new Uint8Array([1, 2, 3, 4]);
    await uploadBytes(ref(storage, "products/prod-01/0-320.webp"), payload);
    await uploadBytes(ref(storage, "content/home/0-320.webp"), payload);
    await uploadBytes(ref(storage, "private/secret.bin"), payload);
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe("storage.rules public get only for products and content", () => {
  it("anonymous can get product and content objects", async () => {
    const storage = testEnv.unauthenticatedContext().storage();
    await assertSucceeds(getBytes(ref(storage, "products/prod-01/0-320.webp")));
    await assertSucceeds(getBytes(ref(storage, "content/home/0-320.webp")));
  });

  it("anonymous cannot list or write products/content", async () => {
    const storage = testEnv.unauthenticatedContext().storage();
    await assertFails(listAll(ref(storage, "products")));
    await assertFails(listAll(ref(storage, "content")));
    await assertFails(
      uploadBytes(ref(storage, "products/hack.webp"), new Uint8Array([9])),
    );
    await assertFails(
      uploadBytes(ref(storage, "content/hack.webp"), new Uint8Array([9])),
    );
  });

  it("anonymous cannot get or write other paths", async () => {
    const storage = testEnv.unauthenticatedContext().storage();
    await assertFails(getBytes(ref(storage, "private/secret.bin")));
    await assertFails(
      uploadBytes(ref(storage, "private/new.bin"), new Uint8Array([9])),
    );
  });

  it("signed-in has the same storage limits", async () => {
    const storage = testEnv.authenticatedContext("user-1").storage();
    await assertSucceeds(getBytes(ref(storage, "products/prod-01/0-320.webp")));
    await assertFails(listAll(ref(storage, "products")));
    await assertFails(
      uploadBytes(ref(storage, "products/hack.webp"), new Uint8Array([9])),
    );
    await assertFails(getBytes(ref(storage, "private/secret.bin")));
  });
});
