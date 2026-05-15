import React from "react";
import { useTranslation } from "react-i18next";
import { ModelSelector } from "#/components/shared/modals/settings/model-selector";
import { useAgentSettingsSchema } from "#/hooks/query/use-agent-settings-schema";
import { useSettings } from "#/hooks/query/use-settings";
import { SettingsInput } from "#/components/features/settings/settings-input";
import { HelpLink } from "#/ui/help-link";
import { KeyStatusIcon } from "#/components/features/settings/key-status-icon";
import {
  SdkSectionHeaderProps,
  SdkSectionPage,
  SdkSectionSaveControl,
} from "#/components/features/settings/sdk-settings/sdk-section-page";
import { LlmSettingsLocalView } from "#/components/features/settings/llm-profiles";
import { I18nKey } from "#/i18n/declaration";
import { Settings, SettingsSchema, SettingsScope } from "#/types/settings";
import { extractModelAndProvider } from "#/utils/extract-model-and-provider";
import { useActiveBackend } from "#/contexts/active-backend-context";
import {
  inferInitialView,
  type SettingsFormValues,
  type SettingsView,
} from "#/utils/sdk-settings-schema";
import { DEFAULT_SETTINGS } from "#/services/settings";
import { DeviceFlowAuth } from "#/components/features/backends/device-flow-auth";
import { BrandButton } from "#/components/features/settings/brand-button";
import { getRegisteredBackends } from "#/api/backend-registry/active-store";
import { PRODUCT_URL } from "#/utils/constants";

const LLM_EXCLUDED_KEYS = new Set(["llm.model", "llm.api_key", "llm.base_url"]);

const buildModelId = (provider: string | null, model: string | null) => {
  if (!provider || !model) return null;
  return `${provider}/${model}`;
};

const getSchemaFieldDefaultValue = (
  schema: SettingsSchema | null | undefined,
  fieldKey: string,
) =>
  schema?.sections
    .flatMap((section) => section.fields)
    .find((field) => field.key === fieldKey)?.default ?? null;

const KNOWN_PROVIDER_DEFAULT_BASE_URLS: Partial<Record<string, Set<string>>> = {
  openai: new Set(["https://api.openai.com", "https://api.openai.com/v1"]),
  openhands: new Set([
    "https://llm-proxy.app.all-hands.dev",
    "https://llm-proxy.app.all-hands.dev/v1",
  ]),
  litellm_proxy: new Set([
    "https://llm-proxy.app.all-hands.dev",
    "https://llm-proxy.app.all-hands.dev/v1",
  ]),
};

const normalizeBaseUrl = (baseUrl: string) => {
  try {
    const parsedUrl = new URL(baseUrl);
    const normalizedPath = parsedUrl.pathname.replace(/\/+$/, "") || "";
    return `${parsedUrl.origin}${normalizedPath}`;
  } catch {
    return baseUrl.trim().replace(/\/+$/, "");
  }
};

const isProviderDefaultBaseUrl = (model: string, baseUrl: string) => {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const { provider } = extractModelAndProvider(model);

  if (provider) {
    const knownDefaults = KNOWN_PROVIDER_DEFAULT_BASE_URLS[provider];
    if (knownDefaults) {
      return knownDefaults.has(normalizedBaseUrl);
    }
  }

  return Object.values(KNOWN_PROVIDER_DEFAULT_BASE_URLS).some((knownDefaults) =>
    knownDefaults?.has(normalizedBaseUrl),
  );
};

/**
 * Find the first registered cloud backend that has an API key.
 * Returns `null` if none exists.
 */
function findCloudBackendWithKey(): { name: string; apiKey: string } | null {
  const backends = getRegisteredBackends();
  const cloud = backends.find((b) => b.kind === "cloud" && b.apiKey);
  return cloud ? { name: cloud.name, apiKey: cloud.apiKey } : null;
}

interface OpenHandsApiKeyAuthProps {
  testId: string;
  onApiKeyObtained: (key: string) => void;
  isDisabled?: boolean;
}

/**
 * Auth section shown when an `openhands/*` model is selected. Provides
 * three ways to obtain the API key, in order of convenience:
 *
 * 1. "Use existing OpenHands key" — one-click if the user already has a
 *    cloud backend registered with a key.
 * 2. "Login with OpenHands" — device flow OAuth to get a new key.
 * 3. Manual entry — the standard API key input (rendered separately by
 *    the caller below this component).
 */
