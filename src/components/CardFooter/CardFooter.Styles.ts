import { StyleSheet } from "react-native";

export const CardFooterStyles = StyleSheet.create({
  cardFooter: {
    marginVertical: 5,
    flexDirection: "row",
    flex: 1,
    justifyContent: "flex-start",
  },
  cardFooterRTL: {
    justifyContent: "flex-end",
  },
  locationIcon: {
    width: 22,
    height: 22,
    marginRight: 10,
  },
});
