import type { ColorProp } from "react-native-android-widget";
import { useSettingsStore } from "../../store/useSettingsStore";
import { resolveWidgetTheme } from "../../styles/widgetThemes";

/**
 * The user's chosen fill for widget element cards.
 *
 * Read at render time via getState() rather than a hook: widget components run
 * in the headless task, outside any React provider tree. The settings store is
 * guaranteed hydrated before that render by `ensureStoresHydrated`, which
 * includes it for exactly this reason — the clock-format path already depends
 * on the same guarantee.
 *
 * Falls back to the default for any unrecognised persisted value, so a widget
 * render can never fail on a stale or unknown preference.
 */
export const getWidgetElementColor = (): ColorProp =>
  resolveWidgetTheme(useSettingsStore.getState().widgetTheme).element;
