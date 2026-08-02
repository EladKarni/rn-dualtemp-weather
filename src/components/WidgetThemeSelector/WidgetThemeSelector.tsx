import React from "react";
import { View, TouchableOpacity } from "react-native";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useForecastStore } from "../../store/useForecastStore";
import { useLocationStore } from "../../store/useLocationStore";
import { useLanguageStore } from "../../store/useLanguageStore";
import { WIDGET_THEME_LIST, type WidgetThemeId } from "../../styles/widgetThemes";
import { updateAllWeatherWidgets } from "../../widgets/widgetUpdater";
import { resolveWidgetLocation } from "../../widgets/utils/widgetDataUtils";
import { i18n } from "../../localization/i18n";
import { logger } from "../../utils/logger";
import { styles } from "./WidgetThemeSelector.styles";

/**
 * Picks the fill colour for the home-screen widgets' element cards.
 *
 * Swatches rather than a segmented control: six text labels don't fit a
 * settings row, and for colour the swatch *is* the label. The set is a fixed
 * list from widgetThemes, every entry contrast-checked against the widget's
 * text tiers — see widgetThemes.contrast.test.ts.
 */
export const WidgetThemeSelector = () => {
  const widgetTheme = useSettingsStore((state) => state.widgetTheme);
  const setWidgetTheme = useSettingsStore((state) => state.setWidgetTheme);
  const isRTL = useLanguageStore((state) => state.isRTL);

  /**
   * Repaint the home-screen widgets in the new colour. Same shape as
   * TempUnitSelector's push: resolve which location the widgets show, read its
   * cached weather here (the store owns the data) and pass both in, so
   * widgetUpdater never imports the forecast store.
   *
   * No-ops when nothing is cached yet — the widgets have nothing to draw, and
   * the next fetch repaints them with the new colour anyway.
   */
  const pushThemeChangeToWidgets = async () => {
    try {
      const locationStore = useLocationStore.getState();
      const widgetLocation = resolveWidgetLocation(
        locationStore.savedLocations,
        locationStore.activeLocationId,
      );
      if (!widgetLocation) {
        return;
      }
      const weather = await useForecastStore
        .getState()
        .getWeatherData(widgetLocation.id);
      if (weather) {
        await updateAllWeatherWidgets(weather, widgetLocation.id);
      }
    } catch (error) {
      // A failed repaint must not break the settings screen; the widgets pick
      // the new colour up on their next scheduled update regardless.
      logger.warn("Failed to push widget theme change to widgets:", error);
    }
  };

  const handleSelect = (id: WidgetThemeId) => {
    setWidgetTheme(id);
    void pushThemeChangeToWidgets();
  };

  return (
    <View style={[styles.container, isRTL && styles.containerRTL]}>
      {WIDGET_THEME_LIST.map((theme) => {
        const isActive = theme.id === widgetTheme;
        return (
          <TouchableOpacity
            key={theme.id}
            style={[styles.swatchTarget, isActive && styles.swatchTargetActive]}
            onPress={() => handleSelect(theme.id)}
            activeOpacity={0.7}
            accessibilityRole="radio"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={i18n.t(theme.labelKey)}
          >
            <View style={[styles.swatch, { backgroundColor: theme.element }]} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};
