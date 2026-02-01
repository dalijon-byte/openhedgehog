import { describe, expect, it } from "vitest";
import {
  buildParseArgv,
  getFlagValue,
  getCommandPath,
  getPrimaryCommand,
  getPositiveIntFlagValue,
  getVerboseFlag,
  hasHelpOrVersion,
  hasFlag,
  shouldMigrateState,
  shouldMigrateStateFromPath,
} from "./argv.js";

describe("argv helpers", () => {
  it("detects help/version flags", () => {
    expect(hasHelpOrVersion(["node", "openhedgehog", "--help"])).toBe(true);
    expect(hasHelpOrVersion(["node", "openhedgehog", "-V"])).toBe(true);
    expect(hasHelpOrVersion(["node", "openhedgehog", "status"])).toBe(false);
  });

  it("extracts command path ignoring flags and terminator", () => {
    expect(getCommandPath(["node", "openhedgehog", "status", "--json"], 2)).toEqual(["status"]);
    expect(getCommandPath(["node", "openhedgehog", "agents", "list"], 2)).toEqual([
      "agents",
      "list",
    ]);
    expect(getCommandPath(["node", "openhedgehog", "status", "--", "ignored"], 2)).toEqual([
      "status",
    ]);
  });

  it("returns primary command", () => {
    expect(getPrimaryCommand(["node", "openhedgehog", "agents", "list"])).toBe("agents");
    expect(getPrimaryCommand(["node", "openhedgehog"])).toBeNull();
  });

  it("parses boolean flags and ignores terminator", () => {
    expect(hasFlag(["node", "openhedgehog", "status", "--json"], "--json")).toBe(true);
    expect(hasFlag(["node", "openhedgehog", "--", "--json"], "--json")).toBe(false);
  });

  it("extracts flag values with equals and missing values", () => {
    expect(getFlagValue(["node", "openhedgehog", "status", "--timeout", "5000"], "--timeout")).toBe(
      "5000",
    );
    expect(getFlagValue(["node", "openhedgehog", "status", "--timeout=2500"], "--timeout")).toBe(
      "2500",
    );
    expect(getFlagValue(["node", "openhedgehog", "status", "--timeout"], "--timeout")).toBeNull();
    expect(
      getFlagValue(["node", "openhedgehog", "status", "--timeout", "--json"], "--timeout"),
    ).toBe(null);
    expect(
      getFlagValue(["node", "openhedgehog", "--", "--timeout=99"], "--timeout"),
    ).toBeUndefined();
  });

  it("parses verbose flags", () => {
    expect(getVerboseFlag(["node", "openhedgehog", "status", "--verbose"])).toBe(true);
    expect(getVerboseFlag(["node", "openhedgehog", "status", "--debug"])).toBe(false);
    expect(
      getVerboseFlag(["node", "openhedgehog", "status", "--debug"], { includeDebug: true }),
    ).toBe(true);
  });

  it("parses positive integer flag values", () => {
    expect(
      getPositiveIntFlagValue(["node", "openhedgehog", "status"], "--timeout"),
    ).toBeUndefined();
    expect(
      getPositiveIntFlagValue(["node", "openhedgehog", "status", "--timeout"], "--timeout"),
    ).toBeNull();
    expect(
      getPositiveIntFlagValue(["node", "openhedgehog", "status", "--timeout", "5000"], "--timeout"),
    ).toBe(5000);
    expect(
      getPositiveIntFlagValue(["node", "openhedgehog", "status", "--timeout", "nope"], "--timeout"),
    ).toBeUndefined();
  });

  it("builds parse argv from raw args", () => {
    const nodeArgv = buildParseArgv({
      programName: "openhedgehog",
      rawArgs: ["node", "openhedgehog", "status"],
    });
    expect(nodeArgv).toEqual(["node", "openhedgehog", "status"]);

    const versionedNodeArgv = buildParseArgv({
      programName: "openhedgehog",
      rawArgs: ["node-22", "openhedgehog", "status"],
    });
    expect(versionedNodeArgv).toEqual(["node-22", "openhedgehog", "status"]);

    const versionedNodeWindowsArgv = buildParseArgv({
      programName: "openhedgehog",
      rawArgs: ["node-22.2.0.exe", "openhedgehog", "status"],
    });
    expect(versionedNodeWindowsArgv).toEqual(["node-22.2.0.exe", "openhedgehog", "status"]);

    const versionedNodePatchlessArgv = buildParseArgv({
      programName: "openhedgehog",
      rawArgs: ["node-22.2", "openhedgehog", "status"],
    });
    expect(versionedNodePatchlessArgv).toEqual(["node-22.2", "openhedgehog", "status"]);

    const versionedNodeWindowsPatchlessArgv = buildParseArgv({
      programName: "openhedgehog",
      rawArgs: ["node-22.2.exe", "openhedgehog", "status"],
    });
    expect(versionedNodeWindowsPatchlessArgv).toEqual(["node-22.2.exe", "openhedgehog", "status"]);

    const versionedNodeWithPathArgv = buildParseArgv({
      programName: "openhedgehog",
      rawArgs: ["/usr/bin/node-22.2.0", "openhedgehog", "status"],
    });
    expect(versionedNodeWithPathArgv).toEqual(["/usr/bin/node-22.2.0", "openhedgehog", "status"]);

    const nodejsArgv = buildParseArgv({
      programName: "openhedgehog",
      rawArgs: ["nodejs", "openhedgehog", "status"],
    });
    expect(nodejsArgv).toEqual(["nodejs", "openhedgehog", "status"]);

    const nonVersionedNodeArgv = buildParseArgv({
      programName: "openhedgehog",
      rawArgs: ["node-dev", "openhedgehog", "status"],
    });
    expect(nonVersionedNodeArgv).toEqual([
      "node",
      "openhedgehog",
      "node-dev",
      "openhedgehog",
      "status",
    ]);

    const directArgv = buildParseArgv({
      programName: "openhedgehog",
      rawArgs: ["openhedgehog", "status"],
    });
    expect(directArgv).toEqual(["node", "openhedgehog", "status"]);

    const bunArgv = buildParseArgv({
      programName: "openhedgehog",
      rawArgs: ["bun", "src/entry.ts", "status"],
    });
    expect(bunArgv).toEqual(["bun", "src/entry.ts", "status"]);
  });

  it("builds parse argv from fallback args", () => {
    const fallbackArgv = buildParseArgv({
      programName: "openhedgehog",
      fallbackArgv: ["status"],
    });
    expect(fallbackArgv).toEqual(["node", "openhedgehog", "status"]);
  });

  it("decides when to migrate state", () => {
    expect(shouldMigrateState(["node", "openhedgehog", "status"])).toBe(false);
    expect(shouldMigrateState(["node", "openhedgehog", "health"])).toBe(false);
    expect(shouldMigrateState(["node", "openhedgehog", "sessions"])).toBe(false);
    expect(shouldMigrateState(["node", "openhedgehog", "memory", "status"])).toBe(false);
    expect(shouldMigrateState(["node", "openhedgehog", "agent", "--message", "hi"])).toBe(false);
    expect(shouldMigrateState(["node", "openhedgehog", "agents", "list"])).toBe(true);
    expect(shouldMigrateState(["node", "openhedgehog", "message", "send"])).toBe(true);
  });

  it("reuses command path for migrate state decisions", () => {
    expect(shouldMigrateStateFromPath(["status"])).toBe(false);
    expect(shouldMigrateStateFromPath(["agents", "list"])).toBe(true);
  });
});
