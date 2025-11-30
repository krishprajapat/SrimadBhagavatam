import React from 'react';
import {View, Text, StyleSheet, Platform} from 'react-native';
import {rMS, rV} from './responsive';
import {Colors} from '../constants/colors';

interface LogoProps {
  variant?: 'default' | 'compact';
  style?: any;
}

const Logo: React.FC<LogoProps> = ({variant = 'default', style}) => {
  const isCompact = variant === 'compact';

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.logoText, isCompact && styles.logoCompact]}>
        SRIMAD BHAGAVATAM
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: rMS(22),
    fontFamily:
      Platform.select({
        ios: 'Atop', // iOS might use the font name without suffix
        android: 'Atop-R99O3', // Android might use filename
      }) || 'Atop-R99O3',
    color: '#B8860B', // More intense golden color (darker gold)
    letterSpacing: 0.2,
    textAlign: 'left',
    lineHeight: rMS(28),
    textTransform: 'uppercase',
  },
  logoCompact: {
    fontSize: rMS(18),
    lineHeight: rMS(24),
  },
});

export default Logo;
