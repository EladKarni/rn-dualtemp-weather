
import { Platform, Linking, AlertButton } from 'react-native';
import { AppError } from '../../utils/errors';
import { i18n } from '../../localization/i18n';
import { showAlert } from '../../utils/alert';

interface ErrorAlertOptions {
  error: AppError;
  onRetry?: () => void;
  onDismiss?: () => void;
  onOpenSettings?: () => void;
  onEnableLocation?: () => void;
  onAddManually?: () => void;
}

export const showErrorAlert = ({
  error,
  onRetry,
  onDismiss,
  onOpenSettings,
  onEnableLocation,
  onAddManually,
}: ErrorAlertOptions) => {
  const buttons: AlertButton[] = [];
  const isWeb = Platform.OS === 'web';

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
  if (error.code === 'PERMISSION_DENIED' && onOpenSettings && !isWeb) {
    buttons.push({
      text: i18n.t('OpenSettings'),
      onPress: onOpenSettings,
      style: 'default',
    });
  }

  // Web only: the browser can re-show its permission prompt, so offer that
  // as the primary action for permission errors
  if (error.code === 'PERMISSION_DENIED' && onEnableLocation && isWeb) {
    buttons.push({
      text: i18n.t('EnableLocation'),
      onPress: onEnableLocation,
      style: 'default',
    });
  }

  // Manual city entry — the fallback that always works without location access.
  if (onAddManually && isWeb) {
    // The two-button browser confirm is the sole GPS-failure surface on web,
    // so manual entry takes the Cancel slot.
    buttons.push({
      text: i18n.t('AddLocation'),
      onPress: onAddManually,
      style: 'cancel',
    });
  } else if (onAddManually) {
    // Native: make manual entry a visible button of its own so users who deny
    // GPS can't miss it, then still offer a plain dismiss below it.
    buttons.push({
      text: i18n.t('AddLocation'),
      onPress: onAddManually,
      style: 'default',
    });
    buttons.push({
      text: i18n.t('Cancel'),
      onPress: onDismiss,
      style: 'cancel',
    });
  } else {
    // Always add dismiss/cancel button
    buttons.push({
      text: i18n.t(buttons.length > 0 ? 'Cancel' : 'OK'),
      onPress: onDismiss,
      style: 'cancel',
    });
  }

  // Android maps the LAST button in the array to the emphasized "positive"
  // slot, which would otherwise put the plain dismiss where the primary action
  // belongs. Move the cancel-styled button to the front (Android's neutral,
  // least-prominent slot) so a real recovery action stays emphasized. iOS pins
  // the cancel button itself, and web resolves it by style, so both are
  // unaffected by array order.
  if (Platform.OS === 'android') {
    const cancelIdx = buttons.findIndex((b) => b.style === 'cancel');
    if (cancelIdx > 0) {
      const [cancelButton] = buttons.splice(cancelIdx, 1);
      buttons.unshift(cancelButton);
    }
  }

  // Permission denials get a dedicated, localized message that spells out both
  // recovery paths (enable location OR add a city). Other errors keep their own
  // userMessage, since the buttons alongside them are self-explanatory.
  const message =
    error.code === 'PERMISSION_DENIED'
      ? i18n.t('LocationPermissionMessage')
      : error.userMessage;

  showAlert(
    i18n.t('Error'),
    message,
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
