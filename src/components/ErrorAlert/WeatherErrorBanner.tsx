import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AppError } from '../../utils/errors';
import { i18n } from '../../localization/i18n';
import { palette } from '../../Styles/Palette';

interface WeatherErrorBannerProps {
  error: AppError;
  onRetry?: () => void;
  onDismiss?: () => void;
  lastUpdated?: Date;
}

export const WeatherErrorBanner: React.FC<WeatherErrorBannerProps> = ({
  error,
  onRetry,
  onDismiss,
  lastUpdated,
}) => {
  const getTimeAgoText = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return i18n.t('JustNow') || 'Just now';
    if (diffMins === 1) return i18n.t('OneMinuteAgo') || '1 minute ago';
    if (diffMins < 60) return i18n.t('XMinutesAgo', { count: diffMins }) || `${diffMins} minutes ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return i18n.t('OneHourAgo') || '1 hour ago';
    return i18n.t('XHoursAgo', { count: diffHours }) || `${diffHours} hours ago`;
  };

  const getErrorMessage = (): string => {
    let message = error.userMessage;

    if (lastUpdated) {
      message += '. ' + i18n.t('LastUpdated', { time: getTimeAgoText(lastUpdated) }) ||
        `. Last updated ${getTimeAgoText(lastUpdated)}`;
    }

    return message;
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>⚠️</Text>
        <View style={styles.messageContainer}>
          <Text style={styles.message}>{getErrorMessage()}</Text>
          <Text style={styles.supportText}>
            If this happens often, contact {process.env.EXPO_PUBLIC_SUPPORT_EMAIL || 'support@eladkarni.solutions'} for help.
          </Text>
        </View>
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
    alignItems: 'flex-start',
  },
  icon: {
    fontSize: 20,
    marginRight: 10,
    marginTop: 2,
  },
  messageContainer: {
    flex: 1,
  },
  message: {
    color: palette.textColor,
    fontSize: 14,
    lineHeight: 20,
  },
  supportText: {
    fontSize: 11,
    color: palette.highlightColor,
    marginTop: 6,
    opacity: 0.6,
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