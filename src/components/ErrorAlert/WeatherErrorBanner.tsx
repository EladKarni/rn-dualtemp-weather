import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import moment from "moment";
import { AppError } from "../../utils/errors";
import { i18n } from "../../localization/i18n";
import { palette } from "../../styles/Palette";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useLanguageStore } from "../../store/useLanguageStore";

interface WeatherErrorBannerProps {
  error: AppError;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const WeatherErrorBanner: React.FC<WeatherErrorBannerProps> = ({
  error,
  onRetry,
  onDismiss,
}) => {
  // Sourced from the persisted settings store as an ISO-8601 string. Tolerate
  // missing/legacy (non-string) values by showing no relative time — never throw.
  const lastUpdated = useSettingsStore((state) => state.lastUpdated);
  // Manual RTL mirroring (same pattern as the other RTL-aware components).
  const isRTL = useLanguageStore((state) => state.isRTL);
  const supportEmail =
    process.env.EXPO_PUBLIC_SUPPORT_EMAIL || "support@eladkarni.solutions";

  const getErrorMessage = (): string => {
    const message = error.userMessageKey
      ? i18n.t(error.userMessageKey)
      : error.userMessage;

    if (typeof lastUpdated === "string" && moment(lastUpdated).isValid()) {
      return `${message}. ${moment(lastUpdated).fromNow()}`;
    }

    return message;
  };

  return (
    <View style={styles.container}>
      <View style={[styles.content, isRTL && styles.contentRTL]}>
        <Text style={[styles.icon, isRTL && styles.iconRTL]}>⚠️</Text>
        <View style={styles.messageContainer}>
          <Text style={[styles.message, isRTL && styles.textRTL]}>
            {getErrorMessage()}
          </Text>
          <Text style={[styles.supportText, isRTL && styles.textRTL]}>
            {i18n.t("BannerSupport", { email: supportEmail })}
          </Text>
        </View>
      </View>
      <View style={[styles.actions, isRTL && styles.actionsRTL]}>
        {error.recoverable && onRetry && (
          <TouchableOpacity
            onPress={onRetry}
            style={[styles.retryButton, isRTL && styles.retryButtonRTL]}
          >
            <Text style={styles.retryText}>{i18n.t("Retry")}</Text>
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
    backgroundColor: "rgba(255, 69, 58, 0.1)",
    borderLeftWidth: 4,
    borderLeftColor: "#FF453A",
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
  },
  content: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  contentRTL: {
    flexDirection: "row-reverse",
  },
  icon: {
    fontSize: 20,
    marginRight: 10,
    marginTop: 2,
  },
  iconRTL: {
    marginRight: 0,
    marginLeft: 10,
  },
  textRTL: {
    textAlign: "right",
    writingDirection: "rtl",
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
    flexDirection: "row",
    marginTop: 8,
    justifyContent: "flex-end",
  },
  actionsRTL: {
    flexDirection: "row-reverse",
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: palette.highlightColor,
    borderRadius: 6,
    marginRight: 8,
  },
  retryButtonRTL: {
    marginRight: 0,
    marginLeft: 8,
  },
  retryText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  dismissButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dismissText: {
    color: palette.textColor,
    fontSize: 20,
    fontWeight: "bold",
  },
});
