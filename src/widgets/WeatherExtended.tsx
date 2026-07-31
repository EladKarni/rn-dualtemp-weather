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
  // The two axes are independent: `variant` comes from height, `density` from
  // width, and every combination has to render.
  // The icon survives every width — dropping the high/low pair frees far more
  // room than it occupies, and it is the most scannable thing in the row.
  // At four cells there is room for exactly one thing beyond day/icon/high/low,
  // and UV is the better use of it than "Hi"/"Lo" word labels — position already
  // says which number is which, whereas UV is information the row does not
  // otherwise carry. The labels therefore wait for the widest size, where they
  // fit without squeezing the temperatures onto two lines.
  const showUv = density === "full" || density === "wide";
  const showHiLoLabels = density === "wide";
  // At the narrowest width a high/low pair means four numbers competing for a
  // two-cell row, which overflows. One dual-scale average reads cleanly and
  // still answers "how warm is that day".
  const showAverageOnly = density === "narrow";
  const averageTemp = (forecast.temp.min + forecast.temp.max) / 2;
  // Every column except the temperatures gets a FIXED width, sized for its
  // known-longest content. Two reasons:
  //
  //  - This renderer treats `flex` as grow-only, with content still setting the
  //    minimum, so a weighted column does not actually pin anything: "Today" is
  //    wider than its share and pushes every later column right.
  //  - With the fixed columns removed from the equation, the temperature blocks
  //    split *all* remaining space equally, so they are the same width in every
  //    row and at every density. That is what makes the temps line up.
  //
  // "Today" is the longest label by construction — every other day is a
  // three-letter abbreviation — so sizing for it means no English label
  // truncates. A longer localized label truncates rather than displacing its
  // neighbours, which is the better of the two failures.
  // Narrow rows need a smaller type and a tighter separator or the nine-character
  // dual-scale reading wraps; wider rows can afford the roomier form.
  // Only the widest row has room for the roomy form. Four cells already carries
  // day + icon + UV + two dual-scale readings; at 16dp those nine-character
  // readings overflow and wrap, so everything below `wide` uses the tight one.
  const isTight = density !== "wide";
  const tempSize = isTight ? "tiny" : "small";
  const tempSeparator = isTight ? "/" : " / ";

  const DAY_COLUMN_WIDTH = 44;
  const ICON_COLUMN_WIDTH = 26;
  const UV_COLUMN_WIDTH = 38;

  // Only the outer container and the day-label style differ between variants;
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
              justifyContent: "space-between",
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
              justifyContent: "space-between",
              flexGap: 4,
            }
      }
    >
      {/* Every column is flex-weighted rather than auto-sized. With auto widths
          and space-between, a long day label ("Today") left different leftover
          space than a short one ("Fri"), so the icon and temperatures landed at
          a different x in each row and the columns visibly failed to line up.
          A fixed width on the day column plus weights on the rest gives every
          row identical column geometry regardless of how long its text is. */}

      {/* Day name */}
      <FlexWidget style={{ width: DAY_COLUMN_WIDTH, flexDirection: "row", alignItems: "center" }}>
        <TextWidget
          text={dayText}
          style={
            isCompact
              ? { fontSize: 14, fontWeight: "bold", color: palette.textColor }
              : { fontSize: 14, color: palette.highlightColor }
          }
        />
      </FlexWidget>

      {/* Weather Icon */}
      <FlexWidget style={{ width: ICON_COLUMN_WIDTH, flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
        <WeatherIcon weatherId={forecast.weather[0].id} size="small" />
      </FlexWidget>

      {/* Max UV index for the day — only the widest row has room for it, and it
          is the metric the hourly widget does not already cover. */}
      {showUv && (
        <FlexWidget style={{ width: UV_COLUMN_WIDTH, flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
          <TextWidget
            text={`${i18n.t("WidgetUV")} ${Math.round(forecast.uvi)}`}
            style={{ color: palette.highlightColor, fontSize: 14 }}
          />
        </FlexWidget>
      )}

      {/* Narrowest width: a single dual-scale average replaces the pair.
          NB: these are sibling conditionals rather than a ternary with a
          fragment. react-native-android-widget's renderer calls every element
          type as a function, so a React Fragment throws
          "Symbol(react.fragment) is not a function" and takes the whole render
          down to the error widget. */}
      {showAverageOnly && (
        <FlexWidget style={{ flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
          <DualTemperatureDisplay
            temp={averageTemp}
            size={tempSize}
            tempScale={tempScale}
            separator={tempSeparator}
          />
        </FlexWidget>
      )}

      {/* High Temp */}
      {!showAverageOnly && (
        <FlexWidget style={{ flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
          {showHiLoLabels && (
            <TextWidget text={`${i18n.t("WidgetHi")} `} style={{ color: palette.highlightColor, fontSize: 13 }} />
          )}
          <DualTemperatureDisplay
            temp={forecast.temp.max}
            size={tempSize}
            tempScale={tempScale}
            separator={tempSeparator}
          />
        </FlexWidget>
      )}

      {/* Low Temp */}
      {!showAverageOnly && (
        <FlexWidget style={{ flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
          {showHiLoLabels && (
            <TextWidget text={`${i18n.t("WidgetLo")} `} style={{ color: palette.highlightColor, fontSize: 13 }} />
          )}
          <DualTemperatureDisplay
            temp={forecast.temp.min}
            size={tempSize}
            tempScale={tempScale}
            separator={tempSeparator}
          />
        </FlexWidget>
      )}
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
