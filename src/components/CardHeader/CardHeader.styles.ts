import { StyleSheet } from "react-native";

export const cardHeaderStyles = StyleSheet.create({
  cardHeader: {
    marginBottom: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 5, // Add some padding to prevent edge compression
  },
  cardHeaderRTL: {
    flexDirection: "row-reverse",
    
  },
  todayText: {
    fontSize: 22,
  },
  dateText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 16,
    minWidth: 100, // Ensure minimum width for date text
    flexShrink: 0, // Prevent shrinking when space is tight
  },
  dateContainer: {
    minWidth: 120, // Ensure container has enough space
  },
});
