import React from "react";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useLanguageStore } from "../../store/useLanguageStore";
import { i18n } from "../../localization/i18n";
import { SegmentedControl } from "../SegmentedControl/SegmentedControl";

export const SunriseSunsetToggle = () => {
  const isRTL = useLanguageStore((state) => state.isRTL);
  const showSunriseSunset = useSettingsStore((state) => state.showSunriseSunset);
  const setShowSunriseSunset = useSettingsStore(
    (state) => state.setShowSunriseSunset
  );

  return (
    <SegmentedControl
      reversed={isRTL}
      value={showSunriseSunset}
      onChange={setShowSunriseSunset}
      options={[
        { value: true, label: i18n.t("Show") },
        { value: false, label: i18n.t("Hide") },
      ]}
    />
  );
};
