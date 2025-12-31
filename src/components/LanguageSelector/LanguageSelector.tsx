import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useLanguageStore } from "../../store/useLanguageStore";
import { styles } from "./LanguageSelector.Styles";

export const LanguageSelector = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const selectedLanguage = useLanguageStore((state) => state.selectedLanguage);
  const setLanguage = useLanguageStore((state) => state.setLanguage);

  const languages = [
    { code: null, name: "Auto-detect", nativeName: "Auto-detect" },
    { code: "en", name: "English", nativeName: "English" },
    { code: "es", name: "Spanish", nativeName: "Español" },
    { code: "fr", name: "French", nativeName: "Français" },
    { code: "ar", name: "Arabic", nativeName: "العربية" },
    { code: "he", name: "Hebrew", nativeName: "עברית" },
    { code: "zh", name: "Chinese", nativeName: "简体中文" },
  ];

  const handleLanguageSelect = (code: string | null) => {
    setLanguage(code);
    setIsExpanded(false);
  };

  const getSelectedLanguageName = () => {
    const selected = languages.find((lang) => lang.code === selectedLanguage);
    return selected ? selected.nativeName : "Auto-detect";
  };

  return (
    <View>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <Text style={styles.dropdownButtonText}>{getSelectedLanguageName()}</Text>
        <Text style={styles.dropdownArrow}>{isExpanded ? "▲" : "▼"}</Text>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.dropdownList}>
          {languages.map((lang, index) => {
            const isSelected = selectedLanguage === lang.code;
            const isLast = index === languages.length - 1;

            return (
              <TouchableOpacity
                key={lang.code || "auto"}
                style={[
                  styles.languageOption,
                  isSelected && styles.selectedOption,
                  isLast && styles.lastOption,
                ]}
                onPress={() => handleLanguageSelect(lang.code)}
              >
                <View style={styles.languageInfo}>
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  <Text style={styles.languageName}>{lang.nativeName}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};
