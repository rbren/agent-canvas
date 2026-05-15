import { SkillsClient } from "@openhands/typescript-client/clients";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetActiveStoreForTests,
  setActiveSelection,
  setRegisteredBackends,
} from "#/api/backend-registry/active-store";
import type { Backend } from "#/api/backend-registry/types";
import SkillsService from "#/api/skills-service";

const { mockGetSkills } = vi.hoisted(() => ({
  mockGetSkills: vi.fn(),
}));

vi.mock("@openhands/typescript-client/clients", () => ({
  SkillsClient: vi.fn(function SkillsClientMock() {
    return { getSkills: mockGetSkills };
  }),
}));

const localBackend: Backend = {
  id: "local",
  name: "Local",
  host: "http://127.0.0.1:8000",
  apiKey: "",
  kind: "local",
};

beforeEach(() => {
  window.localStorage.clear();
  __resetActiveStoreForTests();
  setRegisteredBackends([localBackend]);
  setActiveSelection({ backendId: localBackend.id });
  mockGetSkills.mockReset();
  vi.mocked(SkillsClient).mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
  __resetActiveStoreForTests();
});

describe("SkillsService.getSkills against the agent-server backend", () => {
  it("requests public, user, and project skills without a marketplace_path override", async () => {
    mockGetSkills.mockResolvedValue({
      skills: [
        {
          name: "github",
          type: "knowledge",
          content: "...",
          triggers: [],
          source: "public",
          is_agentskills_format: false,
        },
      ],
      sources: { sandbox: 0, sdk_base: 1, org: 0, project: 0 },
    });

    const skills = await SkillsService.getSkills();

    // No marketplace_path is passed — the server uses its own default
    // (marketplaces/default.json in the extensions repo). Passing a
    // browser URL as marketplace_path breaks skill loading because the
    // server resolves it as a relative filesystem path, not a URL.
    expect(mockGetSkills).toHaveBeenCalledTimes(1);
    expect(mockGetSkills.mock.calls[0]?.[0]).toMatchObject({
      load_public: true,
      load_user: true,
      load_project: true,
      load_org: false,
    });
    expect(mockGetSkills.mock.calls[0]?.[0]).not.toHaveProperty(
      "marketplace_path",
    );
    expect(skills.map((s) => s.name)).toEqual(["github"]);
  });
});
