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
import { styles } from "./SettingsScreen.Styles";
import SettingItem from "../components/SettingItem/SettingItem";
import { TempUnitSelector } from "../components/TempUnitSelector/TempUnitSelector";
import { LanguageSelector } from "../components/LanguageSelector/LanguageSelector";
import { LocationList } from "../components/Settings/LocationList";
import { useLocationStore } from "../store/useLocationStore";
type SettingsScreenProps = {
  visible: boolean;
  onClose: () => void;
  onAddLocationPress: () => void;
};

const SettingsScreen = ({ visible, onClose, onAddLocationPress }: SettingsScreenProps) => {
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const savedLocations = useLocationStore((state) => state.savedLocations);
  const removeLocation = useLocationStore((state) => state.removeLocation);
  const canAddMoreLocations = useLocationStore((state) => state.canAddMoreLocations());

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

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
