"use no memo";
import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";
import { Weather } from "../types/WeatherTypes";
import { processWidgetData } from "./components/shared/BaseWeatherWidget";
import { DualTemperatureDisplay } from "./components/shared/DualTemperatureDisplay";
import { WeatherIcon } from "./components/shared/WeatherIcon";
import { convertWindSpeed } from "../utils/temperature";
import { calculateHourlyItemCount, getItemSpacing } from "./utils/widgetLayoutUtils";
import { palette } from "../styles/Palette";
import { getWidgetElementColor } from "./utils/widgetTheme";
import { formatDataAge } from "./utils/widgetDataUtils";
import { formatTime } from "../utils/dateFormatting";
import { i18n } from "../localization/i18n";
import { isRTLLanguage } from "../utils/rtlDetection";
import { useSettingsStore } from "../store/useSettingsStore";

interface WeatherStandardProps {
  weather: Weather;
  lastUpdated: Date;
  locationName: string;
  width?: number;   // Widget width in pixels for responsive layout
  height?: number;  // Widget height in pixels
  dataAge?: number; // Optional: Age of data in minutes (for stale data indicator)
}

// Helper component for hourly forecast item
const HourlyItem = ({
  forecast,
  tempScale,
  showBackground = true,
}: {
  forecast: any;
  tempScale: "C" | "F";
  showBackground?: boolean;
}) => {
  // Honor the user's clock-format preference (settings store is hydrated in the
  // widget context by the store-hydration gate).
  const timeText = formatTime(
    forecast.dt,
    useSettingsStore.getState().clockFormat
  );

  // Calculate wind speed
  const { value: windSpeed, unit: windUnit } = convertWindSpeed(
    forecast.wind_speed,
    tempScale
  );

  return (
    <FlexWidget
      style={{
        height: "match_parent",
        // width 0 WITH flex is what makes every column identical. Without an
        // explicit width the native side defaults to WRAP_CONTENT, and a
        // weighted WRAP_CONTENT child gets its natural size PLUS a share of the
        // leftover — so "5:00 אחה״צ" produced a visibly wider column than
        // "6:00 בערב". At width 0 the weight alone decides, so every column is
        // the same regardless of how long its label happens to be.
        width: 0,
        flex: 1,
        ...(showBackground && {
          backgroundColor: getWidgetElementColor(),
          borderRadius: 8,
          padding: 8,
        }),
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-evenly",
      }}
    >
      {/* Time and Precipitation */}
      <TextWidget
        text={timeText}
        style={{
          fontSize: 10,
          color: palette.highlightColor,
          marginBottom: 2,
        }}
      />

      <TextWidget
        text={`💧 ${Math.round(forecast.pop * 100)}%`}
        style={{
          fontSize: 9,
          color: palette.textColorSecondary,
          marginBottom: 4,
        }}
      />

      {/* Wind Speed */}
      <TextWidget
        text={`${Math.round(windSpeed)}${windUnit}`}
        style={{
          fontSize: 9,
          color: palette.textColorSecondary,
          marginBottom: 4,
        }}
      />

      {/* Weather Icon */}
      <WeatherIcon weatherId={forecast.weather[0].id} size="small" />

      {/* Dual Temperature. Stacked rather than left to wrap: the column was
          already narrow enough that the inline form broke onto a second line by
          itself, so this keeps the two-line shape but makes it deliberate —
          which is what lets the preferred scale carry its own weight and both
          lines carry their unit letter. */}
      <DualTemperatureDisplay
        temp={forecast.temp}
        size="small"
        tempScale={tempScale}
        layout="stacked"
        maxLines={1}
      />
    </FlexWidget>
  );
};

export function WeatherStandard({
  weather,
  lastUpdated,
  locationName,
  width,
  height,
  dataAge,
}: WeatherStandardProps) {
  const { processedData, tempScale } = processWidgetData({
    weather,
    lastUpdated,
    locationName,
    size: "standard",
  });

  // Calculate how many items to show based on width
  // If no width provided, default to 1 item (compact mode)
  const itemCount = width ? calculateHourlyItemCount(width, 4) : 1;
  const itemGap = getItemSpacing(itemCount);

  // Get forecast items based on calculated count
  const forecastItems = processedData.hourlyForecast.slice(0, Math.max(1, itemCount));

  // Check if widget is expanded (more than 1 cell wide)
  // Always use compact layout when itemCount is 1 or less
  const isExpanded = itemCount > 1;

  // Read from the locale rather than a store field: this also runs in the
  // headless widget context, where i18n is hydrated but React state is not.
  const isRTL = isRTLLanguage(i18n.locale);

  // Format age indicator if data is stale
  const ageText = dataAge !== undefined ? formatDataAge(dataAge) : null;

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

      {/* Hourly Forecast Items */}
      {isExpanded ? (
        // Expanded layout: Multiple items in a row with background containers
        <FlexWidget
          style={{
            flex: 1,
            width: "match_parent",
            flexDirection: "row",
            // NOT space-between: this renderer implements the space-* values by
            // injecting an invisible `flex: 1` child between every pair, which
            // both takes width from the real columns and makes their final
            // widths depend on content again. Spacing comes from flexGap.
            flexGap: itemGap,
          }}
        >
          {/* Chronological order carries the layout direction. In an RTL locale
              time reads right-to-left, so the earliest hour belongs on the
              right — this renderer has no layoutDirection and no row-reverse,
              so reversing the items is the only way to express that. */}
          {(isRTL ? [...forecastItems].reverse() : forecastItems).map((forecast) => (
            <HourlyItem
              key={forecast.dt}
              forecast={forecast}
              tempScale={tempScale}
              showBackground={true}
            />
          ))}
        </FlexWidget>
      ) : (
        // Compact layout: one item filling the space. It still draws its own
        // element background — at this size it used to rely on the root's solid
        // fill, which is now transparent, so without it the text would sit
        // directly on the wallpaper.
        forecastItems.length > 0 && (
          <HourlyItem
            forecast={forecastItems[0]}
            tempScale={tempScale}
            showBackground={true}
          />
        )
      )}

      {/* Age Indicator - Only shown if data is stale (>30 min) */}
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
