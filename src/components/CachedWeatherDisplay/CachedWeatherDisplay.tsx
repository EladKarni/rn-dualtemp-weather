import React from 'react';
import { View } from 'react-native';
import { AppError } from '../../utils/errors';
import { Weather } from '../../types/WeatherTypes';
import { WeatherErrorBanner } from '../ErrorAlert/WeatherErrorBanner';
import CurrentWeatherCard from '../CurrentWeatherCard/CurrentWeatherCard';
import HourlyForecast from '../HourlyForecast/HourlyForecast';
import DailyForecast from '../DailyForecast/DailyForecast';

interface CachedWeatherDisplayProps {
  forecast?: Weather;
  error?: AppError | null;
  onRetry?: () => void;
  onDismissError?: () => void;
  lastUpdated?: Date;
  tempScale?: 'C' | 'F';
}

export const CachedWeatherDisplay: React.FC<CachedWeatherDisplayProps> = ({
  forecast,
  error,
  onRetry,
  onDismissError,
  lastUpdated,
  tempScale = 'C',
}) => {
  if (!forecast) {
    return null;
  }

  return (
    <View>
      {error && (
        <WeatherErrorBanner
          error={error}
          onRetry={onRetry}
          onDismiss={onDismissError}
          lastUpdated={lastUpdated}
        />
      )}
      
      <CurrentWeatherCard
        temp={forecast.current.temp}
        weather={forecast.current.weather[0]}
      />
      <HourlyForecast hourlyForecast={forecast.hourly?.slice(0, 24)} />
      <DailyForecast dailyForecast={forecast.daily} />
    </View>
  );
};