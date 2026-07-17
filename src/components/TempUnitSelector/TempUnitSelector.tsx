import React from "react";
import { useSettingsStore } from "../../store/useSettingsStore";
import { i18n } from "../../localization/i18n";
import { SegmentedControl } from "../SegmentedControl/SegmentedControl";
import { updateAllWeatherWidgets } from "../../utils/widgetUpdater";

export const TempUnitSelector = () => {
  const tempScale = useSettingsStore((state) => state.tempScale);
  const setTempScale = useSettingsStore((state) => state.setTempScale);

  return (
    <SegmentedControl
      value={tempScale}
      onChange={setTempScale}
      onAfterChange={updateAllWeatherWidgets}
      options={[
        { value: "C", label: `${i18n.t("Celsius")} (°C)` },
        { value: "F", label: `${i18n.t("Fahrenheit")} (°F)` },
      ]}
    />
  );
};
