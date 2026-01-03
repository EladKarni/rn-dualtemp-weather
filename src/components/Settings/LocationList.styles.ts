import { StyleSheet } from 'react-native';
import { palette } from '../../Styles/Palette';

export const styles = StyleSheet.create({
  locationItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: palette.primaryLight,
  },
  locationItemInfo: {
    flex: 1,
  },
  locationItemName: {
    fontSize: 16,
    color: palette.textColor,
  },
  deleteIcon: {
    fontSize: 18,
  },
  addLocationButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    marginTop: 10,
  },
  addLocationButtonDisabled: {
    opacity: 0.5,
  },
  addLocationButtonText: {
    fontSize: 16,
    color: palette.highlightColor,
    fontWeight: "600",
  },
  addLocationButtonTextDisabled: {
    color: "#999",
  },
});
