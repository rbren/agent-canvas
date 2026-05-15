import { test, expect, Page } from "@playwright/test";

/**
 * Visual snapshot tests for the LLM settings page API key auth section.
 *
 * When an `openhands/*` model is selected, the page shows:
 * - "Login with OpenHands" device flow button
 * - "or enter manually" divider
 * - Standard API key input
 *
 * When a non-openhands model is selected, only the standard API key
 * input + help link is shown.
 */

const AGENT_SETTINGS_SCHEMA = {
  model_name: "AgentSettings",
  sections: [
    {
      key: "llm",
      label: "LLM",
      fields: [
        {
          key: "llm.model",
          label: "Model",
          description: "Select the model to use.",
          section: "llm",
          section_label: "LLM",
          value_type: "string",
          default: "openhands/claude-opus-4-5-20251101",
          choices: [],
          depends_on: [],
          prominence: "critical",
          secret: false,
          required: true,
        },
        {
          key: "llm.api_key",
          label: "API Key",
          description: "API key for authentication.",
          section: "llm",
          section_label: "LLM",
          value_type: "string",
          default: null,
          choices: [],
          depends_on: [],
          prominence: "critical",
          secret: true,
          required: false,
        },
        {
          key: "llm.base_url",
          label: "Base URL",
          description: "Override the default API base URL.",
          section: "llm",
          section_label: "LLM",
          value_type: "string",
          default: null,
          choices: [],
          depends_on: [],
          prominence: "critical",
          secret: false,
          required: false,
        },
      ],
    },
  ],
};

function makeSettingsResponse(overrides: Record<string, unknown> = {}) {
  return {
    llm_model: "openhands/claude-opus-4-5-20251101",
    llm_base_url: "",
    agent: "CodeActAgent",
    language: "en",
    llm_api_key: null,
    llm_api_key_set: true,
    search_api_key_set: false,
    confirmation_mode: false,
    security_analyzer: "llm",
    remote_runtime_resource_factor: 1,
    provider_tokens_set: {},
    enable_default_condenser: true,
    condenser_max_size: 240,
    enable_sound_notifications: false,
    user_consents_to_analytics: false,
    enable_proactive_conversation_starters: false,
    enable_solvability_analysis: false,
    max_budget_per_task: null,
    agent_settings_schema: AGENT_SETTINGS_SCHEMA,
    agent_settings: {
      llm: {
        model: "openhands/claude-opus-4-5-20251101",
        api_key: null,
        base_url: null,
      },
    },
    ...overrides,
  };
}

async function setupMocks(page: Page, settingsOverrides?: Record<string, unknown>) {
  // Skip onboarding
  await page.addInitScript(() => {
    window.localStorage.setItem("openhands-onboarded", "true");
  });

  const settingsResponse = makeSettingsResponse(settingsOverrides);

  await page.route("**/api/settings", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(settingsResponse),
      });
    } else {
      await route.continue();
    }
  });

  await page.route("**/api/settings/agent-schema", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(AGENT_SETTINGS_SCHEMA),
    });
  });

  await page.route("**/api/settings/conversation-schema", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({}),
    });
  });

  await page.route("**/api/conversations/search**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ results: [] }),
    });
  });

  // Mock models/providers endpoint (used by ModelSelector)
  await page.route("**/api/llm/models**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        openhands: ["claude-opus-4-5-20251101", "claude-sonnet-4-20250514"],
        anthropic: ["claude-sonnet-4-20250514", "claude-haiku-3-5-20241022"],
        openai: ["gpt-4o", "gpt-4o-mini"],
      }),
    });
  });

  await page.route("**/api/llm/providers**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(["openhands", "anthropic", "openai"]),
    });
  });
}

async function dismissConsentModal(page: Page) {
  await page
    .getByRole("button", { name: "Confirm preferences" })
    .click({ timeout: 3000 })
    .catch(() => undefined);
}

test.describe("LLM Settings Auth Section", () => {
  test.setTimeout(60000);

  test("shows Login with OpenHands for openhands model", async ({ page }) => {
    await setupMocks(page);
    await page.goto("/settings", { waitUntil: "networkidle" });
    await dismissConsentModal(page);

    const rootLayout = page.getByTestId("root-layout");
    await expect(rootLayout).toBeVisible({ timeout: 15000 });

    // The auth section should be visible with the device flow login button
    const authSection = page.getByTestId("llm-api-key-input-auth");
    await expect(authSection).toBeVisible({ timeout: 10000 });

    // The login button should be present
    const loginButton = page.getByTestId("llm-api-key-input-login-button");
    await expect(loginButton).toBeVisible();

    // Snapshot the settings page with openhands model auth section
    await expect(rootLayout).toHaveScreenshot(
      "llm-settings-openhands-auth.png",
      {
        maxDiffPixelRatio: 0.01,
        animations: "disabled",
      },
    );
  });
});
