import React, { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ScrollView,
} from "react-native";
import { i18n } from "../localization/i18n";
import SettingItem from "../components/SettingItem/SettingItem";
import { TempUnitSelector } from "../components/TempUnitSelector/TempUnitSelector";
import { ClockFormatSelector } from "../components/ClockFormatSelector/ClockFormatSelector";
import { SunriseSunsetToggle } from "../components/SunriseSunsetToggle/SunriseSunsetToggle";
import { PrecipUnitSelector } from "../components/PrecipUnitSelector/PrecipUnitSelector";
import { LanguageSelector } from "../components/LanguageSelector/LanguageSelector";
import { LocationList } from "../components/Settings/LocationList";
import { useLocationStore } from "../store/useLocationStore";
import { useModalAnimation } from "../hooks/useModalAnimation";
import { styles } from "../styles/screens/SettingsScreen.styles";
type SettingsScreenProps = {
  visible: boolean;
  onClose: () => void;
  onAddLocationPress: () => void;
};

const SettingsScreen = ({
  visible,
  onClose,
  onAddLocationPress,
}: SettingsScreenProps) => {
  const savedLocations = useLocationStore((state) => state.savedLocations);
  const removeLocation = useLocationStore((state) => state.removeLocation);
  const canAddMoreLocations = useLocationStore((state) =>
    state.canAddMoreLocations()
  );

  const { fadeAnim, slideAnim } = useModalAnimation(visible);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.modalContainer,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>{i18n.t("Settings")}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{i18n.t("Units")}</Text>
              <SettingItem label={i18n.t("TemperatureUnit")}>
                <TempUnitSelector />
              </SettingItem>
              <SettingItem label={i18n.t("PrecipitationUnit")}>
                <PrecipUnitSelector />
              </SettingItem>
              <SettingItem label={i18n.t("TimeFormat")}>
                <ClockFormatSelector />
              </SettingItem>
              <SettingItem label={i18n.t("ShowSunriseSunset")}>
                <SunriseSunsetToggle />
              </SettingItem>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{i18n.t("Language")}</Text>
              <SettingItem label={i18n.t("AppLanguage")}>
                <LanguageSelector />
              </SettingItem>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{i18n.t("Locations")}</Text>

              <LocationList
                savedLocations={savedLocations}
                onRemoveLocation={removeLocation}
                canAddMoreLocations={canAddMoreLocations}
                onAddLocationPress={onAddLocationPress}
              />
            </View>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default SettingsScreen;
