import React from "react";
import { useTranslation } from "react-i18next";
import { AxiosError } from "axios";
import { Check } from "lucide-react";
import { BrandButton } from "#/components/features/settings/brand-button";
import { I18nKey } from "#/i18n/declaration";
import { cn } from "#/utils/utils";
import { useSaveSettings } from "#/hooks/mutation/use-save-settings";
import { ACP_PROVIDERS } from "#/constants/acp-providers";
import {
  displayErrorToast,
  displaySuccessToast,
} from "#/utils/custom-toast-handlers";
import { retrieveAxiosErrorMessage } from "#/utils/retrieve-axios-error-message";

export type OnboardingAgentId =
  | "openhands"
  | "claude-code"
  | "codex"
  | "gemini-cli";

interface AgentOption {
  id: OnboardingAgentId;
  label: string;
  descriptionKey: I18nKey;
}

const AGENT_OPTIONS: AgentOption[] = [
  {
    id: "openhands",
    label: "OpenHands",
    descriptionKey: I18nKey.ONBOARDING$AGENT_OPENHANDS_DESCRIPTION,
  },
  {
    id: "claude-code",
    label: "Claude Code",
    descriptionKey: I18nKey.ONBOARDING$AGENT_CLAUDE_CODE_DESCRIPTION,
  },
  {
    id: "codex",
    label: "Codex",
    descriptionKey: I18nKey.ONBOARDING$AGENT_CODEX_DESCRIPTION,
  },
  {
    id: "gemini-cli",
    label: "Gemini CLI",
    descriptionKey: I18nKey.ONBOARDING$AGENT_GEMINI_CLI_DESCRIPTION,
  },
];

/**
 * Resolve the ``agent_settings_diff`` payload for an onboarding selection.
 *
 * - ``openhands`` is the default and only needs ``agent_kind`` (the existing
 *   LLM-shaped fields stay put).
 * - The ACP options use ``ACP_PROVIDERS`` for the provider key + default
 *   command, matching what the Settings → Agent page emits. ``acp_command``
 *   is intentionally ``[]`` on the default-command path: the backend
 *   resolves the actual command from its own registry, so we don't pin a
 *   stale command here if the SDK registry changes upstream.
 */
function buildAgentSettingsDiff(
  agentId: OnboardingAgentId,
): Record<string, unknown> | null {
  if (agentId === "openhands") {
    return { agent_kind: "openhands" };
  }
  const provider = ACP_PROVIDERS.find(({ key }) => key === agentId);
  if (!provider) {
    return null;
  }
  return {
    agent_kind: "acp",
    acp_server: provider.key,
    acp_command: [],
    acp_model: null,
  };
}

interface ChooseAgentStepProps {
  selectedAgentId: OnboardingAgentId;
  onSelect: (agentId: OnboardingAgentId) => void;
  onNext: () => void;
}

export function ChooseAgentStep({
  selectedAgentId,
  onSelect,
  onNext,
}: ChooseAgentStepProps) {
  const { t } = useTranslation("openhands");
  const { mutate: saveSettings, isPending: isSaving } = useSaveSettings();

  const handleNext = () => {
    const diff = buildAgentSettingsDiff(selectedAgentId);
    if (!diff) {
      // Unknown id (shouldn't be reachable through the UI). Advance
      // without writing — better to show the next step than block the
      // user behind a silent no-op.
      onNext();
      return;
    }

    saveSettings(
      { agent_settings_diff: diff },
      {
        onError: (error) => {
          const message = retrieveAxiosErrorMessage(error as AxiosError);
          displayErrorToast(message || t(I18nKey.ERROR$GENERIC));
        },
        onSuccess: () => {
          displaySuccessToast(t(I18nKey.SETTINGS$SAVED));
          onNext();
        },
      },
    );
  };

  return (
    <div
      data-testid="onboarding-step-choose-agent"
      className="flex flex-col gap-6"
    >
      <header className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold text-white">
          {t(I18nKey.ONBOARDING$AGENT_TITLE)}
        </h2>
        <p className="text-sm text-gray-400">
          {t(I18nKey.ONBOARDING$AGENT_SUBTITLE)}
        </p>
      </header>

      <div
        role="radiogroup"
        aria-label={t(I18nKey.ONBOARDING$AGENT_TITLE)}
        className="flex flex-col gap-3"
      >
        {AGENT_OPTIONS.map((option) => {
          const isSelected = option.id === selectedAgentId;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              data-testid={`onboarding-agent-option-${option.id}`}
              data-selected={isSelected}
              onClick={() => onSelect(option.id)}
              className={cn(
                "flex items-start justify-between gap-4 rounded-xl border px-4 py-3 text-left transition-colors",
                "cursor-pointer hover:border-primary/60 hover:bg-white/5",
                isSelected
                  ? "border-primary bg-primary/10"
                  : "border-white/10 bg-base-secondary",
              )}
            >
              <div className="flex flex-col gap-1">
                <span className="text-base font-medium text-white">
                  {option.label}
                </span>
                <span className="text-xs text-gray-400">
                  {t(option.descriptionKey)}
                </span>
              </div>
              {isSelected ? (
                <Check
                  width={18}
                  height={18}
                  className="mt-1 shrink-0 text-primary"
                  aria-hidden
                />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="sticky bottom-0 flex justify-end bg-base-secondary pt-4 pb-7">
        <BrandButton
          testId="onboarding-agent-next"
          type="button"
          variant="primary"
          isDisabled={isSaving}
          onClick={handleNext}
        >
          {isSaving ? t(I18nKey.SETTINGS$SAVING) : t(I18nKey.ONBOARDING$NEXT)}
        </BrandButton>
      </div>
    </div>
  );
}
