"use no memo";
import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";
import { Weather } from "../types/WeatherTypes";
import { processWidgetData } from "./components/shared/BaseWeatherWidget";
import { DualTemperatureDisplay } from "./components/shared/DualTemperatureDisplay";
import { WeatherIcon } from "./components/shared/WeatherIcon";
import { calculateDailyItemCount } from "./utils/widgetLayoutUtils";
import moment from "moment";

interface WeatherExtendedProps {
  weather: Weather;
  lastUpdated: Date;
  locationName: string;
  width?: number;   // Optional: Widget width in pixels (3x2 = 270dp minimum)
  height?: number;  // Optional: Widget height in pixels for vertical expansion (110dp minimum)
}

// Helper component for daily forecast item
const DailyItem = ({
  forecast,
  tempScale,
}: {
  forecast: any;
  tempScale: "C" | "F";
}) => {
  // Format day name
  const dayText = moment(forecast.dt * 1000).format("ddd");

  return (
    <FlexWidget
      style={{
        width: "match_parent",
        height: 60,
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
          color: "#E5E7EB",
          width: 40,
        }}
      />

      {/* Weather Icon */}
      <WeatherIcon weatherId={forecast.weather[0].id} size="small" />

      {/* High/Low Temps */}
      <FlexWidget style={{ flexDirection: "row", alignItems: "center", flex: 1, justifyContent: "flex-end" }}>
        <DualTemperatureDisplay
          temp={forecast.temp.max}
          size="small"
          tempScale={tempScale}
          separator=" / "
        />
        <TextWidget text=" • " style={{ color: "#6B7280", fontSize: 12 }} />
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
}: WeatherExtendedProps) {
  const { processedData, tempScale } = processWidgetData({
    weather,
    lastUpdated,
    locationName,
    size: "extended",
  });

  // Calculate how many items to show based on height
  // If no height provided, default to 1 item
  const itemCount = height ? calculateDailyItemCount(height, 7) : 1;

  // Get daily forecast items
  const forecastItems = processedData.dailyForecast.slice(0, Math.max(1, itemCount));

  return (
    <FlexWidget
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundColor: "#3621dcff", // palette.primaryColor
        borderRadius: 16,
        padding: 16,
        flexDirection: "column",
      }}
      clickAction="REFRESH"
    >
      {/* Header */}
      <FlexWidget style={{ width: "match_parent", alignItems: "center", marginBottom: 8 }}>
        <TextWidget
          text="Daily Forecast"
          style={{ fontSize: 16, fontWeight: "bold", color: "#E5E7EB" }}
        />
      </FlexWidget>

      {/* Daily Items - Vertical Column */}
      <FlexWidget
        style={{
          flex: 1,
          width: "match_parent",
          flexDirection: "column",
          justifyContent: "space-between",
          flexGap: 4,
        }}
      >
        {forecastItems.map((forecast) => (
          <DailyItem key={forecast.dt} forecast={forecast} tempScale={tempScale} />
        ))}
      </FlexWidget>

      {/* Footer */}
      <FlexWidget style={{ width: "match_parent", alignItems: "center", marginTop: 8 }}>
        <TextWidget text="Tap to refresh" style={{ fontSize: 9, color: "#6B7280" }} />
      </FlexWidget>
    </FlexWidget>
  );
}

export default WeatherExtended;
