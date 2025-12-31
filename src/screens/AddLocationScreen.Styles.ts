import { StyleSheet } from "react-native";
import { palette } from "../Styles/Palette";

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    backgroundColor: palette.primaryDark,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    minHeight: "70%",
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: palette.primaryLight,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: palette.textColor,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 28,
    color: palette.textColor,
    fontWeight: "300",
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  searchInput: {
    backgroundColor: palette.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: palette.textColor,
    borderWidth: 1,
    borderColor: palette.highlightColor,
  },
  content: {
    flex: 1,
    paddingTop: 10,
  },
  resultsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  cityItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginBottom: 10,
    backgroundColor: palette.primaryLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(74, 144, 226, 0.2)",
  },
  cityInfo: {
    flex: 1,
  },
  cityName: {
    fontSize: 16,
    fontWeight: "600",
    color: palette.textColor,
    marginBottom: 4,
  },
  cityDetails: {
    fontSize: 14,
    color: "#999",
  },
  addIcon: {
    fontSize: 28,
    color: palette.highlightColor,
    fontWeight: "300",
    marginLeft: 10,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginTop: 10,
  },
  errorText: {
    fontSize: 16,
    color: "#ff6b6b",
    textAlign: "center",
  },
});
