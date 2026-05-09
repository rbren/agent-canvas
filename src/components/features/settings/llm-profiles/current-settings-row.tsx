import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import EditIcon from "#/icons/u-edit.svg?react";

interface CurrentSettingsRowProps {
  model: string;
  hasApiKey: boolean;
  onEdit: () => void;
}

export function CurrentSettingsRow({
  model,
  hasApiKey,
  onEdit,
}: CurrentSettingsRowProps) {
  const { t } = useTranslation("openhands");

  return (
    <div
      data-testid="current-settings-row"
      className="flex items-center justify-between gap-3 px-5 py-4 bg-tertiary/20"
    >
      <div className="flex flex-col gap-1 min-w-0 flex-1 sm:flex-row sm:items-center sm:gap-3">
        <span className="font-medium text-white whitespace-nowrap">
          {t(I18nKey.SETTINGS$CURRENT_CONFIGURATION)}
        </span>
        <span
          className="text-sm text-gray-400 truncate min-w-0 max-w-full"
          title={model}
        >
          {model}
        </span>
        {hasApiKey && (
          <span
            className="text-xs bg-green-600/30 text-green-300 font-medium rounded-full px-2 py-0.5 whitespace-nowrap self-start sm:self-auto"
            data-testid="current-settings-api-key-badge"
          >
            {t(I18nKey.SETTINGS$PROFILE_API_KEY_SET)}
          </span>
        )}
        <span
          className="text-xs bg-amber-600/30 text-amber-300 font-medium rounded-full px-2 py-0.5 whitespace-nowrap self-start sm:self-auto"
          data-testid="current-settings-active-badge"
        >
          {t(I18nKey.SETTINGS$PROFILE_ACTIVE)}
        </span>
      </div>
      <div className="shrink-0">
        <button
          type="button"
          onClick={onEdit}
          aria-label={t(I18nKey.SETTINGS$PROFILE_EDIT)}
          className="cursor-pointer text-gray-300 hover:text-white p-2 border border-tertiary rounded-md"
          data-testid="current-settings-edit-button"
        >
          <EditIcon width={16} height={16} />
        </button>
      </div>
    </div>
  );
}
