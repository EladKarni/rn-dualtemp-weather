
import { Platform, Linking } from 'react-native';
import { AppError } from '../../utils/errors';
import { i18n } from '../../localization/i18n';
import { showAlert } from '../../utils/alert';

interface ErrorAlertOptions {
  error: AppError;
  onRetry?: () => void;
  onDismiss?: () => void;
  onOpenSettings?: () => void;
  onAddManually?: () => void;
}

export const showErrorAlert = ({
  error,
  onRetry,
  onDismiss,
  onOpenSettings,
  onAddManually,
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

  // Add settings button for permission errors (not on web — the browser
  // has no app-settings screen to deep-link into)
  if (error.code === 'PERMISSION_DENIED' && onOpenSettings && Platform.OS !== 'web') {
    buttons.push({
      text: i18n.t('OpenSettings'),
      onPress: onOpenSettings,
      style: 'default',
    });
  }

  // Web only: offer manual city entry as the alert's action, since the
  // browser dialog is the sole GPS-failure surface there
  if (onAddManually && Platform.OS === 'web') {
    buttons.push({
      text: i18n.t('AddLocation'),
      onPress: onAddManually,
      style: 'default',
    });
  }

  // Always add dismiss/cancel button
  buttons.push({
    text: i18n.t(buttons.length > 0 ? 'Cancel' : 'OK'),
    onPress: onDismiss,
    style: 'cancel',
  });

  showAlert(
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
