import { useEffect, useRef, useCallback } from 'react';
import { Animated } from 'react-native';

interface ModalAnimationConfig {
  slideFrom?: number;      // Default: 300
  fadeDuration?: number;   // Default: 200
  slideDuration?: number;  // Default: 250
  tension?: number;        // Default: 65
  friction?: number;       // Default: 11
}

interface ModalAnimationReturn {
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
}

/**
 * Custom hook for modal slide-up and fade animations
 *
 * @param visible - Whether the modal is visible
 * @param config - Optional animation configuration
 * @returns An object containing fadeAnim and slideAnim values
 *
 * @example
 * const { fadeAnim, slideAnim } = useModalAnimation(visible);
 *
 * <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
 * <Animated.View style={[styles.modal, { transform: [{ translateY: slideAnim }] }]} />
 */
export function useModalAnimation(
  visible: boolean,
  config: ModalAnimationConfig = {}
): ModalAnimationReturn {
  const {
    slideFrom = 300,
    fadeDuration = 200,
    slideDuration = 250,
    tension = 65,
    friction = 11,
  } = config;

  const slideAnim = useRef(new Animated.Value(slideFrom)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const animateIn = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: fadeDuration,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension,
        friction,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, fadeDuration, tension, friction]);

  const animateOut = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: fadeDuration,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: slideFrom,
        duration: slideDuration,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, fadeDuration, slideFrom, slideDuration]);

  useEffect(() => {
    if (visible) {
      animateIn();
    } else {
      animateOut();
    }
  }, [visible, animateIn, animateOut]);

  return {
    fadeAnim,
    slideAnim,
  };
}
