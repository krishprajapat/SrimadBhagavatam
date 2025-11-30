import React, {useRef, useEffect} from 'react';
import {View, Text, StyleSheet, Animated} from 'react-native';
import {Colors} from '../constants/colors';
import {rMS, rS, rV} from './responsive';
import {Space} from '../constants/spacing';
import Card from './Card';
import Feather from 'react-native-vector-icons/Feather';
import {fadeIn} from '../constants/animations';

interface ChapterListItemProps {
  chapterNumber: number;
  title: string;
  onPress: () => void;
  index: number;
}

const ChapterListItem: React.FC<ChapterListItemProps> = ({
  chapterNumber,
  title,
  onPress,
  index,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeIn(fadeAnim, 300, index * 50).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{scale: fadeAnim}],
        },
      ]}>
      <Card onPress={onPress} padding={Space.md} marginBottom={Space.sm}>
        <View style={styles.content}>
          <View style={styles.textContainer}>
            <Text style={styles.chapterNumber}>Chapter {chapterNumber}</Text>
            {title ? (
              <Text style={styles.title} numberOfLines={2}>
                {title}
              </Text>
            ) : null}
          </View>
          <Feather
            name="chevron-right"
            size={rMS(20)}
            color={Colors.primary}
            style={styles.chevron}
          />
        </View>
      </Card>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Space.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    marginRight: Space.md,
  },
  chapterNumber: {
    fontSize: rMS(16),
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: rV(6),
  },
  title: {
    fontSize: rMS(14),
    color: Colors.textSecondary,
    lineHeight: rMS(20),
  },
  chevron: {
    flexShrink: 0,
  },
});

export default ChapterListItem;
