import React from 'react';
import {View, Text, StyleSheet, Image, ImageSourcePropType} from 'react-native';
import {Colors} from '../constants/colors';
import {rMS, rS, rV} from './responsive';
import {Space} from '../constants/spacing';
import Card from './Card';
import Feather from 'react-native-vector-icons/Feather';

interface ContinueReadingCardProps {
  cantoId: number | null;
  cantoTitle: string;
  chapterId: number | null;
  verseNumber: number | null;
  coverImage: ImageSourcePropType;
  onPress: () => void;
}

const ContinueReadingCard: React.FC<ContinueReadingCardProps> = ({
  cantoId,
  cantoTitle,
  chapterId,
  verseNumber,
  coverImage,
  onPress,
}) => {
  if (!cantoId || !chapterId || !verseNumber) {
    return null;
  }

  return (
    <Card onPress={onPress} padding={Space.sm} marginBottom={0}>
      <View style={styles.container}>
        <View style={styles.imageContainer}>
          <Image source={coverImage} style={styles.image} />
        </View>
        <View style={styles.content}>
          <Text style={styles.cantoText}>Canto {cantoId}</Text>
          <Text style={styles.titleText} numberOfLines={1}>
            {cantoTitle}
          </Text>
          <Text style={styles.verseText}>
            Ch.{chapterId} • V.{verseNumber}
          </Text>
        </View>
        <Feather
          name="chevron-right"
          size={rMS(18)}
          color={Colors.primary}
          style={styles.chevron}
        />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginLeft: Space.sm,
    marginRight: Space.xs,
  },
  cantoText: {
    fontSize: rMS(14),
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: rV(2),
  },
  titleText: {
    fontSize: rMS(12),
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: rV(2),
  },
  verseText: {
    fontSize: rMS(11),
    color: Colors.textLight,
  },
  imageContainer: {
    marginRight: 0,
  },
  image: {
    width: rS(40),
    height: rV(55),
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
  },
  chevron: {
    marginLeft: Space.xs,
  },
});

export default ContinueReadingCard;
