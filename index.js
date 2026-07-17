import { registerRootComponent } from 'expo';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import {
  QueryClient,
} from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { widgetTaskHandler } from './src/widgets/widgetTaskHandler';
import { ErrorFallback } from './src/components/ErrorBoundary/ErrorFallback';
import App from './App';

// Basic error boundary for root level
class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Root Error Boundary caught an error:', error, errorInfo);
    // CRITICAL: Ensure splash screen is hidden even on error
    SplashScreen.hideAsync().catch(() => {});
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          title="App Error"
          message={this.state.error?.message || 'An unexpected error occurred'}
          buttonText="Restart App"
          onReset={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours - keep cache for a full day
      staleTime: 1000 * 60 * 30, // 30 minutes - consider fresh for this long
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "REACT_QUERY_OFFLINE_CACHE",
});

function RootComponent() {
  return (
    <SafeAreaProvider>
      <RootErrorBoundary>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: asyncStoragePersister }}
        >
          <App />
        </PersistQueryClientProvider>
      </RootErrorBoundary>
    </SafeAreaProvider>
  );
}

registerRootComponent(RootComponent);
registerWidgetTaskHandler(widgetTaskHandler);
