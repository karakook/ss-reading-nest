import type { ReadingSession } from "@ss/shared";
import {
  DEFAULT_READING_PARTNER_COPY,
  type ReadingPartnerCopy
} from "../features/reading-partner/config.js";

export function ReadingSyncStatus({
  session,
  partner
}: {
  session: ReadingSession;
  partner?: ReadingPartnerCopy;
}) {
  const copy = partner ?? DEFAULT_READING_PARTNER_COPY;
  const user = session.userCurrentPosition;
  const assistant = session.assistantSyncedPosition;
  const pendingStart = (assistant?.index ?? 0) + 1;
  const hasGap = pendingStart <= user.index;

  return (
    <aside className="sync-status" aria-label="陪读同步状态">
      <span>{copy.viewerName}读到：{user.label}</span>
      <span>{copy.companionName}确认读到：{assistant?.label ?? "尚未同步"}</span>
      {hasGap ? (
        <span>
          待补课：第 {pendingStart}–{user.index} 页
        </span>
      ) : null}
    </aside>
  );
}
