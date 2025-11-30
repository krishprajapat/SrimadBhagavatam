import React from 'react';
import {View, StyleSheet, ViewStyle, TouchableOpacity} from 'react-native';
import {Colors} from '../constants/colors';
import {Space} from '../constants/spacing';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: number;
  marginBottom?: number;
  elevated?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  padding = Space.md,
  marginBottom = Space.md,
  elevated = true,
}) => {
  const cardStyle = [
    styles.card,
    {
      padding,
      marginBottom,
      ...(elevated && styles.elevated),
    },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={cardStyle}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  elevated: {
    shadowColor: Colors.cardShadow,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
});

export default Card;
