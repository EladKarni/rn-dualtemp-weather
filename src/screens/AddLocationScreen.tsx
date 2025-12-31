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
  TextInput,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { i18n } from "../localization/i18n";
import { styles } from "./AddLocationScreen.Styles";
import { CityResult, searchCities, formatLocationName } from "../utils/geocoding";
import { useLocationStore } from "../store/useLocationStore";

type AddLocationScreenProps = {
  visible: boolean;
  onClose: () => void;
};

const AddLocationScreen = ({ visible, onClose }: AddLocationScreenProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CityResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const addLocation = useLocationStore((state) => state.addLocation);
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
      // Clean up search state when closing
      setSearchQuery("");
      setSearchResults([]);
      setError(null);
    }
  }, [visible]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length < 3) {
      setSearchResults([]);
      setError(null);
      return;
    }

    setIsSearching(true);
    setError(null);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchCities(searchQuery);
        setSearchResults(results);
        if (results.length === 0) {
          setError(i18n.t("NoResults"));
        }
      } catch (err) {
        console.error("Search error:", err);
        setError(i18n.t("SearchError"));
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleSelectCity = (city: CityResult) => {
    if (!canAddMoreLocations) {
      setError(i18n.t("MaxLocationsReached"));
      return;
    }

    const locationName = formatLocationName(city.name, city.state, city.country);

    addLocation({
      name: locationName,
      latitude: city.lat,
      longitude: city.lon,
    });

    onClose();
  };

  const renderCityItem = ({ item }: { item: CityResult }) => {
    const displayName = formatLocationName(item.name, item.state, item.country);

    return (
      <TouchableOpacity
        style={styles.cityItem}
        onPress={() => handleSelectCity(item)}
      >
        <View style={styles.cityInfo}>
          <Text style={styles.cityName}>{item.name}</Text>
          <Text style={styles.cityDetails}>
            {item.state ? `${item.state}, ` : ""}
            {item.country}
          </Text>
        </View>
        <Text style={styles.addIcon}>+</Text>
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    if (searchQuery.trim().length < 3) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>{i18n.t("StartTyping")}</Text>
        </View>
      );
    }

    if (isSearching) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.emptyStateText}>{i18n.t("Searching")}</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }

    if (searchResults.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>{i18n.t("NoResults")}</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={searchResults}
        renderItem={renderCityItem}
        keyExtractor={(item, index) => `${item.name}-${item.country}-${index}`}
        style={styles.resultsList}
        keyboardShouldPersistTaps="handled"
      />
    );
  };

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
            <Text style={styles.title}>{i18n.t("AddLocation")}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder={i18n.t("SearchLocation")}
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="words"
              autoCorrect={false}
              autoFocus={true}
            />
          </View>

          <View style={styles.content}>{renderContent()}</View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default AddLocationScreen;
