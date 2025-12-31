import { StyleSheet } from 'react-native';
import { palette } from '../../Styles/Palette';

export const CurrentWeatherStyles = StyleSheet.create({
  mainArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tempArea: {
    textAlign: 'right',
    flexDirection: "column",
    alignContent: "flex-end",
  },
  tempLastLetterC: {
    fontSize: 60/2,
    textAlignVertical: 'top',
    paddingHorizontal: 2,
  },
  tempLastLetterF: {
    fontSize: 30/2,
    textAlignVertical: 'top',
    paddingHorizontal: 2,
  },
  locationIndicator: {
    alignItems: 'center',
    paddingVertical: 4,
    marginTop: 8,
  },
  indicatorText: {
    fontSize: 12,
    color: palette.highlightColor,
    opacity: 0.6,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
  },
});