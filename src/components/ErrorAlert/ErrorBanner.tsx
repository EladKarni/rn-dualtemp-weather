import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AppError } from '../../utils/errors';
import { i18n } from '../../localization/i18n';
import { palette } from '../../Styles/Palette';

interface ErrorBannerProps {
  error: AppError;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  error,
  onRetry,
  onDismiss,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>⚠️</Text>
        <Text style={styles.message}>{error.userMessage}</Text>
      </View>
      <View style={styles.actions}>
        {error.recoverable && onRetry && (
          <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
            <Text style={styles.retryText}>{i18n.t('Retry')}</Text>
          </TouchableOpacity>
        )}
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
            <Text style={styles.dismissText}>×</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#FF453A',
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
    marginRight: 10,
  },
  message: {
    flex: 1,
    color: palette.textColor,
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 8,
    justifyContent: 'flex-end',
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: palette.highlightColor,
    borderRadius: 6,
    marginRight: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  dismissButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dismissText: {
    color: palette.textColor,
    fontSize: 20,
    fontWeight: 'bold',
  },
});
