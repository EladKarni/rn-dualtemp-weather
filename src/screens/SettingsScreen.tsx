import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
  ScrollView,
} from "react-native";
import { i18n } from "../localization/i18n";
import { styles } from "./SettingsScreen.Styles";
import SettingItem from "../components/SettingItem/SettingItem";
import { TempUnitSelector } from "../components/TempUnitSelector/TempUnitSelector";
import { LanguageSelector } from "../components/LanguageSelector/LanguageSelector";
import { useLocationStore } from "../store/useLocationStore";
import AddLocationScreen from "./AddLocationScreen";

type SettingsScreenProps = {
  visible: boolean;
  onClose: () => void;
};

const SettingsScreen = ({ visible, onClose }: SettingsScreenProps) => {
  const [modalVisible, setModalVisible] = useState(visible);
  const [addLocationVisible, setAddLocationVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const savedLocations = useLocationStore((state) => state.savedLocations);
  const removeLocation = useLocationStore((state) => state.removeLocation);
  const canAddMoreLocations = useLocationStore((state) => state.canAddMoreLocations());

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
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
      ]).start(() => {
        setModalVisible(false);
      });
    }
  }, [visible]);

  return (
    <Modal
      visible={modalVisible}
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

              {savedLocations.map((location) => (
                <View key={location.id} style={styles.locationItem}>
                  <View style={styles.locationItemInfo}>
                    <Text style={styles.locationItemName}>
                      {location.isGPS ? `📍 ${i18n.t("CurrentLocation")}` : location.name}
                    </Text>
                  </View>
                  {!location.isGPS && (
                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert(
                          i18n.t("DeleteLocation"),
                          `${i18n.t("DeleteLocationConfirm")} ${location.name}?`,
                          [
                            { text: i18n.t("Cancel"), style: "cancel" },
                            {
                              text: i18n.t("Delete"),
                              style: "destructive",
                              onPress: () => removeLocation(location.id),
                            },
                          ]
                        );
                      }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text style={styles.deleteIcon}>🗑️</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              <TouchableOpacity
                style={[
                  styles.addLocationButton,
                  !canAddMoreLocations && styles.addLocationButtonDisabled,
                ]}
                onPress={() => {
                  if (canAddMoreLocations) {
                    setAddLocationVisible(true);
                  }
                }}
                disabled={!canAddMoreLocations}
              >
                <Text
                  style={[
                    styles.addLocationButtonText,
                    !canAddMoreLocations && styles.addLocationButtonTextDisabled,
                  ]}
                >
                  + {i18n.t("AddLocation")}
                  {!canAddMoreLocations &&
                    ` (${savedLocations.filter((loc) => !loc.isGPS).length}/5)`}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>

      <AddLocationScreen
        visible={addLocationVisible}
        onClose={() => setAddLocationVisible(false)}
      />
    </Modal>
  );
};

export default SettingsScreen;
