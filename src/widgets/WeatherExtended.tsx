"use no memo";
import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";
import { Weather } from "../types/WeatherTypes";
import { processWidgetData } from "./components/shared/BaseWeatherWidget";
import moment from "moment";

interface WeatherExtendedProps {
  weather: Weather;
  lastUpdated: Date;
  locationName: string;
}

export function WeatherExtended({
  weather,
  lastUpdated,
  locationName,
}: WeatherExtendedProps) {
  const { processedData, tempScale } = processWidgetData({
    weather,
    lastUpdated,
    locationName,
    size: "extended",
  });

  const getTimeAgo = (date: Date) => {
    const now = moment();
    const then = moment(date);
    const diff = now.diff(then, "minutes");

    if (diff < 1) return "just now";
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  return (
    <FlexWidget
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundColor: "#3621dcff", // palette.primaryColor
        borderRadius: 16,
        padding: 16,
        flexDirection: "column",
        justifyContent: "space-between",
      }}
      clickAction="REFRESH"
    >
      {/* Header - Today's Date */}
      <FlexWidget
        style={{
          width: "match_parent",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <TextWidget
          text={new Date().toLocaleDateString()}
          style={{
            fontSize: 18,
            fontWeight: "bold",
            color: "#E5E7EB",
          }}
        />
      </FlexWidget>

      {/* Main content - Temperature */}
      <FlexWidget
        style={{
          width: "match_parent",
          flex: 1,
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Current Temperature */}
        <FlexWidget
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            marginBottom: 8,
          }}
        >
          {/* Primary Temperature (larger) */}
          <TextWidget
            text={`${Math.round(processedData.temp)}°`}
            style={{
              fontSize: 32,
              fontWeight: "bold",
              color: "#E5E7EB",
            }}
          />
          <TextWidget text={"/"} style={{ color: "#E5E7EB" }} />
          {/* Secondary Temperature (smaller) */}
          <TextWidget
            text={` ${
              tempScale === "C"
                ? Math.round((processedData.temp * 9) / 5 + 32)
                : Math.round(((processedData.temp - 32) * 5) / 9)
            }°`}
            style={{
              fontSize: 16,
              color: "#E5E7EB",
              marginLeft: 8,
            }}
          />
        </FlexWidget>

        {/* Min/Max Temperature */}
        <FlexWidget
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 4,
          }}
        >
          <TextWidget
            text={`H: ${Math.round(
              weather.daily?.[0]?.temp?.max || processedData.temp
            )}°`}
            style={{
              fontSize: 14,
              color: "#E5E7EB",
              marginRight: 12,
            }}
          />
          <TextWidget
            text={`L: ${Math.round(
              weather.daily?.[0]?.temp?.min || processedData.temp
            )}°`}
            style={{
              fontSize: 14,
              color: "#E5E7EB",
            }}
          />
        </FlexWidget>

        {/* Sunrise/Sunset */}
        <FlexWidget
          style={{
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <TextWidget
            text={`↑${moment(weather.current?.sunrise * 1000).format("H:mm")}`}
            style={{
              fontSize: 12,
              color: "#E5E7EB",
              marginRight: 8,
            }}
          />
          <TextWidget
            text={`↓${moment(weather.current?.sunset * 1000).format("H:mm")}`}
            style={{
              fontSize: 12,
              color: "#E5E7EB",
            }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* Footer - Last Updated */}
      <FlexWidget
        style={{
          width: "match_parent",
          alignItems: "center",
          marginTop: 16,
        }}
      >
        <TextWidget
          text={`Updated ${getTimeAgo(lastUpdated)}`}
          style={{
            fontSize: 12,
            color: "#E5E7EB",
          }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}

export default WeatherExtended;
