import type { AlertButton, AlertOptions } from "react-native";

/**
 * Web implementation of showAlert (see alert.ts for the native one).
 *
 * react-native-web ships Alert as a silent no-op, which turns confirmation
 * dialogs into dead buttons on web. Map the Alert button semantics onto the
 * browser's native dialogs instead:
 * - no actionable button  -> window.alert, then the cancel/dismiss handler
 * - one actionable button -> window.confirm; OK runs it, Cancel runs the
 *   cancel button's handler
 * - several actionable buttons -> window.confirm names the primary action;
 *   OK runs only that one (window dialogs can't offer three choices)
 */
export const showAlert = (
  title: string,
  message?: string,
  buttons?: AlertButton[],
  _options?: AlertOptions,
): void => {
  const text = message ? `${title}\n\n${message}` : title;
  const actionable = (buttons ?? []).filter((b) => b.style !== "cancel");
  const cancel = (buttons ?? []).find((b) => b.style === "cancel");

  if (actionable.length === 0) {
    window.alert(text);
    cancel?.onPress?.();
    return;
  }

  // Name the OK action whenever OK means more than "dismiss", so the
  // two-choice confirm stays unambiguous
  const primary = actionable[0];
  const prompt =
    primary.text && (actionable.length > 1 || cancel)
      ? `${text}\n\nOK: ${primary.text}`
      : text;

  if (window.confirm(prompt)) {
    primary.onPress?.();
  } else {
    cancel?.onPress?.();
  }
};
