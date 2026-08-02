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
  ActivityIndicator,
  FlatList,
} from "react-native";
import { i18n } from "../localization/i18n";
import {
  CityResult,
  searchCities,
  formatLocationName,
} from "../utils/geocoding";
import { useLocationStore, MAX_SAVED_LOCATIONS } from "../store/useLocationStore";
import { useLanguageStore } from "../store/useLanguageStore";
import { logger } from "../utils/logger";
import { AppError, toAppError } from "../utils/errors";
import { useModalAnimation } from "../hooks/useModalAnimation";
import { palette } from "../styles/Palette";
import { CityResultItem } from "../components/AddLocation/CityResultItem/CityResultItem";
import { styles } from "./AddLocationScreen.styles";

type AddLocationScreenProps = {
  visible: boolean;
  onClose: () => void;
};

const AddLocationScreen = ({ visible, onClose }: AddLocationScreenProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CityResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const selectedLanguage = useLanguageStore((state) => state.selectedLanguage);

  const addLocation = useLocationStore((state) => state.addLocation);

  const { fadeAnim, slideAnim } = useModalAnimation(visible);

  useEffect(() => {
    if (!visible) {
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
        // Auto-detect mode ("selectedLanguage" is null) uses the resolved active
        // locale so city names come back in the language the user actually sees,
        // instead of the previous hardcoded "en".
        const locale = selectedLanguage || i18n.locale;
        const results = await searchCities(searchQuery, locale);
        setSearchResults(results);
        setError(null);
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
  }, [searchQuery, selectedLanguage]);

  const handleSelectCity = (city: CityResult) => {
    const locationName = formatLocationName(
      city.name,
      city.state,
      city.country
    );

    try {
      addLocation({
        name: locationName,
        latitude: city.lat,
        longitude: city.lon,
      });
      onClose();
    } catch (err) {
      // addLocation throws typed UserErrors (DuplicateLocationError /
      // MaxLocationsError) carrying a userMessageKey. Surface localized feedback
      // and keep the modal open so the user can pick a different city.
      const appError = err instanceof AppError ? err : toAppError(err);
      logger.warn("Add location failed:", appError);
      setError(appError);
    }
  };

  const handleRetry = () => {
    setError(null);
    const currentQuery = searchQuery;
    setSearchQuery("");
    setTimeout(() => setSearchQuery(currentQuery), 0);
  };

  const renderEmptyState = () => {
    if (searchQuery.trim().length < 3) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{i18n.t("StartTyping")}</Text>
        </View>
      );
    }

    if (searchResults.length === 0 && !isSearching && !error) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{i18n.t("NoResults")}</Text>
        </View>
      );
    }

    return null;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Same shape as SettingsScreen: the sheet lives in flex flow inside a
          KeyboardAvoidingView, so the keyboard shrinks the sheet instead of
          covering the results list — the search field autofocuses, so on iOS
          the keyboard is up for the entire life of this screen. */}
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

        {error && (
          <View style={styles.errorBanner}>
            <View style={styles.errorContent}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorMessage}>
                {error.userMessageKey
                  ? i18n.t(error.userMessageKey, { count: MAX_SAVED_LOCATIONS })
                  : error.userMessage}
              </Text>
            </View>
            <View style={styles.errorActions}>
              {error.recoverable && (
                <TouchableOpacity
                  onPress={handleRetry}
                  style={styles.retryButton}
                >
                  <Text style={styles.retryText}>{i18n.t("Retry")}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => setError(null)}
                style={styles.dismissButton}
              >
                <Text style={styles.dismissText}>×</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.resultsContainer}>
          {isSearching ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color={palette.highlightColor} />
              <Text style={styles.loadingText}>{i18n.t("Searching")}</Text>
            </View>
          ) : searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              renderItem={({ item }) => (
                <CityResultItem city={item} onPress={handleSelectCity} />
              )}
              keyExtractor={(item, index) =>
                `${item.name}-${item.country}-${index}`
              }
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
            />
          ) : (
            renderEmptyState()
          )}
        </View>
      </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default AddLocationScreen;