function OpenHandsApiKeyAuth({
  testId,
  onApiKeyObtained,
  isDisabled,
}: OpenHandsApiKeyAuthProps) {
  const { t } = useTranslation("openhands");
  const cloudBackend = React.useMemo(findCloudBackendWithKey, []);

  return (
    <div
      className="flex flex-col gap-3"
      data-testid={`${testId}-auth`}
    >
      {/* Option 1: Use existing cloud backend key */}
      {cloudBackend && (
        <BrandButton
          type="button"
          variant="secondary"
          onClick={() => onApiKeyObtained(cloudBackend.apiKey)}
          testId={`${testId}-use-existing-key`}
          className="w-full"
          isDisabled={isDisabled}
        >
          🔑 {t(I18nKey.SETTINGS$USE_EXISTING_OPENHANDS_KEY)}{" "}
          <span className="text-xs opacity-70">
            ({t(I18nKey.SETTINGS$OPENHANDS_KEY_FROM_BACKEND, { name: cloudBackend.name })})
          </span>
        </BrandButton>
      )}

      {/* Option 2: Device flow login */}
      <DeviceFlowAuth
        host={PRODUCT_URL.PRODUCTION}
        onSuccess={onApiKeyObtained}
        testIdRoot={testId}
        isDisabled={isDisabled}
      />

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 border-t border-gray-600" />
        <span className="text-xs text-gray-500 uppercase">
          {t(I18nKey.SETTINGS$OR_ENTER_MANUALLY)}
        </span>
        <div className="flex-1 border-t border-gray-600" />
      </div>
    </div>
  );
}

