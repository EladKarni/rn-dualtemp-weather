"use no memo";
import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";
import { Weather } from "../types/WeatherTypes";
import { processWidgetData } from "./components/shared/BaseWeatherWidget";
import { DualTemperatureDisplay } from "./components/shared/DualTemperatureDisplay";
import { WeatherIcon } from "./components/shared/WeatherIcon";
import { calculateDailyItemCount } from "./utils/widgetLayoutUtils";
import { palette } from "../styles/Palette";
import moment from "moment";
import { formatDataAge } from "./utils/widgetDataUtils";

interface WeatherExtendedProps {
  weather: Weather;
  lastUpdated: Date;
  locationName: string;
  width?: number;   // Optional: Widget width in pixels (3x1 = 270dp minimum)
  height?: number;  // Optional: Widget height in pixels for vertical expansion (40dp minimum)
  dataAge?: number; // Optional: Age of data in minutes (for stale data indicator)
}

// Compact horizontal row for single day (used at min height)
const CompactDailyRow = ({
  forecast,
  tempScale,
  isToday,
}: {
  forecast: any;
  tempScale: "C" | "F";
  isToday: boolean;
}) => {
  const dayText = isToday ? "Today" : moment(forecast.dt * 1000).format("ddd");

  return (
    <FlexWidget
      style={{
        width: "match_parent",
        height: "match_parent",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingLeft: 4,
        paddingRight: 4,
      }}
    >
      {/* Day name */}
      <TextWidget
        text={dayText}
        style={{
          fontSize: 14,
          fontWeight: "bold",
          color: palette.textColor,
        }}
      />

      {/* Weather Icon */}
      <WeatherIcon weatherId={forecast.weather[0].id} size="small" />

      {/* High Temp */}
      <FlexWidget style={{ flexDirection: "row", alignItems: "center" }}>
        <TextWidget text="Hi " style={{ color: palette.highlightColor, fontSize: 16 }} />
        <DualTemperatureDisplay
          temp={forecast.temp.max}
          size="small"
          tempScale={tempScale}
          separator=" / "
        />
      </FlexWidget>

      {/* Low Temp */}
      <FlexWidget style={{ flexDirection: "row", alignItems: "center" }}>
        <TextWidget text="Lo " style={{ color: palette.highlightColor, fontSize: 16 }} />
        <DualTemperatureDisplay
          temp={forecast.temp.min}
          size="small"
          tempScale={tempScale}
          separator=" / "
        />
      </FlexWidget>
    </FlexWidget>
  );
};

// Helper component for daily forecast item (used when expanded)
const DailyItem = ({
  forecast,
  tempScale,
  isToday,
}: {
  forecast: any;
  tempScale: "C" | "F";
  isToday: boolean;
}) => {
  const dayText = isToday ? "Today" : moment(forecast.dt * 1000).format("ddd");

  return (
    <FlexWidget
      style={{
        width: "match_parent",
        height: 56,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        borderRadius: 8,
        padding: 8,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {/* Day name */}
      <TextWidget
        text={dayText}
        style={{
          fontSize: 14,
          color: palette.highlightColor,
        }}
      />

      {/* Weather Icon */}
      <WeatherIcon weatherId={forecast.weather[0].id} size="small" />

      {/* High Temp */}
      <FlexWidget style={{ flexDirection: "row", alignItems: "center" }}>
        <TextWidget text="Hi " style={{ color: palette.highlightColor, fontSize: 16 }} />
        <DualTemperatureDisplay
          temp={forecast.temp.max}
          size="small"
          tempScale={tempScale}
          separator=" / "
        />
      </FlexWidget>

      {/* Low Temp */}
      <FlexWidget style={{ flexDirection: "row", alignItems: "center" }}>
        <TextWidget text="Lo " style={{ color: palette.highlightColor, fontSize: 16 }} />
        <DualTemperatureDisplay
          temp={forecast.temp.min}
          size="small"
          tempScale={tempScale}
          separator=" / "
        />
      </FlexWidget>
    </FlexWidget>
  );
};

export function WeatherExtended({
  weather,
  lastUpdated,
  locationName,
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
          backgroundColor: palette.primaryColor,
          borderRadius: 16,
          padding: 8,
          flexDirection: "row",
          alignItems: "center",
        }}
        clickAction="REFRESH"
      >
        <CompactDailyRow forecast={todayForecast} tempScale={tempScale} isToday={true} />

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
        backgroundColor: palette.primaryColor,
        borderRadius: 16,
        padding: 12,
        flexDirection: "column",
      }}
      clickAction="REFRESH"
    >
      {/* Daily Items - Vertical Column */}
      <FlexWidget
        style={{
          flex: 1,
          width: "match_parent",
          flexDirection: "column",
          justifyContent: "space-evenly",
        }}
      >
        {forecastItems.map((forecast, index) => (
          <DailyItem key={forecast.dt} forecast={forecast} tempScale={tempScale} isToday={index === 0} />
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
