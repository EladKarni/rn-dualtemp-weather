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

interface WeatherStandardProps {
  weather: Weather;
  lastUpdated: Date;
  locationName: string;
  width?: number;   // Widget width in pixels for responsive layout
  height?: number;  // Widget height in pixels
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
  // Format time using device locale
  const timeText = new Date(forecast.dt * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Calculate wind speed
  const { value: windSpeed, unit: windUnit } = convertWindSpeed(
    forecast.wind_speed,
    tempScale
  );

  return (
    <FlexWidget
      style={{
        height: "match_parent",
        flex: 1,
        ...(showBackground && {
          backgroundColor: "rgba(255, 255, 255, 0.1)",
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

      {/* Dual Temperature */}
      <DualTemperatureDisplay temp={forecast.temp} size="small" tempScale={tempScale} />
    </FlexWidget>
  );
};

export function WeatherStandard({
  weather,
  lastUpdated,
  locationName,
  width,
  height,
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

      {/* Hourly Forecast Items */}
      {isExpanded ? (
        // Expanded layout: Multiple items in a row with background containers
        <FlexWidget
          style={{
            flex: 1,
            width: "match_parent",
            flexDirection: "row",
            justifyContent: "space-between",
            flexGap: itemGap,
          }}
        >
          {forecastItems.map((forecast) => (
            <HourlyItem
              key={forecast.dt}
              forecast={forecast}
              tempScale={tempScale}
              showBackground={true}
            />
          ))}
        </FlexWidget>
      ) : (
        // Compact layout: Single item without background, fills space
        forecastItems.length > 0 && (
          <HourlyItem
            forecast={forecastItems[0]}
            tempScale={tempScale}
            showBackground={false}
          />
        )
      )}

      {/* Footer */}
      <FlexWidget
        style={{
          width: "match_parent",
          alignItems: "center",
          marginTop: 8,
        }}
      >
        <TextWidget
          text="Tap to refresh"
          style={{
            fontSize: 9,
            color: palette.textColorSecondary,
          }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
