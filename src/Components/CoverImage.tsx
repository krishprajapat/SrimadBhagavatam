import React from 'react';
import {Image, StyleSheet, ImageSourcePropType, Dimensions} from 'react-native';
import {Colors} from '../constants/colors';
import {rS} from './responsive';

const {width} = Dimensions.get('window');

interface CoverImageProps {
  source: ImageSourcePropType;
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

const CoverImage: React.FC<CoverImageProps> = ({
  source,
  size = 'medium',
  style,
}) => {
  const getSize = () => {
    switch (size) {
      case 'small':
        return {width: width / 4, height: (width / 4) * 1.4};
      case 'large':
        return {width: width / 2.5, height: (width / 2.5) * 1.4};
      default:
        return {width: width / 3, height: (width / 3) * 1.4};
    }
  };

  const sizeStyle = getSize();

  return (
    <Image
      source={source}
      style={[
        styles.cover,
        {
          width: sizeStyle.width,
          height: sizeStyle.height,
        },
        style,
      ]}
      resizeMode="cover"
    />
  );
};

const styles = StyleSheet.create({
  cover: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.cardBorder,
    shadowColor: Colors.cardShadow,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
});

export default CoverImage;
