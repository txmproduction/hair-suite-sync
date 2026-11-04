import { describe, test, expect } from "bun:test";
import { createPhotoDelivery } from "./photo-delivery";

const path = "60987c77-64a2-4915-bcbc-9408196f5cba/0.jpg";
const url = "https://storage.example.test/private-photo?token=test-only";

describe("private photo delivery", () => {
  test("redirects without downloading image bytes, signs for seven days", async () => {
    let expiry = 0;
    const deliver = createPhotoDelivery(async (_, seconds) => { expiry = seconds; return url; });
    const response = await deliver(path);
    expect(expiry).toBe(604800);
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(url);
    expect(await response.text()).toBe("");
    expect(response.headers.get("cache-control")).toBe("public, max-age=3600, s-maxage=86400");
  });

  test("reuses a signature and renews it after 24 hours", async () => {
    let calls = 0;
    let time = 0;
    const deliver = createPhotoDelivery(async () => { calls++; return url; }, () => time);
    await deliver(path);
    time = 86399999;
    await deliver(path);
    expect(calls).toBe(1);
    time = 86400000;
    await deliver(path);
    expect(calls).toBe(2);
  });

  test("rejects traversal and malformed paths without storage access", async () => {
    let calls = 0;
    const deliver = createPhotoDelivery(async () => { calls++; return url; });
    for (const invalid of ["../secret", "60987c77-64a2-4915-bcbc-9408196f5cba/../secret.jpg", "------------------------------------/0.jpg", `${path}?x=1`]) {
      expect((await deliver(invalid)).status).toBe(404);
    }
    expect(calls).toBe(0);
  });

  test("deduplicates concurrent signing requests", async () => {
    let calls = 0;
    const deliver = createPhotoDelivery(async () => { calls++; await Promise.resolve(); return url; });
    const responses = await Promise.all([deliver(path), deliver(path), deliver(path)]);
    expect(calls).toBe(1);
    expect(responses.every(response => response.status === 302)).toBe(true);
  });

  test("does not cache errors and permits a later retry", async () => {
    let calls = 0;
    const deliver = createPhotoDelivery(async () => { calls++; if (calls === 1) throw new Error("Unavailable"); return url; });
    const failed = await deliver(path);
    expect(failed.status).toBe(404);
    expect(failed.headers.get("cache-control")).toBe("no-store");
    expect((await deliver(path)).status).toBe(302);
    expect(calls).toBe(2);
  });
});