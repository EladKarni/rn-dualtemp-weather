/**
 * The rgba() -> #RRGGBB normalisation that feeds the iOS widget payload.
 *
 * Worth its own file because the failure is silent in both directions: a wrong
 * conversion paints the widget a colour nobody chose, and a null the caller
 * mishandles paints it the default while the app shows the user's pick. Neither
 * throws, and neither is visible without a device.
 */
import { toHexColor } from "../hexColor";

describe("toHexColor", () => {
  it("converts the opaque rgba() form the widget themes are declared in", () => {
    // The six presets in src/styles/widgetThemes.ts all take this shape.
    expect(toHexColor("rgba(28, 27, 77, 1)")).toBe("#1C1B4D");
    expect(toHexColor("rgba(14, 16, 32, 1)")).toBe("#0E1020");
    expect(toHexColor("rgba(58, 21, 32, 1)")).toBe("#3A1520");
  });

  it("accepts rgb() without an alpha channel", () => {
    expect(toHexColor("rgb(28, 27, 77)")).toBe("#1C1B4D");
  });

  it("passes hex through, normalised, so a theme may be declared either way", () => {
    expect(toHexColor("#1c1b4d")).toBe("#1C1B4D");
    expect(toHexColor("#ABC")).toBe("#AABBCC");
  });

  it("pads single-digit channels instead of emitting a 5-character string", () => {
    // The regression this guards: toString(16) on 10 gives "a", and a naive
    // concatenation yields "#a1020" — five digits, which Swift's
    // `digits.count == 6` guard rejects, silently falling back to the default.
    expect(toHexColor("rgba(10, 5, 0, 1)")).toBe("#0A0500");
  });

  it("refuses a translucent colour rather than flattening it", () => {
    // Flattening would produce a colour that was never checked by
    // widgetThemes.contrast.test.ts, which is the whole basis for the claim
    // that every preset is legible.
    expect(toHexColor("rgba(28, 27, 77, 0.55)")).toBeNull();
    expect(toHexColor("rgba(28, 27, 77, 0)")).toBeNull();
  });

  it("returns null for what it cannot represent, rather than guessing", () => {
    for (const value of [
      "midnightblue",
      "hsl(240, 48%, 20%)",
      "#12345",
      "rgba(1, 2)",
      "",
      "   ",
      undefined,
      null,
    ]) {
      expect(toHexColor(value as string)).toBeNull();
    }
  });

  it("tolerates the whitespace variations a hand-edited theme may carry", () => {
    expect(toHexColor("  rgba(28,27,77,1)  ")).toBe("#1C1B4D");
    expect(toHexColor("rgba( 28 , 27 , 77 , 1 )")).toBe("#1C1B4D");
  });

  it("clamps out-of-range channels to a parseable result", () => {
    // Not expected from the theme table, but Swift rejects anything that is not
    // exactly six hex digits, so producing "#10000ff" would blank the colour.
    expect(toHexColor("rgba(300, -20, 77, 1)")).toBe("#FF004D");
  });
});
