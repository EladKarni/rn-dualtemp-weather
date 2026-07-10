import { Alert, AlertButton, AlertOptions } from "react-native";

/**
 * Cross-platform alert with the same signature as Alert.alert.
 *
 * Native: delegates straight to Alert.alert (this file).
 * Web: Alert.alert is a silent no-op in react-native-web, so alert.web.ts
 * maps the same call onto window.confirm / window.alert instead.
 */
export const showAlert = (
  title: string,
  message?: string,
  buttons?: AlertButton[],
  options?: AlertOptions,
): void => {
  Alert.alert(title, message, buttons, options);
};
