import { StyleSheet } from "react-native";
import { palette } from "../../Styles/Palette";

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    paddingTop: 100,
    paddingHorizontal: 20,
  },
  dropdownContainer: {
    backgroundColor: palette.primaryDark,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.highlightColor,
    maxHeight: 400,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  locationsList: {
    maxHeight: 300,
  },
  locationItemContainer: {
    borderBottomWidth: 1,
    borderBottomColor: palette.primaryLight,
  },
  locationItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  activeLocationItem: {
    backgroundColor: "rgba(74, 144, 226, 0.1)",
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  checkmark: {
    fontSize: 18,
    color: palette.highlightColor,
    marginRight: 10,
    width: 20,
  },
  locationTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    color: palette.textColor,
    flex: 1,
  },
  gpsIcon: {
    fontSize: 16,
    marginLeft: 8,
  },
  deleteButton: {
    padding: 5,
    marginLeft: 10,
  },
  deleteIcon: {
    fontSize: 18,
  },
  divider: {
    height: 1,
    backgroundColor: palette.primaryLight,
  },
  addLocationButton: {
    paddingVertical: 15,
    paddingHorizontal: 15,
    alignItems: "center",
  },
  addLocationButtonDisabled: {
    opacity: 0.5,
  },
  addLocationText: {
    fontSize: 16,
    color: palette.highlightColor,
    fontWeight: "600",
  },
  addLocationTextDisabled: {
    color: "#999",
  },
});
