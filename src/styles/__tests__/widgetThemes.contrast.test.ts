/**
 * Every selectable widget theme must be legible with the text the widgets draw
 * on top of it.
 *
 * This is what makes a fixed preset list safe where a free colour picker would
 * not be: the guarantee is checked here, once, instead of depending on what a
 * user picks. Adding a colour to WIDGET_THEMES without checking it will fail
 * this test rather than ship an unreadable widget.
 *
 * Thresholds are WCAG AA: 4.5:1 for normal text, 3:1 for large or bold text.
 * The tiers below are the actual colours and sizes rendered inside an element
 * card — see WeatherStandard / WeatherExtended / WeatherCompact.
 */
import { WIDGET_THEMES, WIDGET_THEME_LIST, DEFAULT_WIDGET_THEME, resolveWidgetTheme, isWidgetThemeId } from "../widgetThemes";
import { palette } from "../Palette";

/** Parse "rgba(r, g, b, a)" or "#RRGGBB(AA)" to [r,g,b]. */
const toRgb = (color: string): [number, number, number] => {
  const rgba = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgba) {
    return [Number(rgba[1]), Number(rgba[2]), Number(rgba[3])];
  }
  let hex = color.replace("#", "");
  // Expand 3-digit shorthand — palette.textColor is "#fff", and slicing that as
  // 6-digit silently yields NaN rather than failing loudly.
  if (hex.length === 3) {
    hex = hex.split("").map((c) => c + c).join("");
  }
  return [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
  ];
};

const relativeLuminance = ([r, g, b]: [number, number, number]): number => {
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

const contrast = (a: string, b: string): number => {
  const la = relativeLuminance(toRgb(a));
  const lb = relativeLuminance(toRgb(b));
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
};

/** The text tiers actually drawn on an element card, with their AA threshold. */
const TEXT_TIERS: { name: string; color: string; minRatio: number }[] = [
  // Large, bold temperatures.
  { name: "primary temperature", color: palette.textColor, minRatio: 3 },
  // ~10px labels (time, day names, Hi/Lo).
  { name: "highlight labels", color: palette.highlightColor, minRatio: 4.5 },
  // ~9px precipitation / wind.
  { name: "secondary detail", color: palette.textColorSecondary, minRatio: 4.5 },
  // ~9px stale-data age indicator.
  { name: "age indicator", color: "#9CA3AF", minRatio: 4.5 },
];

describe("widget theme contrast", () => {
  describe.each(WIDGET_THEME_LIST.map((t) => [t.id, t] as const))(
    "%s",
    (_id, theme) => {
      it.each(TEXT_TIERS.map((t) => [t.name, t] as const))(
        "is legible for %s",
        (_name, tier) => {
          expect(contrast(theme.element, tier.color)).toBeGreaterThanOrEqual(
            tier.minRatio
          );
        }
      );

      it("is fully opaque, so contrast can't depend on the wallpaper", () => {
        // A translucent fill composites with whatever is behind it, which would
        // make the ratios asserted above meaningless on a light wallpaper.
        const alpha = theme.element.match(/rgba?\([^)]*,\s*([\d.]+)\s*\)/);
        if (alpha) {
          expect(Number(alpha[1])).toBe(1);
        } else {
          // 8-digit hex: alpha must be FF. 6-digit is opaque by definition.
          const hex = theme.element.replace("#", "");
          if (hex.length === 8) {
            expect(hex.slice(6).toLowerCase()).toBe("ff");
          }
        }
      });
    }
  );
});

describe("widget theme resolution", () => {
  it("exposes the default as a real theme", () => {
    expect(WIDGET_THEMES[DEFAULT_WIDGET_THEME]).toBeDefined();
  });

  it("keeps the id and the record key in sync", () => {
    for (const [key, theme] of Object.entries(WIDGET_THEMES)) {
      expect(theme.id).toBe(key);
    }
  });

  it.each([
    ["an unknown id", "chartreuse"],
    ["null", null],
    ["undefined", undefined],
    ["a number", 42],
    ["an object", {}],
  ])("falls back to the default for %s", (_label, value) => {
    // The widget task reads this from AsyncStorage in a headless context, where
    // the value may predate the feature or name a preset since removed. It must
    // render the default, never throw.
    expect(resolveWidgetTheme(value)).toBe(WIDGET_THEMES[DEFAULT_WIDGET_THEME]);
  });

  it("accepts every shipped id", () => {
    for (const theme of WIDGET_THEME_LIST) {
      expect(isWidgetThemeId(theme.id)).toBe(true);
      expect(resolveWidgetTheme(theme.id)).toBe(theme);
    }
  });
});
