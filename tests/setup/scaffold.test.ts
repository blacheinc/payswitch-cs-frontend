import { describe, it, expect } from "vitest";

describe("test scaffold", () => {
  it("runs vitest", () => {
    expect(1 + 1).toBe(2);
  });

  it("has env stubs", () => {
    expect(process.env.BACKEND_API_URL).toBe("http://api.test/api");
  });
});
