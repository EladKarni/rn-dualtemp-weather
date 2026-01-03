import React, { Component, ReactNode } from 'react';
import type { ErrorInfo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Sentry from '@sentry/react-native';
import ErrorScreen from '../../screens/ErrorScreen';
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
        return (
          <ErrorScreen
            onSettingsPress={this.props.errorScreenProps.onSettingsPress}
            errorMessage={this.props.errorScreenProps.error?.message || this.state.error?.message}
            onRetry={() => {
              this.props.errorScreenProps.onRetry();
              this.resetError();
            }}
            savedLocations={this.props.errorScreenProps.savedLocations}
            activeLocationId={this.props.errorScreenProps.activeLocationId}
            onLocationSelect={this.props.errorScreenProps.onLocationSelect}
            locationLoadingStates={this.props.errorScreenProps.locationLoadingStates}
          />
        );
      }
      
      // Default fallback - show basic error screen
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            {this.state.error?.message || 'Unknown error occurred'}
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.resetError}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1a1a1a',
  },
  title: {
    fontSize: 18,
    marginBottom: 10,
    color: '#fff',
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#ccc',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ErrorBoundary;