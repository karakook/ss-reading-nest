export type ReadingPartnerCopy = {
  appName: string;
  viewerName: string;
  companionName: string;
  roomName: string;
};

/**
 * UI copy is kept in one configurable object so a future profile or host
 * setting can provide different names without changing reading behaviour.
 */
export const DEFAULT_READING_PARTNER_COPY: ReadingPartnerCopy = {
  appName: "和星星共读",
  viewerName: "小猫",
  companionName: "巴巴",
  roomName: "小猫和巴巴的私人书房"
};

export function resolveReadingPartnerCopy(
  overrides?: Partial<ReadingPartnerCopy>
): ReadingPartnerCopy {
  return { ...DEFAULT_READING_PARTNER_COPY, ...overrides };
}
