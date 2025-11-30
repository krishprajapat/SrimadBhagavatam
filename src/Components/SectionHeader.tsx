import React from 'react';
import {Text, StyleSheet, ViewStyle} from 'react-native';
import {Colors} from '../constants/colors';
import {rMS, rV} from './responsive';
import {Space} from '../constants/spacing';

interface SectionHeaderProps {
  title: string;
  style?: ViewStyle;
  marginTop?: number;
  marginBottom?: number;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  style,
  marginTop = Space.lg,
  marginBottom = Space.md,
}) => {
  return (
    <Text
      style={[
        styles.header,
        {
          marginTop,
          marginBottom,
        },
        style,
      ]}>
      {title}
    </Text>
  );
};

const styles = StyleSheet.create({
  header: {
    fontSize: rMS(22),
    fontWeight: '600',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
    paddingHorizontal: Space.md,
  },
});

export default SectionHeader;
