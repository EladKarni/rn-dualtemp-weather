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
} from "react-native";
import { i18n } from "../localization/i18n";
import { styles } from "./AddLocationScreen.Styles";
import { CityResult, searchCities, formatLocationName } from "../utils/geocoding";
import { useLocationStore } from "../store/useLocationStore";
import { useLanguageStore } from "../store/useLanguageStore";
import { logger } from "../utils/logger";
import { AppError, toAppError } from "../utils/errors";
import { AddLocationContent } from "../components/AddLocation/AddLocationContent";

type AddLocationScreenProps = {
  visible: boolean;
  onClose: () => void;
};

const AddLocationScreen = ({ visible, onClose }: AddLocationScreenProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CityResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const selectedLanguage = useLanguageStore((state) => state.selectedLanguage);

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
        const locale = selectedLanguage || 'en';
        const results = await searchCities(searchQuery, locale);
        setSearchResults(results);
        setError(null); // Clear any previous errors
      } catch (err) {
        const appError = toAppError(err);
        logger.error("Search error:", err);
        setError(appError);
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
      setError(toAppError(new Error(i18n.t("MaxLocationsReached"))));
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

  const handleRetry = () => {
    setError(null);
    setIsSearching(true);
    // Trigger search again by re-setting the query
    const currentQuery = searchQuery;
    setSearchQuery("");
    setTimeout(() => setSearchQuery(currentQuery), 0);
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

          <View style={styles.content}>
            <AddLocationContent
              searchQuery={searchQuery}
              isSearching={isSearching}
              error={error}
              searchResults={searchResults}
              onCitySelect={handleSelectCity}
              onRetry={handleRetry}
              onDismissError={() => setError(null)}
            />
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default AddLocationScreen;
