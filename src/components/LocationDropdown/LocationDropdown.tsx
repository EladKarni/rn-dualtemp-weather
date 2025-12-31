import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  FlatList,
  Alert,
} from "react-native";
import { i18n } from "../../localization/i18n";
import { styles } from "./LocationDropdown.Styles";
import { useLocationStore, SavedLocation } from "../../store/useLocationStore";

type LocationDropdownProps = {
  visible: boolean;
  onClose: () => void;
  onAddLocation: () => void;
};

const LocationDropdown = ({
  visible,
  onClose,
  onAddLocation,
}: LocationDropdownProps) => {
  const [modalVisible, setModalVisible] = useState(visible);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;

  const savedLocations = useLocationStore((state) => state.savedLocations);
  const activeLocationId = useLocationStore((state) => state.activeLocationId);
  const setActiveLocation = useLocationStore((state) => state.setActiveLocation);
  const removeLocation = useLocationStore((state) => state.removeLocation);
  const canAddMoreLocations = useLocationStore((state) => state.canAddMoreLocations());

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -20,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setModalVisible(false);
      });
    }
  }, [visible]);

  const handleSelectLocation = (locationId: string) => {
    setActiveLocation(locationId);
    onClose();
  };

  const handleDeleteLocation = (location: SavedLocation) => {
    Alert.alert(
      i18n.t("DeleteLocation"),
      `${i18n.t("DeleteLocationConfirm")} ${location.name}?`,
      [
        {
          text: i18n.t("Cancel"),
          style: "cancel",
        },
        {
          text: i18n.t("Delete"),
          style: "destructive",
          onPress: () => {
            removeLocation(location.id);
          },
        },
      ]
    );
  };

  const renderLocationItem = ({ item }: { item: SavedLocation }) => {
    const isActive = item.id === activeLocationId;

    return (
      <View style={styles.locationItemContainer}>
        <TouchableOpacity
          style={[styles.locationItem, isActive && styles.activeLocationItem]}
          onPress={() => handleSelectLocation(item.id)}
        >
          <View style={styles.locationInfo}>
            {isActive && <Text style={styles.checkmark}>✓</Text>}
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationName}>
                {item.isGPS ? i18n.t("CurrentLocation") : item.name}
              </Text>
              {item.isGPS && (
                <Text style={styles.gpsIcon}>📍</Text>
              )}
            </View>
          </View>

          {!item.isGPS && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteLocation(item)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.deleteIcon}>🗑️</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const nonGPSLocations = savedLocations.filter(loc => !loc.isGPS);
  const gpsLocation = savedLocations.find(loc => loc.isGPS);

  return (
    <Modal
      visible={modalVisible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.dropdownContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <FlatList
                data={gpsLocation ? [gpsLocation, ...nonGPSLocations] : nonGPSLocations}
                renderItem={renderLocationItem}
                keyExtractor={(item) => item.id}
                style={styles.locationsList}
                showsVerticalScrollIndicator={false}
              />

              <View style={styles.divider} />

              <TouchableOpacity
                style={[
                  styles.addLocationButton,
                  !canAddMoreLocations && styles.addLocationButtonDisabled,
                ]}
                onPress={() => {
                  if (canAddMoreLocations) {
                    onClose();
                    onAddLocation();
                  }
                }}
                disabled={!canAddMoreLocations}
              >
                <Text
                  style={[
                    styles.addLocationText,
                    !canAddMoreLocations && styles.addLocationTextDisabled,
                  ]}
                >
                  + {i18n.t("AddLocation")}
                  {!canAddMoreLocations && ` (${nonGPSLocations.length}/5)`}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default LocationDropdown;
