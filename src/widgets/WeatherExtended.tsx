"use no memo";
import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";
import { Weather } from "../types/WeatherTypes";
import { processWidgetData } from "./components/shared/BaseWeatherWidget";
import { DualTemperatureDisplay } from "./components/shared/DualTemperatureDisplay";
import { WeatherIcon } from "./components/shared/WeatherIcon";
import {
  calculateDailyItemCount,
  calculateDailyRowDensity,
  getItemSpacing,
  type DailyRowDensity,
} from "./utils/widgetLayoutUtils";
import { palette } from "../styles/Palette";
import { getWidgetElementColor } from "./utils/widgetTheme";
import moment from "moment";
import { formatDataAge } from "./utils/widgetDataUtils";
import { i18n } from "../localization/i18n";
import { isRTLLanguage } from "../utils/rtlDetection";

interface WeatherExtendedProps {
  weather: Weather;
  lastUpdated: Date;
  locationName: string;
  width?: number;   // Widget width in dp — drives row density (2-5 cells)
  height?: number;  // Widget height in dp — drives how many days are shown
  dataAge?: number; // Optional: Age of data in minutes (for stale data indicator)
}

type DailyRowVariant = "compact" | "card";

// Single daily-forecast row. `compact` is the borderless single-row layout used
// at min height; `card` is the boxed layout used in the expanded vertical list.
// Only the outer container and the day-label style differ between the two.
const DailyForecastRow = ({
  forecast,
  tempScale,
  isToday,
  variant,
  density,
}: {
  forecast: any;
  tempScale: "C" | "F";
  isToday: boolean;
  /** Vertical: how the row is boxed. Driven by widget height. */
  variant: DailyRowVariant;
  /** Horizontal: how much detail fits. Driven by widget width. */
  density: DailyRowDensity;
}) => {
  // "Today" is localized via i18n; other day labels come from moment, whose
  // locale is hydrated in the widget context (Worker C's store-hydration gate).
  const dayText = isToday
    ? i18n.t("Today")
    : moment(forecast.dt * 1000).format("ddd");
  const isCompact = variant === "compact";
  // Read from the locale rather than a store field: this also runs in the
  // headless widget context, where i18n has been hydrated but React state has
  // not. isRTLLanguage normalises "he-IL" and friends to "he".
  const isRTL = isRTLLanguage(i18n.locale);
  // The two axes are independent: `variant` comes from height, `density` from
  // width, and every combination has to render.
  // The icon survives every width — dropping the high/low pair frees far more
  // room than it occupies, and it is the most scannable thing in the row.
  // UV is added last and dropped first. Everything else in the row is load
  // bearing — the day says when, the icon says what, the labels say which of
  // the two readings is the high — so UV is the only element that can go
  // without the row losing meaning, and it waits for a width that has room to
  // spare rather than competing with the labels for a width that does not.
  const showUv = density === "wide";
  const showHiLoLabels = density === "wide" || density === "full";
  // At the narrowest width a high/low pair means four numbers competing for a
  // two-cell row, which overflows. One dual-scale average reads cleanly and
  // still answers "how warm is that day".
  const showAverageOnly = density === "narrow";
  const averageTemp = (forecast.temp.min + forecast.temp.max) / 2;
  // Only the widest row has room for the roomy form: at 16dp a dual-scale
  // reading is ~60dp against ~48dp at 13dp, and two of them plus UV only fit
  // once the widget clears the `wide` threshold.
  const isTight = density !== "wide";
  const tempSize = isTight ? "tiny" : "small";
  const tempSeparator = isTight ? "/" : " / ";
  // Labels sit a step below the reading they qualify, so the eye lands on the
  // temperature first.
  const labelSize = isTight ? 12 : 14;

  // Every column except the temperatures gets a FIXED width, sized for its
  // known-longest content, and only the temperatures are weighted. That is what
  // makes the columns line up: the fixed widths are identical in every row
  // whatever the row's text, and the temperature blocks then split all the
  // remaining space equally, so they too are identical row to row.
  //
  // "Today" is the longest day label by construction — every other day is a
  // three-letter abbreviation — so sizing the day column for it means no
  // English label truncates. A longer localized label truncates rather than
  // displacing its neighbours, which is the better of the two failures.
  const DAY_COLUMN_WIDTH = 44;
  const ICON_COLUMN_WIDTH = 26;
  const UV_COLUMN_WIDTH = 38;

  // A dual-scale reading with its label, e.g. "Hi 32° / 89°". In an RTL locale
  // the label belongs to the right of the number, so the pair reverses too —
  // reversing only the outer row would leave each column internally LTR.
  const labelledTemp = (key: string, labelKey: string, temp: number) => {
    const parts = [
      showHiLoLabels ? (
        <TextWidget
          key="label"
          text={i18n.t(labelKey)}
          style={{ color: palette.highlightColor, fontSize: labelSize }}
        />
      ) : null,
      <DualTemperatureDisplay
        key="temp"
        temp={temp}
        size={tempSize}
        tempScale={tempScale}
        separator={tempSeparator}
        maxLines={1}
      />,
    ].filter(Boolean);

    return (
      <FlexWidget
        key={key}
        style={{ flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center", flexGap: 4 }}
      >
        {isRTL ? parts.reverse() : parts}
      </FlexWidget>
    );
  };

  // Columns in reading order, then reversed wholesale for RTL. This renderer
  // exposes no layoutDirection and its flexDirection is only 'row' | 'column',
  // so reversing the children is the only way to put the day on the right where
  // a Hebrew or Arabic reader expects it.
  //
  // An ARRAY is safe where a React.Fragment is not: the renderer calls every
  // element type as a function, so a Fragment throws
  // "Symbol(react.fragment) is not a function" and drops the whole widget to
  // the error view. Arrays are ordinary children.
  const columns = [
    <FlexWidget key="day" style={{ width: DAY_COLUMN_WIDTH, flexDirection: "row", alignItems: "center" }}>
      <TextWidget
        text={dayText}
        style={
          isCompact
            ? { fontSize: 14, fontWeight: "bold", color: palette.textColor }
            : { fontSize: 14, color: palette.highlightColor }
        }
      />
    </FlexWidget>,

    <FlexWidget key="icon" style={{ width: ICON_COLUMN_WIDTH, flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
      <WeatherIcon weatherId={forecast.weather[0].id} size="small" />
    </FlexWidget>,

    // UV is added last and dropped first — see showUv above.
    showUv ? (
      <FlexWidget key="uv" style={{ width: UV_COLUMN_WIDTH, flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
        <TextWidget
          text={`${i18n.t("WidgetUV")} ${Math.round(forecast.uvi)}`}
          style={{ color: palette.highlightColor, fontSize: 14 }}
        />
      </FlexWidget>
    ) : null,

    // At the narrowest width a high/low pair is four numbers competing for a
    // two-cell row, so one dual-scale average replaces them.
    showAverageOnly ? (
      <FlexWidget key="avg" style={{ flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
        <DualTemperatureDisplay
          temp={averageTemp}
          size={tempSize}
          tempScale={tempScale}
          separator={tempSeparator}
          maxLines={1}
        />
      </FlexWidget>
    ) : null,

    showAverageOnly ? null : labelledTemp("hi", "WidgetHi", forecast.temp.max),
    showAverageOnly ? null : labelledTemp("lo", "WidgetLo", forecast.temp.min),
  ].filter(Boolean);

  // kept inline so react-native-android-widget's style props stay contextually
  // typed (its FlexWidgetStyle/TextWidgetStyle aren't re-exported to annotate).
  return (
    <FlexWidget
      style={
        isCompact
          ? {
              width: "match_parent",
              height: "match_parent",
              // Carries its own element fill for the same reason the card
              // variant does: the root is transparent, so a row without one
              // would render straight onto the wallpaper.
              backgroundColor: getWidgetElementColor(),
              borderRadius: 8,
              flexDirection: "row",
              alignItems: "center",
              flexGap: 4,
              paddingLeft: 8,
              paddingRight: 8,
            }
          : {
              width: "match_parent",
              // flex rather than a fixed height, mirroring the hourly columns in
              // WeatherStandard: the rows fill the axis so the visible spacing
              // comes from the container's flexGap alone, instead of whatever
              // leftover height justifyContent happened to distribute.
              flex: 1,
              backgroundColor: getWidgetElementColor(),
              borderRadius: 8,
              padding: 8,
              flexDirection: "row",
              alignItems: "center",
              flexGap: 4,
            }
      }
    >
      {/* Column ORDER carries the layout direction; see `columns` above for why
          it cannot be done with a style. */}
      {isRTL ? [...columns].reverse() : columns}
    </FlexWidget>
  );
};

export function WeatherExtended({
  weather,
  lastUpdated,
  locationName,
  width,
  height,
  dataAge,
}: WeatherExtendedProps) {
  const { processedData, tempScale } = processWidgetData({
    weather,
    lastUpdated,
    locationName,
    size: "extended",
  });

  // Calculate how many items to show based on height
  // If no height provided, default to 1 item (compact mode)
  const itemCount = height ? calculateDailyItemCount(height, 7) : 1;
  const isCompact = itemCount <= 1;

  // Height decides how many days fit; width decides how much of each row fits.
  const density = calculateDailyRowDensity(width);

  // Get daily forecast items (first item is today)
  const forecastItems = processedData.dailyForecast.slice(0, Math.max(1, itemCount));

  // Format age indicator if data is stale
  const ageText = dataAge !== undefined ? formatDataAge(dataAge) : null;

  // Compact mode: single horizontal row, no header/footer
  if (isCompact) {
    const todayForecast = forecastItems[0];
    return (
      <FlexWidget
        style={{
          height: "match_parent",
          width: "match_parent",
          backgroundColor: palette.widgetSurface,
          borderRadius: 16,
          padding: 8,
          flexDirection: "row",
          alignItems: "center",
        }}
        clickAction="REFRESH"
      >
        <DailyForecastRow
          forecast={todayForecast}
          tempScale={tempScale}
          isToday={true}
          variant="compact"
          density={density}
        />

        {/* Age Indicator for compact mode - positioned at end of row */}
        {ageText && (
          <TextWidget
            text={ageText}
            style={{
              fontSize: 9,
              color: "#9CA3AF",
              textAlign: "right",
              marginLeft: 4,
            }}
          />
        )}
      </FlexWidget>
    );
  }

  // Expanded mode: vertical list with multiple days
  return (
    <FlexWidget
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundColor: palette.widgetSurface,
        borderRadius: 16,
        padding: 12,
        flexDirection: "column",
      }}
      clickAction="REFRESH"
    >
      {/* Daily Items - Vertical Column. Spacing comes from the same
          getItemSpacing() helper the hourly columns use, so the gap between
          daily rows and the gap between hourly columns stay identical. */}
      <FlexWidget
        style={{
          flex: 1,
          width: "match_parent",
          flexDirection: "column",
          justifyContent: "space-between",
          flexGap: getItemSpacing(itemCount),
        }}
      >
        {forecastItems.map((forecast, index) => (
          <DailyForecastRow
            key={forecast.dt}
            forecast={forecast}
            tempScale={tempScale}
            isToday={index === 0}
            variant="card"
            density={density}
          />
        ))}
      </FlexWidget>

      {/* Age Indicator for expanded mode - shown at bottom */}
      {ageText && (
        <TextWidget
          text={ageText}
          style={{
            fontSize: 9,
            color: "#9CA3AF",
            textAlign: "center",
            marginTop: 4,
          }}
        />
      )}
    </FlexWidget>
  );
}

export default WeatherExtended;
