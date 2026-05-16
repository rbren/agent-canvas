import { CheckCircle2, CircleAlert, Rocket, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import type { RecommendedAutomation } from "#/constants/recommended-automations";
import type { MarketplaceEntry } from "#/constants/mcp-marketplace";
import type { MCPServerConfig } from "#/types/mcp-server";
import { ModalBackdrop } from "#/components/shared/modals/modal-backdrop";
import { BrandButton } from "#/components/features/settings/brand-button";
import { McpLogoBadge } from "#/components/features/mcp-logo-badge";
import { findInstalledMatch } from "#/utils/mcp-marketplace-utils";
import { cn } from "#/utils/utils";

interface RecommendedAutomationSetupModalProps {
  automation: RecommendedAutomation;
  requiredEntries: MarketplaceEntry[];
  installedServers: MCPServerConfig[];
  isLaunching: boolean;
  onInstallMcp: (entry: MarketplaceEntry) => void;
  onLaunch: () => void;
  onClose: () => void;
}

export function RecommendedAutomationSetupModal({
  automation,
  requiredEntries,
  installedServers,
  isLaunching,
  onInstallMcp,
  onLaunch,
  onClose,
}: RecommendedAutomationSetupModalProps) {
  const { t } = useTranslation("openhands");

  const missingEntries = requiredEntries.filter(
    (entry) => !findInstalledMatch(entry.template, installedServers),
  );
  const readyToLaunch = missingEntries.length === 0;

  return (
    <ModalBackdrop onClose={onClose} aria-label={automation.name}>
      <div
        data-testid="recommended-automation-modal"
        className="flex max-h-[85vh] w-[720px] max-w-[90vw] flex-col gap-4 overflow-y-auto rounded-xl border border-[var(--oh-border)] bg-base-secondary p-6 custom-scrollbar"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted">
              {automation.category}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-white">
              {automation.name}
            </h2>
            <p className="mt-1 text-sm text-muted">{automation.description}</p>
          </div>
          <button
            type="button"
            aria-label={t(I18nKey.RECOMMENDED_AUTOMATIONS$MODAL_CLOSE_ARIA)}
            onClick={onClose}
            className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-raised hover:text-content"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div>
          <h3 className="text-sm font-medium text-content">
            {t(I18nKey.RECOMMENDED_AUTOMATIONS$MODAL_AGENT_PROMPT)}
          </h3>
          <div className="mt-2 rounded-lg border border-[var(--oh-border)] bg-[var(--oh-surface)] p-4 text-sm leading-6 text-muted">
            {automation.prompt}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-content">
            {t(I18nKey.RECOMMENDED_AUTOMATIONS$MODAL_EXAMPLE_IMPLEMENTATION)}
          </h3>
          <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-[var(--oh-border)] bg-[var(--oh-surface)] p-4 text-xs leading-5 text-muted">
            {automation.exampleImplementation}
          </pre>
        </div>

        <div>
          <h3 className="text-sm font-medium text-content">
            {t(I18nKey.RECOMMENDED_AUTOMATIONS$MODAL_REQUIRED_MCPS)}
          </h3>
          <p className="mt-1 text-xs leading-5 text-muted">
            {t(I18nKey.RECOMMENDED_AUTOMATIONS$MODAL_REQUIRED_MCPS_DESCRIPTION)}
          </p>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {requiredEntries.map((entry) => {
              const installed = !!findInstalledMatch(
                entry.template,
                installedServers,
              );
              return (
                <div
                  key={entry.id}
                  className="rounded-lg border border-[var(--oh-border)] bg-[var(--oh-surface)] p-4"
                >
                  <div className="flex items-start gap-3">
                    <McpLogoBadge entry={entry} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-content">
                        {entry.name}
                      </div>
                      <div
                        className={cn(
                          "mt-1 inline-flex items-center gap-1 text-xs",
                          installed ? "text-primary" : "text-muted",
                        )}
                      >
                        {installed ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <CircleAlert className="h-3.5 w-3.5" />
                        )}
                        {installed
                          ? t(I18nKey.RECOMMENDED_AUTOMATIONS$CONNECTED)
                          : t(I18nKey.RECOMMENDED_AUTOMATIONS$NEEDS_SETUP)}
                      </div>
                    </div>
                  </div>
                  {!installed && (
                    <BrandButton
                      type="button"
                      variant="secondary"
                      testId={`recommended-automation-install-${entry.id}`}
                      className="mt-3 w-full justify-center"
                      onClick={() => onInstallMcp(entry)}
                    >
                      {t(I18nKey.RECOMMENDED_AUTOMATIONS$ADD_MCP, {
                        name: entry.name,
                      })}
                    </BrandButton>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {!readyToLaunch && (
          <p className="text-xs leading-5 text-muted">
            {t(I18nKey.RECOMMENDED_AUTOMATIONS$REQUIRED_REMAINING, {
              count: missingEntries.length,
            })}
          </p>
        )}

        <div className="grid grid-cols-2 gap-2 pt-2">
          <BrandButton
            type="button"
            variant="primary"
            testId="recommended-automation-launch"
            className="w-full justify-center"
            isDisabled={!readyToLaunch || isLaunching}
            aria-busy={isLaunching}
            startContent={<Rocket className="h-4 w-4" />}
            onClick={onLaunch}
          >
            {isLaunching
              ? t(I18nKey.RECOMMENDED_AUTOMATIONS$LAUNCHING)
              : t(I18nKey.RECOMMENDED_AUTOMATIONS$LAUNCH_CONVERSATION)}
          </BrandButton>
          <BrandButton
            type="button"
            variant="secondary"
            className="w-full justify-center"
            onClick={onClose}
          >
            {t(I18nKey.BUTTON$CANCEL)}
          </BrandButton>
        </div>
      </div>
    </ModalBackdrop>
  );
}
