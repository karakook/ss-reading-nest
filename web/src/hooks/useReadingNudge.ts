import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

/** Only active, visible reading time counts toward a gentle attention check. */
export const READING_NUDGE_DELAY_MS = 5 * 60 * 1000;
export const READING_NUDGE_STORAGE_KEY = "reading-nest-focus-nudge-enabled";

export const READING_NUDGE_MESSAGES = [
  "咪？巴巴刚刚听见一只小猫悄悄溜走的脚步声。回来陪我读两段嘛。",
  "抓到一只开小差的小猫！不罚你，找到刚才那句话就算过关。",
  "巴巴轻轻敲敲书页：我们只读下一段，好不好？",
  "小猫是不是被别的事情勾走啦？书页还在这里等你呢。",
  "不用急着读很多。先把目光放回刚刚读到的那一行就好。",
  "喵呜，阅读小巡逻来了！小猫今天想再翻过一页吗？",
  "走神也没关系，巴巴帮你守着这里。回来读几句，就算重新开始。",
  "小猫，五分钟没有动静啦。是在认真思考，还是偷偷摸鱼呀？",
  "巴巴来查岗：不考你读了多少，只邀请你再读一小段。",
  "如果真的累了，也可以安心休息。想继续时，我们从这一页接着读。"
] as const;

export function readReadingNudgeEnabled(): boolean {
  try {
    return window.localStorage.getItem(READING_NUDGE_STORAGE_KEY) !== "false";
  } catch {
    return true;
  }
}

export function saveReadingNudgeEnabled(enabled: boolean): void {
  try {
    window.localStorage.setItem(READING_NUDGE_STORAGE_KEY, String(enabled));
  } catch {
    // The embedded host may not expose localStorage. Keep the in-memory choice.
  }
}

export function useReadingNudge({
  enabled,
  paused,
  page,
  readerRef,
  delayMs = READING_NUDGE_DELAY_MS
}: {
  enabled: boolean;
  paused: boolean;
  page: number;
  readerRef: RefObject<HTMLElement | null>;
  delayMs?: number;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const lastMessageIndex = useRef(-1);
  const dismiss = useCallback(() => setMessage(null), []);

  // A changed page or an explicit off switch clears any old nudge.
  useEffect(() => {
    setMessage(null);
  }, [page, enabled]);

  useEffect(() => {
    if (!enabled || paused || message !== null) return;

    let timeout: ReturnType<typeof setTimeout> | undefined;
    const clear = () => {
      if (timeout !== undefined) clearTimeout(timeout);
      timeout = undefined;
    };
    const schedule = () => {
      clear();
      if (document.visibilityState === "hidden") return;
      timeout = setTimeout(() => {
        // The visibility check also protects against a late timer dispatched
        // just as iOS moves ChatGPT into the background.
        if (document.visibilityState === "hidden") return;
        const count = READING_NUDGE_MESSAGES.length;
        const previous = lastMessageIndex.current;
        const candidate = Math.floor(Math.random() * (count - (previous >= 0 ? 1 : 0)));
        const next = previous >= 0 && candidate >= previous ? candidate + 1 : candidate;
        lastMessageIndex.current = next;
        setMessage(READING_NUDGE_MESSAGES[next] ?? READING_NUDGE_MESSAGES[0]);
      }, delayMs);
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") clear();
      else schedule(); // A fresh five minutes after returning to ChatGPT.
    };

    const reader = readerRef.current;
    reader?.addEventListener("pointerdown", schedule, { passive: true });
    reader?.addEventListener("touchstart", schedule, { passive: true });
    reader?.addEventListener("wheel", schedule, { passive: true });
    // Scroll events don't bubble; capture observes scrolling inside the book.
    reader?.addEventListener("scroll", schedule, true);
    window.addEventListener("keydown", schedule);
    document.addEventListener("visibilitychange", onVisibilityChange);
    schedule();

    return () => {
      clear();
      reader?.removeEventListener("pointerdown", schedule);
      reader?.removeEventListener("touchstart", schedule);
      reader?.removeEventListener("wheel", schedule);
      reader?.removeEventListener("scroll", schedule, true);
      window.removeEventListener("keydown", schedule);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [enabled, paused, page, message, readerRef, delayMs]);

  return { message, dismiss };
}
