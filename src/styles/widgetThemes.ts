/**
 * Selectable fill colours for the home-screen widgets' elements.
 *
 * Every entry here is OPAQUE on purpose. A translucent fill composites against
 * the user's wallpaper, which makes legibility depend on something the app does
 * not control — measured on device, the brand indigo at 0.55 alpha gave the
 * secondary text tier 7.05 contrast over a dark wallpaper but only 2.98 over a
 * light one, well under the 4.5 WCAG AA wants for text that small. Opaque fills
 * are wallpaper-independent, so a preset that passes passes everywhere.
 *
 * The set is deliberately a fixed list rather than a free colour picker: with
 * fixed presets the contrast guarantee is checked once, in
 * widgetThemes.contrast.test.ts, and cannot be broken by a user choice. That
 * test is the reason this list is safe — extend it and the test will tell you
 * immediately if a new colour fails a text tier.
 *
 * Both entries come from the on-device comparison of candidate fills; nothing
 * here is invented. `indigo` is that comparison's option 2 (the app's
 * primaryDark) and `midnight` its option 1 (the neutral near-black), each in
 * opaque form. Its option 5 was primaryDark at 0.85 alpha, which collapses into
 * `indigo` once opacity is required, so it is not a separate entry.
 *
 * Both brand blues were candidates and are deliberately absent:
 * primaryColor #3621DC reaches only 3.38 against the secondary tier and
 * primaryLight #6B58FF only 1.82, because they sit close to
 * `textColorSecondary` (#a19ad8) in both luminance and hue. Neither is usable
 * without also changing that text colour — the comparison flagged the same
 * thing about its options 3 and 4.
 *
 * Ids removed from this list are handled, not orphaned: resolveWidgetTheme
 * falls back to the default for anything it does not recognise, so an install
 * still holding a retired preset renders the default rather than breaking.
 */

import type { ColorProp } from "react-native-android-widget";

export type WidgetThemeId = "indigo" | "midnight";

export interface WidgetTheme {
  id: WidgetThemeId;
  /**
   * Opaque fill for the widget's element cards. Typed as the widget library's
   * ColorProp — a template literal union — so a malformed colour string is a
   * compile error here rather than a silently unstyled widget at render.
   */
  element: ColorProp;
  /** i18n key for the swatch's accessibility label. */
  labelKey: string;
}

/** Order here is the order the swatches render in. */
export const WIDGET_THEMES: Record<WidgetThemeId, WidgetTheme> = {
  indigo: { id: "indigo", element: "rgba(28, 27, 77, 1)", labelKey: "WidgetThemeIndigo" },
  midnight: { id: "midnight", element: "rgba(14, 16, 32, 1)", labelKey: "WidgetThemeMidnight" },
};

/** Matches the brand indigo the widgets shipped with before the picker existed. */
export const DEFAULT_WIDGET_THEME: WidgetThemeId = "indigo";

export const WIDGET_THEME_LIST: WidgetTheme[] = Object.values(WIDGET_THEMES);

export const isWidgetThemeId = (value: unknown): value is WidgetThemeId =>
  typeof value === "string" && value in WIDGET_THEMES;

/**
 * Resolve a persisted value to a theme, falling back to the default.
 *
 * Deliberately tolerant: the id is read in the headless widget task from
 * whatever AsyncStorage holds, which may predate this feature or come from a
 * build that offered a preset since removed. An unknown value must render the
 * default, never crash a widget render.
 */
export const resolveWidgetTheme = (value: unknown): WidgetTheme =>
  WIDGET_THEMES[isWidgetThemeId(value) ? value : DEFAULT_WIDGET_THEME];
