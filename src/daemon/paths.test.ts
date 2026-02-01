import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveGatewayStateDir } from "./paths.js";

describe("resolveGatewayStateDir", () => {
  it("uses the default state dir when no overrides are set", () => {
    const env = { HOME: "/Users/test" };
    expect(resolveGatewayStateDir(env)).toBe(path.join("/Users/test", ".openhedgehog"));
  });

  it("appends the profile suffix when set", () => {
    const env = { HOME: "/Users/test", OPENHEDGEHOG_PROFILE: "rescue" };
    expect(resolveGatewayStateDir(env)).toBe(path.join("/Users/test", ".openhedgehog-rescue"));
  });

  it("treats default profiles as the base state dir", () => {
    const env = { HOME: "/Users/test", OPENHEDGEHOG_PROFILE: "Default" };
    expect(resolveGatewayStateDir(env)).toBe(path.join("/Users/test", ".openhedgehog"));
  });

  it("uses OPENHEDGEHOG_STATE_DIR when provided", () => {
    const env = { HOME: "/Users/test", OPENHEDGEHOG_STATE_DIR: "/var/lib/openhedgehog" };
    expect(resolveGatewayStateDir(env)).toBe(path.resolve("/var/lib/openhedgehog"));
  });

  it("expands ~ in OPENHEDGEHOG_STATE_DIR", () => {
    const env = { HOME: "/Users/test", OPENHEDGEHOG_STATE_DIR: "~/openhedgehog-state" };
    expect(resolveGatewayStateDir(env)).toBe(path.resolve("/Users/test/openhedgehog-state"));
  });

  it("preserves Windows absolute paths without HOME", () => {
    const env = { OPENHEDGEHOG_STATE_DIR: "C:\\State\\openhedgehog" };
    expect(resolveGatewayStateDir(env)).toBe("C:\\State\\openhedgehog");
  });
});
