import React from "react";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useForecastStore } from "../../store/useForecastStore";
import { GPS_LOCATION_ID } from "../../store/useLocationStore";
import { i18n } from "../../localization/i18n";
import { SegmentedControl } from "../SegmentedControl/SegmentedControl";
import { updateAllWeatherWidgets } from "../../widgets/widgetUpdater";

export const TempUnitSelector = () => {
  const tempScale = useSettingsStore((state) => state.tempScale);
  const setTempScale = useSettingsStore((state) => state.setTempScale);

  // Re-render the home-screen widgets in the new unit. We read the cached GPS
  // weather here (the store owns the data) and pass it in, so widgetUpdater never
  // imports the forecast store. NB: the argument is the payload, NOT the changed
  // segment value — SegmentedControl calls onAfterChange with the option value,
  // which we deliberately ignore.
  const pushUnitChangeToWidgets = async () => {
    const weather = await useForecastStore
      .getState()
      .getWeatherData(GPS_LOCATION_ID);
    if (weather) {
      await updateAllWeatherWidgets(weather);
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
