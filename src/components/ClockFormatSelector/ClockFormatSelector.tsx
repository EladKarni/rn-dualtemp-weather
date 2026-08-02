import React from "react";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useLanguageStore } from "../../store/useLanguageStore";
import { i18n } from "../../localization/i18n";
import { SegmentedControl } from "../SegmentedControl/SegmentedControl";

export const ClockFormatSelector = () => {
  const isRTL = useLanguageStore((state) => state.isRTL);
  const clockFormat = useSettingsStore((state) => state.clockFormat);
  const setClockFormat = useSettingsStore((state) => state.setClockFormat);

  return (
    <SegmentedControl
      reversed={isRTL}
      value={clockFormat}
      onChange={setClockFormat}
      options={[
        { value: "12hour", label: i18n.t("Format12Hour") },
        { value: "24hour", label: i18n.t("Format24Hour") },
        { value: "auto", label: i18n.t("AutoFormat") },
      ]}
    />
  );
};
