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
  const showIcon = density !== "narrow";
  const showHiLoLabels = density === "full";
  const tempSeparator = density === "narrow" ? "/" : " / ";

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
            }
      }
    >
      {/* Day name */}
      <TextWidget
        text={dayText}
        style={
          isCompact
            ? { fontSize: 14, fontWeight: "bold", color: palette.textColor }
            : { fontSize: 14, color: palette.highlightColor }
        }
      />

      {/* Weather Icon — first thing dropped when the widget is at its narrowest */}
      {showIcon && <WeatherIcon weatherId={forecast.weather[0].id} size="small" />}

      {/* High Temp */}
      <FlexWidget style={{ flexDirection: "row", alignItems: "center" }}>
        {showHiLoLabels && (
          <TextWidget text={`${i18n.t("WidgetHi")} `} style={{ color: palette.highlightColor, fontSize: 16 }} />
        )}
        <DualTemperatureDisplay
          temp={forecast.temp.max}
          size="small"
          tempScale={tempScale}
          separator={tempSeparator}
        />
      </FlexWidget>

      {/* Low Temp */}
      <FlexWidget style={{ flexDirection: "row", alignItems: "center" }}>
        {showHiLoLabels && (
          <TextWidget text={`${i18n.t("WidgetLo")} `} style={{ color: palette.highlightColor, fontSize: 16 }} />
        )}
        <DualTemperatureDisplay
          temp={forecast.temp.min}
          size="small"
          tempScale={tempScale}
          separator={tempSeparator}
        />
      </FlexWidget>
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
