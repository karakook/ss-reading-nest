import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => cleanup());

// pdfjs checks this browser API during module initialization. jsdom lacks it;
// DOMMatrix-dependent rendering is exercised in a real browser, not in unit tests.
if (!("DOMMatrix" in globalThis)) {
  class TestDOMMatrix {
    a = 1;
    b = 0;
    c = 0;
    d = 1;
    e = 0;
    f = 0;
    multiplySelf() { return this; }
    preMultiplySelf() { return this; }
    translateSelf() { return this; }
    scaleSelf() { return this; }
    invertSelf() { return this; }
    rotateSelf() { return this; }
  }
  Object.defineProperty(globalThis, "DOMMatrix", { configurable: true, value: TestDOMMatrix });
}
