import React from "react";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useForecastStore } from "../../store/useForecastStore";
import { useLocationStore } from "../../store/useLocationStore";
import { i18n } from "../../localization/i18n";
import { SegmentedControl } from "../SegmentedControl/SegmentedControl";
import { updateAllWeatherWidgets } from "../../widgets/widgetUpdater";
import { resolveWidgetLocation } from "../../widgets/utils/widgetDataUtils";

export const TempUnitSelector = () => {
  const tempScale = useSettingsStore((state) => state.tempScale);
  const setTempScale = useSettingsStore((state) => state.setTempScale);

  // Re-render the home-screen widgets in the new unit. We resolve which
  // location the widgets show (GPS ?? active ?? first saved), read its cached
  // weather here (the store owns the data) and pass both in, so widgetUpdater
  // never imports the forecast store. NB: the argument is the payload, NOT the
  // changed segment value — SegmentedControl calls onAfterChange with the
  // option value, which we deliberately ignore.
  const pushUnitChangeToWidgets = async () => {
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
  };

  return (
    <SegmentedControl
      value={tempScale}
      onChange={setTempScale}
      onAfterChange={() => pushUnitChangeToWidgets()}
      options={[
        { value: "C", label: `${i18n.t("Celsius")} (°C)` },
        { value: "F", label: `${i18n.t("Fahrenheit")} (°F)` },
      ]}
    />
  );
};
