import path from "node:path";
import { describe, expect, it } from "vitest";
import { formatCliCommand } from "./command-format.js";
import { applyCliProfileEnv, parseCliProfileArgs } from "./profile.js";

describe("parseCliProfileArgs", () => {
  it("leaves gateway --dev for subcommands", () => {
    const res = parseCliProfileArgs([
      "node",
      "openhedgehog",
      "gateway",
      "--dev",
      "--allow-unconfigured",
    ]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBeNull();
    expect(res.argv).toEqual(["node", "openhedgehog", "gateway", "--dev", "--allow-unconfigured"]);
  });

  it("still accepts global --dev before subcommand", () => {
    const res = parseCliProfileArgs(["node", "openhedgehog", "--dev", "gateway"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("dev");
    expect(res.argv).toEqual(["node", "openhedgehog", "gateway"]);
  });

  it("parses --profile value and strips it", () => {
    const res = parseCliProfileArgs(["node", "openhedgehog", "--profile", "work", "status"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("work");
    expect(res.argv).toEqual(["node", "openhedgehog", "status"]);
  });

  it("rejects missing profile value", () => {
    const res = parseCliProfileArgs(["node", "openhedgehog", "--profile"]);
    expect(res.ok).toBe(false);
  });

  it("rejects combining --dev with --profile (dev first)", () => {
    const res = parseCliProfileArgs([
      "node",
      "openhedgehog",
      "--dev",
      "--profile",
      "work",
      "status",
    ]);
    expect(res.ok).toBe(false);
  });

  it("rejects combining --dev with --profile (profile first)", () => {
    const res = parseCliProfileArgs([
      "node",
      "openhedgehog",
      "--profile",
      "work",
      "--dev",
      "status",
    ]);
    expect(res.ok).toBe(false);
  });
});

describe("applyCliProfileEnv", () => {
  it("fills env defaults for dev profile", () => {
    const env: Record<string, string | undefined> = {};
    applyCliProfileEnv({
      profile: "dev",
      env,
      homedir: () => "/home/peter",
    });
    const expectedStateDir = path.join("/home/peter", ".openhedgehog-dev");
    expect(env.OPENHEDGEHOG_PROFILE).toBe("dev");
    expect(env.OPENHEDGEHOG_STATE_DIR).toBe(expectedStateDir);
    expect(env.OPENHEDGEHOG_CONFIG_PATH).toBe(path.join(expectedStateDir, "openhedgehog.json"));
    expect(env.OPENHEDGEHOG_GATEWAY_PORT).toBe("19001");
  });

  it("does not override explicit env values", () => {
    const env: Record<string, string | undefined> = {
      OPENHEDGEHOG_STATE_DIR: "/custom",
      OPENHEDGEHOG_GATEWAY_PORT: "19099",
    };
    applyCliProfileEnv({
      profile: "dev",
      env,
      homedir: () => "/home/peter",
    });
    expect(env.OPENHEDGEHOG_STATE_DIR).toBe("/custom");
    expect(env.OPENHEDGEHOG_GATEWAY_PORT).toBe("19099");
    expect(env.OPENHEDGEHOG_CONFIG_PATH).toBe(path.join("/custom", "openhedgehog.json"));
  });
});

describe("formatCliCommand", () => {
  it("returns command unchanged when no profile is set", () => {
    expect(formatCliCommand("openhedgehog doctor --fix", {})).toBe("openhedgehog doctor --fix");
  });

  it("returns command unchanged when profile is default", () => {
    expect(formatCliCommand("openhedgehog doctor --fix", { OPENHEDGEHOG_PROFILE: "default" })).toBe(
      "openhedgehog doctor --fix",
    );
  });

  it("returns command unchanged when profile is Default (case-insensitive)", () => {
    expect(formatCliCommand("openhedgehog doctor --fix", { OPENHEDGEHOG_PROFILE: "Default" })).toBe(
      "openhedgehog doctor --fix",
    );
  });

  it("returns command unchanged when profile is invalid", () => {
    expect(
      formatCliCommand("openhedgehog doctor --fix", { OPENHEDGEHOG_PROFILE: "bad profile" }),
    ).toBe("openhedgehog doctor --fix");
  });

  it("returns command unchanged when --profile is already present", () => {
    expect(
      formatCliCommand("openhedgehog --profile work doctor --fix", {
        OPENHEDGEHOG_PROFILE: "work",
      }),
    ).toBe("openhedgehog --profile work doctor --fix");
  });

  it("returns command unchanged when --dev is already present", () => {
    expect(formatCliCommand("openhedgehog --dev doctor", { OPENHEDGEHOG_PROFILE: "dev" })).toBe(
      "openhedgehog --dev doctor",
    );
  });

  it("inserts --profile flag when profile is set", () => {
    expect(formatCliCommand("openhedgehog doctor --fix", { OPENHEDGEHOG_PROFILE: "work" })).toBe(
      "openhedgehog --profile work doctor --fix",
    );
  });

  it("trims whitespace from profile", () => {
    expect(
      formatCliCommand("openhedgehog doctor --fix", { OPENHEDGEHOG_PROFILE: "  jbopenclaw  " }),
    ).toBe("openhedgehog --profile jbopenclaw doctor --fix");
  });

  it("handles command with no args after openhedgehog", () => {
    expect(formatCliCommand("openhedgehog", { OPENHEDGEHOG_PROFILE: "test" })).toBe(
      "openhedgehog --profile test",
    );
  });

  it("handles pnpm wrapper", () => {
    expect(formatCliCommand("pnpm openhedgehog doctor", { OPENHEDGEHOG_PROFILE: "work" })).toBe(
      "pnpm openhedgehog --profile work doctor",
    );
  });
});
