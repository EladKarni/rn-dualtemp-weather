import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface ErrorFallbackProps {
  /** Heading, e.g. "Something went wrong" / "App Error". */
  title: string;
  /** Body copy — usually the caught error's message with a generic fallback. */
  message: string;
  /** Action button label, e.g. "Try Again" / "Restart App". */
  buttonText: string;
  /** Called when the action button is pressed (clears the boundary's error). */
  onReset: () => void;
}

/**
 * Shared, presentational fallback UI for the root error boundaries. Both
 * index.js's RootErrorBoundary and ErrorBoundary's default branch render this so
 * the view + styles live in one place; each supplies its own copy via props.
 * Sentry-aware / splash-hiding logic stays in the boundary components.
 */
export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  title,
  message,
  buttonText,
  onReset,
}) => (
  <View style={errorFallbackStyles.container}>
    <Text style={errorFallbackStyles.title}>{title}</Text>
    <Text style={errorFallbackStyles.message}>{message}</Text>
    <TouchableOpacity style={errorFallbackStyles.button} onPress={onReset}>
      <Text style={errorFallbackStyles.buttonText}>{buttonText}</Text>
    </TouchableOpacity>
  </View>
);

export const errorFallbackStyles = StyleSheet.create({
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

export default ErrorFallback;
