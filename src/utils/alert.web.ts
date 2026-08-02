import type { AlertButton, AlertOptions } from "react-native";
import { i18n } from "../localization/i18n";

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

  // Name each choice whenever it means more than "dismiss", so the
  // two-choice confirm stays unambiguous. The OK/Cancel prefixes use the
  // app's translations — best effort, since the browser localizes the actual
  // confirm buttons by its own UI language, which the page cannot read.
  const primary = actionable[0];
  const hints: string[] = [];
  if (primary.text && (actionable.length > 1 || cancel)) {
    hints.push(`${i18n.t("OK")}: ${primary.text}`);
  }
  if (cancel?.text && cancel.onPress) {
    hints.push(`${i18n.t("Cancel")}: ${cancel.text}`);
  }
  const prompt = hints.length ? `${text}\n\n${hints.join("\n")}` : text;

  if (window.confirm(prompt)) {
    primary.onPress?.();
  } else {
    cancel?.onPress?.();
  }
};
