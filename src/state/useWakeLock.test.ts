import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { useWakeLock } from "./useWakeLock";

const release = vi.fn(() => Promise.resolve());
const request = vi.fn(() => Promise.resolve({ release }));

describe("useWakeLock", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "wakeLock", {
      configurable: true,
      value: { request },
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(navigator, "wakeLock");
    vi.clearAllMocks();
  });

  test("ne demande rien quand inactif", () => {
    renderHook(() => {
      useWakeLock(false);
    });
    expect(request).not.toHaveBeenCalled();
  });

  test("demande le verrou écran, le redemande au retour et le libère", async () => {
    const { unmount } = renderHook(() => {
      useWakeLock(true);
    });
    await act(() => Promise.resolve());
    expect(request).toHaveBeenCalledWith("screen");

    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
      await Promise.resolve();
    });
    expect(request).toHaveBeenCalledTimes(2);

    unmount();
    expect(release).toHaveBeenCalled();
  });
});
