import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { ErrorFallback } from "../components/ErrorBoundary/ErrorFallback";
import App from "../../App";
import { queryClient, asyncStoragePersister } from "./queryClient";

interface RootErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Root-level error boundary. Guarantees the splash screen is hidden even when
 * the app throws during initial render, and shows the shared ErrorFallback view.
 * Sentry-aware reporting stays in src/components/ErrorBoundary/ErrorBoundary.tsx.
 */
class RootErrorBoundary extends React.Component<
  React.PropsWithChildren,
  RootErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): RootErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Root Error Boundary caught an error:", error, errorInfo);
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
          message={this.state.error?.message || "An unexpected error occurred"}
          buttonText="Restart App"
          onReset={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * The composed application root: safe-area + query-persistence providers wrapped
 * in the root error boundary. index.js registers this with expo.
 */
export default function RootComponent() {
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
