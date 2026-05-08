import type { ReactNode } from "react";
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "test-utils";
import { ConversationStatusDot } from "#/components/features/home/recent-conversations/conversation-status-dot";
import { V1ExecutionStatus } from "#/types/v1/core/base/common";

vi.mock("#/components/shared/buttons/styled-tooltip", () => ({
  StyledTooltip: ({
    children,
    content,
  }: {
    children: ReactNode;
    content: string;
  }) => (
    <div data-testid="styled-tooltip" data-content={content}>
      {children}
    </div>
  ),
}));

describe("ConversationStatusDot", () => {
  it.each([
    [V1ExecutionStatus.FINISHED, "conversation-status-check", "COMMON$FINISHED"],
    [V1ExecutionStatus.RUNNING, "conversation-status-working", "COMMON$WORKING"],
    [V1ExecutionStatus.PAUSED, "conversation-status-paused", "COMMON$PAUSED"],
    [V1ExecutionStatus.IDLE, "conversation-status-paused", "COMMON$PAUSED"],
    [
      V1ExecutionStatus.WAITING_FOR_CONFIRMATION,
      "conversation-status-paused",
      "COMMON$PAUSED",
    ],
    [V1ExecutionStatus.ERROR, "conversation-status-error", "COMMON$ERROR"],
    [V1ExecutionStatus.STUCK, "conversation-status-error", "COMMON$ERROR"],
  ])(
    "renders %s as %s",
    (status, testId, tooltipLabel) => {
      renderWithProviders(<ConversationStatusDot executionStatus={status} />);

      expect(screen.getByTestId(testId)).toBeInTheDocument();
      expect(screen.getByTestId("styled-tooltip")).toHaveAttribute(
        "data-content",
        tooltipLabel,
      );
    },
  );

  it("renders the unknown state for missing execution status", () => {
    renderWithProviders(<ConversationStatusDot executionStatus={undefined} />);

    expect(screen.getByTestId("conversation-status-unknown")).toBeInTheDocument();
    expect(screen.getByTestId("styled-tooltip")).toHaveAttribute(
      "data-content",
      "COMMON$STOPPED",
    );
  });
});
