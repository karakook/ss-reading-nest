import { describe, expect, it } from "vitest";
import { polishKittyDrawerHtml } from "./kitty-drawer-chrome.js";

const oldCat = '<div class="cat-portrait"><span class="cat-ear left"></span><span class="cat-ear right"></span><span class="cat-face">● ●</span><span class="cat-bow">୨୧</span></div>';
const oldStars = '<div class="tiny-stars">✦ ୨୧ <em>✦</em> ୨୧ ✦</div>';
const source = '<!doctype html><html><head><style>body{margin:0}</style></head><body><section class="drawer" data-appearance="rose-noir">' + oldStars + '<div class="top-right">' + oldCat + '</div><button data-choose="ribbon-pearl">丝带珍珠</button><div id="thinking">TEXT</div></section></body></html>';

describe("cloud kitty drawer chrome v2", () => {
  it("replaces the odd CSS polygon cat and its overlapping text badge", () => {
    const output = polishKittyDrawerHtml(source);
    expect(output).toContain('class="kitty-icon"');
    expect(output).toContain('class="cat-charm"');
    expect(output).not.toContain('class="cat-ear left"');
    expect(output).not.toContain('class="cat-bow"');
    expect(output).toContain('class="tiny-stars tiny-stars-v2"');
    expect(output).toContain('id="kitty-cloud-chrome-v2"');
  });
  it("preserves all functional markup, including theme switching and body", () => {
    const output = polishKittyDrawerHtml(source);
    expect(output).toContain('data-choose="ribbon-pearl"');
    expect(output).toContain('id="thinking">TEXT');
    expect(output).toContain('data-appearance="rose-noir"');
    expect(output).toContain('</head>');
    expect(output).toContain('@media (max-width:380px)');
  });
  it("fails explicitly if the original markup changes so the polish cannot silently break", () => {
    expect(() => polishKittyDrawerHtml('<html><head></head><body>missing</body></html>')).toThrow(/cat markup/);
  });
});
