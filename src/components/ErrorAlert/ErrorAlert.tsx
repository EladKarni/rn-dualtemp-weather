
import { Alert, Platform, Linking } from 'react-native';
import { AppError } from '../../utils/errors';
import { i18n } from '../../localization/i18n';

interface ErrorAlertOptions {
  error: AppError;
  onRetry?: () => void;
  onDismiss?: () => void;
  onOpenSettings?: () => void;
}

export const showErrorAlert = ({
  error,
  onRetry,
  onDismiss,
  onOpenSettings,
}: ErrorAlertOptions) => {
  const buttons: any[] = [];

  // Add retry button for recoverable errors
  if (error.recoverable && onRetry) {
    buttons.push({
      text: i18n.t('Retry'),
      onPress: onRetry,
      style: 'default',
    });
  }

  // Add settings button for permission errors
  if (error.code === 'PERMISSION_DENIED' && onOpenSettings) {
    buttons.push({
      text: i18n.t('OpenSettings'),
      onPress: onOpenSettings,
      style: 'default',
    });
  }

  // Always add dismiss/cancel button
  buttons.push({
    text: i18n.t(buttons.length > 0 ? 'Cancel' : 'OK'),
    onPress: onDismiss,
    style: 'cancel',
  });

  Alert.alert(
    i18n.t('Error'),
    error.userMessage,
    buttons,
    { cancelable: false }
  );
};

/**
 * Opens device settings (for permission errors)
 */
export const openDeviceSettings = async () => {
  if (Platform.OS === 'ios') {
    await Linking.openURL('app-settings:');
  } else {
    await Linking.openSettings();
  }
};
