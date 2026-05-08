import { describe, expect, it } from "vitest";

import { getPathBasename } from "#/utils/path-utils";

describe("getPathBasename", () => {
  it("returns an empty string for empty or whitespace-only input", () => {
    expect(getPathBasename("")).toBe("");
    expect(getPathBasename("   ")).toBe("");
  });

  it("handles POSIX paths with and without trailing slashes", () => {
    expect(getPathBasename("/workspace/project/agent-canvas")).toBe(
      "agent-canvas",
    );
    expect(getPathBasename("/workspace/project/agent-canvas/")).toBe(
      "agent-canvas",
    );
  });

  it("handles Windows-style paths", () => {
    expect(getPathBasename("C:\\Users\\me\\repo")).toBe("repo");
    expect(getPathBasename("C:\\Users\\me\\repo\\")).toBe("repo");
  });

  it("returns an empty string for root paths", () => {
    expect(getPathBasename("/")).toBe("");
    expect(getPathBasename("C:\\")).toBe("");
  });

  it("preserves relative basenames", () => {
    expect(getPathBasename("repo")).toBe("repo");
    expect(getPathBasename("./repo")).toBe("repo");
  });
});
