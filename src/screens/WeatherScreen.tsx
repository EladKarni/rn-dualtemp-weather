import React from "react";
import { ScrollView, View, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppHeader from "../components/AppHeader/AppHeader";
import CurrentWeatherCard from "../components/CurrentWeatherCard/CurrentWeatherCard";
import HourlyForecast from "../components/HourlyForecast/HourlyForecast";
import DailyForecast from "../components/DailyForecast/DailyForecast";
import HourlyForecastSkeleton from "../components/HourlyForecast/HourlyForecastSkeleton";
import DailyForecastSkeleton from "../components/DailyForecast/DailyForecastSkeleton";
import AppFooter from "../components/AppFooter/AppFooter";
import { WeatherErrorBanner } from "../components/ErrorAlert/WeatherErrorBanner";
import { AppStateContext } from "../utils/AppStateContext";
import type { Weather } from "../types/WeatherTypes";
import type { AppError } from "../utils/errors";
import type { Moment } from "moment";
import type { SavedLocation } from "../store/useLocationStore";
import type { LocationWeatherState } from "../hooks/useMultiLocationWeather";
import { weatherScreenStyles } from "../Styles/screens/WeatherScreen.styles";

interface WeatherScreenProps {
  forecast: Weather;
  date: Moment;
  tempScale: "C" | "F";
  onSettingsPress: () => void;
  refreshing: boolean;
  onRefresh: () => void;
  onLayoutRootView?: () => void;
  savedLocations: SavedLocation[];
  activeLocationId: string | null;
  locationLoadingStates: Map<string, LocationWeatherState>;
  onLocationSelect: (id: string) => void;
  appError?: AppError | null;
  onRetry?: () => void;
  onDismissError?: () => void;
  lastUpdated?: Date;
}

export default function WeatherScreen({
  forecast,
  date,
  tempScale,
  onSettingsPress,
  refreshing,
  onRefresh,
  onLayoutRootView,
  savedLocations,
  activeLocationId,
  locationLoadingStates,
  onLocationSelect,
  appError,
  onRetry,
  onDismissError,
  lastUpdated,
}: WeatherScreenProps) {
  // Determine if we should show skeleton for hourly/daily forecasts
  // Show skeleton if forecast is still loading (initial load)
  const showForecastSkeleton =
    refreshing && !forecast?.hourly && !forecast?.daily;

  return (
    <SafeAreaView style={weatherScreenStyles.container}>
      <View onLayout={onLayoutRootView}>
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {appError && (
            <WeatherErrorBanner
              error={appError}
              onRetry={onRetry}
              onDismiss={onDismissError}
              lastUpdated={lastUpdated}
            />
          )}

          <AppStateContext.Provider value={{ forecast, date, tempScale }}>
            <AppHeader
              onSettingsPress={onSettingsPress}
              savedLocations={savedLocations}
              activeLocationId={activeLocationId}
              onLocationSelect={onLocationSelect}
              locationLoadingStates={locationLoadingStates}
            />

            {/* Current weather card for active location */}
            <CurrentWeatherCard
              temp={forecast.current.temp}
              weather={forecast.current.weather[0]}
            />

            {/* Hourly forecast for active location */}
            {showForecastSkeleton ? (
              <HourlyForecastSkeleton />
            ) : (
              <HourlyForecast hourlyForecast={forecast.hourly?.slice(0, 24)} />
            )}

            {/* Daily forecast for active location */}
            {showForecastSkeleton ? (
              <DailyForecastSkeleton />
            ) : (
              <DailyForecast dailyForecast={forecast.daily} />
            )}
          </AppStateContext.Provider>
          <AppFooter />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
