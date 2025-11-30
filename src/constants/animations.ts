import {Animated, Easing} from 'react-native';

// Animation timing constants
export const AnimationTiming = {
  fast: 200,
  normal: 300,
  slow: 500,
};

// Easing functions
export const EasingFunctions = {
  easeInOut: Easing.bezier(0.4, 0, 0.2, 1),
  easeOut: Easing.bezier(0.0, 0, 0.2, 1),
  easeIn: Easing.bezier(0.4, 0, 1, 1),
  spring: Easing.elastic(1),
};

// Fade in animation
export const fadeIn = (
  animatedValue: Animated.Value,
  duration: number = AnimationTiming.normal,
  delay: number = 0,
) => {
  return Animated.timing(animatedValue, {
    toValue: 1,
    duration,
    delay,
    easing: EasingFunctions.easeOut,
    useNativeDriver: true,
  });
};

// Fade out animation
export const fadeOut = (
  animatedValue: Animated.Value,
  duration: number = AnimationTiming.normal,
) => {
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    easing: EasingFunctions.easeIn,
    useNativeDriver: true,
  });
};

// Scale animation
export const scaleIn = (
  animatedValue: Animated.Value,
  duration: number = AnimationTiming.normal,
  delay: number = 0,
) => {
  return Animated.timing(animatedValue, {
    toValue: 1,
    duration,
    delay,
    easing: EasingFunctions.easeOut,
    useNativeDriver: true,
  });
};

// Spring animation for press feedback
export const springPress = (
  animatedValue: Animated.Value,
  toValue: number = 0.95,
) => {
  return Animated.spring(animatedValue, {
    toValue,
    useNativeDriver: true,
    tension: 300,
    friction: 10,
  });
};

