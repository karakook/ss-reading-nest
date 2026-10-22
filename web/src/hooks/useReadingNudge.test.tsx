import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  READING_NUDGE_DELAY_MS,
  READING_NUDGE_MESSAGES,
  READING_NUDGE_STORAGE_KEY,
  readReadingNudgeEnabled,
  saveReadingNudgeEnabled,
  useReadingNudge
} from "./useReadingNudge.js";

describe("useReadingNudge", () => {
  let root: HTMLElement;
  let visibility: DocumentVisibilityState;
  let visibilityGetter: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    root = document.createElement("main");
    document.body.appendChild(root);
    visibility = "visible";
    visibilityGetter = vi.spyOn(document, "visibilityState", "get").mockImplementation(() => visibility);
    localStorage.clear();
  });

  afterEach(() => {
    root.remove();
    visibilityGetter.mockRestore();
    vi.useRealTimers();
    localStorage.clear();
  });

  function mount(enabled = true, paused = false, page = 1) {
    const readerRef = { current: root };
    return renderHook(
      ({ active, blocked, currentPage }) => useReadingNudge({
        enabled: active,
        paused: blocked,
        page: currentPage,
        readerRef
      }),
      { initialProps: { active: enabled, blocked: paused, currentPage: page } }
    );
  }

  it("shows exactly one of the gentle messages after five inactive minutes", () => {
    const { result } = mount();
    act(() => vi.advanceTimersByTime(READING_NUDGE_DELAY_MS - 1));
    expect(result.current.message).toBeNull();
    act(() => vi.advanceTimersByTime(1));
    expect(READING_NUDGE_MESSAGES).toContain(result.current.message);
    const firstMessage = result.current.message;
    act(() => vi.advanceTimersByTime(READING_NUDGE_DELAY_MS * 2));
    expect(result.current.message).toBe(firstMessage);
  });

  it("resets the countdown when the reader scrolls or receives a tap", () => {
    const { result } = mount();
    act(() => vi.advanceTimersByTime(READING_NUDGE_DELAY_MS - 1000));
    act(() => root.dispatchEvent(new Event("scroll")));
    act(() => vi.advanceTimersByTime(READING_NUDGE_DELAY_MS - 1000));
    expect(result.current.message).toBeNull();
    act(() => root.dispatchEvent(new Event("pointerdown")));
    act(() => vi.advanceTimersByTime(READING_NUDGE_DELAY_MS - 1));
    expect(result.current.message).toBeNull();
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.message).not.toBeNull();
  });

  it("does not open a popup in the background and waits a fresh five minutes on return", () => {
    const { result } = mount();
    act(() => vi.advanceTimersByTime(READING_NUDGE_DELAY_MS - 500));
    act(() => {
      visibility = "hidden";
      document.dispatchEvent(new Event("visibilitychange"));
      vi.advanceTimersByTime(READING_NUDGE_DELAY_MS * 2);
    });
    expect(result.current.message).toBeNull();
    act(() => {
      visibility = "visible";
      document.dispatchEvent(new Event("visibilitychange"));
    });
    act(() => vi.advanceTimersByTime(READING_NUDGE_DELAY_MS - 1));
    expect(result.current.message).toBeNull();
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.message).not.toBeNull();
  });

  it("pauses during other reading dialogs and restarts after they close", () => {
    const { result, rerender } = mount(true, true);
    act(() => vi.advanceTimersByTime(READING_NUDGE_DELAY_MS * 2));
    expect(result.current.message).toBeNull();
    rerender({ active: true, blocked: false, currentPage: 1 });
    act(() => vi.advanceTimersByTime(READING_NUDGE_DELAY_MS));
    expect(result.current.message).not.toBeNull();
  });

  it("allows dismissal, uses a different next message, and can disable reminders", () => {
    const { result, rerender } = mount();
    act(() => vi.advanceTimersByTime(READING_NUDGE_DELAY_MS));
    const previous = result.current.message;
    act(() => result.current.dismiss());
    expect(result.current.message).toBeNull();
    act(() => vi.advanceTimersByTime(READING_NUDGE_DELAY_MS));
    expect(result.current.message).not.toBe(previous);
    rerender({ active: false, blocked: false, currentPage: 1 });
    expect(result.current.message).toBeNull();
    act(() => vi.advanceTimersByTime(READING_NUDGE_DELAY_MS * 2));
    expect(result.current.message).toBeNull();
  });

  it("saves an opt-out choice locally", () => {
    expect(readReadingNudgeEnabled()).toBe(true);
    saveReadingNudgeEnabled(false);
    expect(localStorage.getItem(READING_NUDGE_STORAGE_KEY)).toBe("false");
    expect(readReadingNudgeEnabled()).toBe(false);
    saveReadingNudgeEnabled(true);
    expect(readReadingNudgeEnabled()).toBe(true);
  });
});