export function LlmSettingsScreen({
  scope = "personal",
  onSaveSuccess,
  initialValueOverrides,
  embedded,
  hideSaveButton,
  onSaveControlChange,
}: {
  scope?: SettingsScope;
  /** Optional hook fired after a successful save (e.g. advance an onboarding step). */
  onSaveSuccess?: () => void;
  /** Forwarded to {@link SdkSectionPage}. */
  initialValueOverrides?: SettingsFormValues;
  /** Forwarded to {@link SdkSectionPage}. */
  embedded?: boolean;
  /** Forwarded to {@link SdkSectionPage}. */
  hideSaveButton?: boolean;
  /** Forwarded to {@link SdkSectionPage}. */
  onSaveControlChange?: (control: SdkSectionSaveControl) => void;
}) {
  const { t } = useTranslation("openhands");

  const { data: settings } = useSettings(scope);
  const { data: schema } = useAgentSettingsSchema(
    settings?.agent_settings_schema,
  );

  const defaultModel = String(
    (DEFAULT_SETTINGS.agent_settings?.llm as Record<string, unknown>)?.model ??
      "",
  );

  const getInitialView = React.useCallback(
    (
      currentSettings: Settings,
      filteredSchema: SettingsSchema,
    ): SettingsView => {
      const schemaView = inferInitialView(currentSettings, filteredSchema);
      if (schemaView !== "basic") {
        return schemaView;
      }

      const currentModel = currentSettings.llm_model ?? "";
      const trimmedBaseUrl = currentSettings.llm_base_url?.trim() ?? "";
      const hasCustomBaseUrl =
        trimmedBaseUrl.length > 0 &&
        !isProviderDefaultBaseUrl(currentModel, trimmedBaseUrl);

      return hasCustomBaseUrl ? "all" : "basic";
    },
    [],
  );

  const buildHeader = React.useCallback(
    ({ values, isDisabled, view, onChange }: SdkSectionHeaderProps) => {
      const modelValue =
        typeof values["llm.model"] === "string" ? values["llm.model"] : "";
      const baseUrlValue =
        typeof values["llm.base_url"] === "string"
          ? values["llm.base_url"]
          : "";
      const isOpenHandsModel = modelValue.startsWith("openhands/");

      const handleApiKeyObtained = (key: string) => {
        onChange("llm.api_key", key);
      };

      const renderApiKeySection = (testId: string, helpTestId: string) => (
        <>
          {isOpenHandsModel ? (
            <OpenHandsApiKeyAuth
              testId={testId}
              onApiKeyObtained={handleApiKeyObtained}
              isDisabled={isDisabled}
            />
          ) : null}

          <SettingsInput
            testId={testId}
            label={t(I18nKey.SETTINGS_FORM$API_KEY)}
            type="password"
            className="w-full"
            value={
              typeof values["llm.api_key"] === "string"
                ? values["llm.api_key"]
                : ""
            }
            placeholder={settings?.llm_api_key_set ? "<hidden>" : ""}
            onChange={(value) => onChange("llm.api_key", value)}
            isDisabled={isDisabled}
            startContent={
              settings?.llm_api_key_set ? (
                <KeyStatusIcon isSet={settings.llm_api_key_set} />
              ) : undefined
            }
          />

          {!isOpenHandsModel && (
            <HelpLink
              testId={helpTestId}
              text={t(I18nKey.SETTINGS$DONT_KNOW_API_KEY)}
              linkText={t(I18nKey.SETTINGS$CLICK_FOR_INSTRUCTIONS)}
              href="https://docs.openhands.dev/usage/local-setup#getting-an-api-key"
            />
          )}
        </>
      );

      return (
        <div className="flex flex-col gap-6">
          {view === "basic" ? (
            <div
              className="flex flex-col gap-6"
              data-testid="llm-settings-form-basic"
            >
              <ModelSelector
                currentModel={modelValue || undefined}
                currentBaseUrl={baseUrlValue || undefined}
                onChange={(provider, model) => {
                  const nextModel = buildModelId(provider, model);
                  if (nextModel) {
                    onChange("llm.model", nextModel);
                  }
                }}
                wrapperClassName="!flex-col !gap-6"
                isDisabled={isDisabled}
              />

              {renderApiKeySection(
                "llm-api-key-input",
                "llm-api-key-help-anchor",
              )}
            </div>
          ) : (
            <div
              className="flex flex-col gap-6"
              data-testid="llm-settings-form-advanced"
            >
              <SettingsInput
                testId="llm-custom-model-input"
                label={t(I18nKey.SETTINGS$CUSTOM_MODEL)}
                type="text"
                className="w-full"
                value={modelValue}
                placeholder={defaultModel}
                onChange={(value) => onChange("llm.model", value)}
                isDisabled={isDisabled}
              />

              <SettingsInput
                testId="base-url-input"
                label={t(I18nKey.SETTINGS$BASE_URL)}
                type="text"
                className="w-full"
                value={baseUrlValue}
                placeholder="https://api.openai.com"
                onChange={(value) => onChange("llm.base_url", value)}
                isDisabled={isDisabled}
              />

              {renderApiKeySection(
                "llm-api-key-input",
                "llm-api-key-help-anchor-advanced",
              )}
            </div>
          )}
        </div>
      );
    },
    [defaultModel, settings?.llm_api_key_set, t],
  );

  const buildPayload = React.useCallback(
    (
      basePayload: Record<string, unknown>,
      context: {
        values: Record<string, string | boolean>;
        view: SettingsView;
      },
    ) => {
      // basePayload is a nested dict (e.g. {llm: {model: "gpt-4"}})
      const agentSettings = structuredClone(basePayload);

      const llm = (agentSettings.llm ?? {}) as Record<string, unknown>;

      if (context.view === "basic") {
        llm.base_url = getSchemaFieldDefaultValue(schema, "llm.base_url");
        agentSettings.llm = llm;
      }

      return { agent_settings_diff: agentSettings };
    },
    [schema],
  );

  return (
    <SdkSectionPage
      scope={scope}
      sectionKeys={["llm"]}
      excludeKeys={LLM_EXCLUDED_KEYS}
      header={buildHeader}
      buildPayload={buildPayload}
      getInitialView={getInitialView}
      forceShowAdvancedView
      allowAllView
      onSaveSuccess={onSaveSuccess}
      initialValueOverrides={initialValueOverrides}
      embedded={embedded}
      hideSaveButton={hideSaveButton}
      onSaveControlChange={onSaveControlChange}
      testId="llm-settings-screen"
    />
  );
}

/**
 * Default export for the route renders different views based on backend type:
 * - Local backends: LlmSettingsLocalView with profile management
 * - Cloud backends: Standard LlmSettingsScreen (profiles are not supported)
 *
 * The LlmSettingsScreen component is also exported for embedded use cases
 * (e.g., onboarding, profile editing forms).
 *
 * Note: This is a route file, only the router should import the default export.
 * Other consumers should use the named export `LlmSettingsScreen` for embedded
 * use cases.
 */
export default function LlmSettingsRoute() {
  const { backend } = useActiveBackend();
  const isCloud = backend.kind === "cloud";

  // Cloud backends use the standard LLM settings form (no profiles support)
  if (isCloud) {
    return <LlmSettingsScreen />;
  }

  // Local backends use the profile management view
  return <LlmSettingsLocalView />;
}
