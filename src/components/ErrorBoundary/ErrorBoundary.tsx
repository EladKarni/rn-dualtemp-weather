import React, { Component, ReactNode } from 'react';
import type { ErrorInfo } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import * as Sentry from '@sentry/react-native';
import ErrorScreen from '../../screens/ErrorScreen';
import { ErrorFallback } from './ErrorFallback';
import type { SavedLocation } from '../../store/useLocationStore';
import type { LocationWeatherState } from '../../hooks/useMultiLocationWeather';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, resetError: () => void) => ReactNode;
  errorScreenProps?: {
    error?: { message?: string };
    onRetry: () => void;
    locationName: string;
    onLocationPress: () => void;
    hasMultipleLocations: boolean;
    onSettingsPress: () => void;
    savedLocations: SavedLocation[];
    activeLocationId: string | null;
    onLocationSelect: (id: string) => void;
    locationLoadingStates: Map<string, LocationWeatherState>;
  };
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // CRITICAL: Ensure splash screen is hidden even on error
    SplashScreen.hideAsync().catch(() => {});

    Sentry.captureException(error, { 
      contexts: { react: { componentStack: errorInfo.componentStack } } 
    });
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error!, this.resetError);
      }
      
      if (this.props.errorScreenProps) {
        // Capture into a narrowed local so the onRetry closure below keeps the
        // non-undefined narrowing (property accesses inside a closure would not).
        const errorScreenProps = this.props.errorScreenProps;
        return (
          <ErrorScreen
            onSettingsPress={errorScreenProps.onSettingsPress}
            errorMessage={errorScreenProps.error?.message || this.state.error?.message}
            onRetry={() => {
              errorScreenProps.onRetry();
              this.resetError();
            }}
            savedLocations={errorScreenProps.savedLocations}
            activeLocationId={errorScreenProps.activeLocationId}
            onLocationSelect={errorScreenProps.onLocationSelect}
            locationLoadingStates={errorScreenProps.locationLoadingStates}
          />
        );
      }
      
      // Default fallback - show basic error screen
      return (
        <ErrorFallback
          title="Something went wrong"
          message={this.state.error?.message || 'Unknown error occurred'}
          buttonText="Try Again"
          onReset={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;