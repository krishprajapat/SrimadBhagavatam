import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import images from '../Database/Image';
import SQLite from 'react-native-sqlite-storage';
import {rS, rMS, rV} from '../Components/responsive';
import sbTitles from '../Database/sb_title.json';
import {Colors} from '../constants/colors';
import {fadeIn, scaleIn} from '../constants/animations';
import Feather from 'react-native-vector-icons/Feather';
import {Space} from '../constants/spacing';
import ChapterListItem from '../Components/ChapterListItem';
import CoverImage from '../Components/CoverImage';
import {StatusBar} from 'react-native';

interface Chapter {
  id: number;
  chapterNumber: number;
  title: string;
}

interface Canto {
  id: number;
  cantoNumber: number;
}

const {width, height} = Dimensions.get('window');

const db = SQLite.openDatabase(
  {
    name: 'SrimadBhagavatam2.db',
    createFromLocation: 1,
  },
  () => {},
  error => {
    console.log(error.message);
  },
);

const Chapter = ({route, navigation}: any) => {
  const {cantoId} = route.params;
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [cantos, setCantos] = useState<Canto[]>([]);
  const [currentCantoIndex, setCurrentCantoIndex] = useState<number>(0);
  const [cantotitle, setCantotitle] = useState<string>('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  // Calculate safe area padding for all devices
  const getSafeAreaPadding = () => {
    if (Platform.OS === 'ios') {
      return height > 800 ? 44 : 20;
    } else if (Platform.OS === 'android') {
      const statusBarHeight = StatusBar.currentHeight || 0;
      // For tablets and larger screens, use status bar height
      // For phones, ensure minimum padding
      return Math.max(statusBarHeight, 24);
    }
    return 0;
  };

  useEffect(() => {
    Promise.all([fetchChapters(cantoId), fetchAllCantos()]).then(
      ([chapters, cantos]) => {
        setChapters(chapters);
        setCantos(cantos);
        const currentCantoIndex = cantos.findIndex(
          canto => canto.id === cantoId,
        );
        setCurrentCantoIndex(currentCantoIndex);
        fetchCantoTitle(cantoId).then(title => setCantotitle(title));
      },
    );
    fadeIn(fadeAnim, 300).start();
    scaleIn(scaleAnim, 300).start();
  }, [cantoId]);

  const getChapterName = (
    cantoNumber: number,
    chapterNumber: number,
  ): string => {
    const canto = (sbTitles as any[]).find(c => c.cantoNumber === cantoNumber);
    if (!canto) return '';
    const chapter = (canto.chapters || []).find(
      (ch: any) => ch.chapterNumber === chapterNumber,
    );
    return chapter?.chapterName || '';
  };

  const renderCantoImage = () => {
    const adjustedCantoId = cantoId - 1;
    if (adjustedCantoId >= 0 && adjustedCantoId < images.length) {
      return (
        <CoverImage
          source={images[adjustedCantoId]}
          size="medium"
          style={styles.coverImage}
        />
      );
    }
    return null;
  };

  const fetchCantoTitle = (cantoId: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT cantotitle FROM Cantos WHERE id = ?',
          [cantoId],
          (_, {rows}) => {
            if (rows.length > 0) {
              resolve(rows.item(0).cantotitle);
            } else {
              resolve('');
            }
          },
          error => {
            console.log('Error fetching canto title: ', error);
            reject(error);
          },
        );
      });
    });
  };

  const fetchChapters = (cantoId: number): Promise<Chapter[]> => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM Chapters WHERE cantoId = ? ORDER BY chapterNumber',
          [cantoId],
          (_, {rows}) => {
            const chapters: Chapter[] = [];
            for (let i = 0; i < rows.length; i++) {
              chapters.push(rows.item(i) as Chapter);
            }
            resolve(chapters);
          },
          error => {
            console.log('Error fetching chapters: ', error);
            reject(error);
          },
        );
      });
    });
  };

  const fetchAllCantos = (): Promise<Canto[]> => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM Cantos',
          [],
          (_, {rows}) => {
            const cantos: Canto[] = [];
            for (let i = 0; i < rows.length; i++) {
              cantos.push(rows.item(i) as Canto);
            }
            resolve(cantos);
          },
          error => {
            console.log('Error fetching all cantos: ', error);
            reject(error);
          },
        );
      });
    });
  };

  const navigateToCanto = async (index: number) => {
    if (index >= 0 && index < cantos.length) {
      const nextCantoId = cantos[index].id;
      try {
        const title = await fetchCantoTitle(nextCantoId);
        setCantotitle(title);
        navigation.navigate('Chapter', {cantoId: nextCantoId});
      } catch (error) {
        console.error('Error fetching canto title:', error);
      }
    }
  };

  const renderChapterItem = ({item, index}: {item: Chapter; index: number}) => {
    const chapterName =
      item.title || getChapterName(cantoId, item.chapterNumber);
    return (
      <ChapterListItem
        chapterNumber={item.chapterNumber}
        title={chapterName}
        onPress={() =>
          navigation.navigate('Verse', {chapterId: item.id, cantoId: cantoId})
        }
        index={index}
      />
    );
  };

  return (
    <View style={[styles.container, {paddingTop: getSafeAreaPadding()}]}>
      <StatusBar
        barStyle="dark-content"
        translucent={true}
        backgroundColor="transparent"
      />
      <Animated.View
        style={[
          styles.header,
          {opacity: fadeAnim, transform: [{scale: scaleAnim}]},
        ]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}>
          <Feather
            name="arrow-left"
            size={rMS(24)}
            color={Colors.textPrimary}
          />
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={[styles.topSection, {opacity: fadeAnim}]}>
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            onPress={() => navigateToCanto(currentCantoIndex - 1)}
            style={styles.navButton}
            activeOpacity={0.7}
            disabled={currentCantoIndex === 0}>
            <Feather
              name="chevron-left"
              size={rMS(28)}
              color={
                currentCantoIndex === 0 ? Colors.textLight : Colors.primary
              }
            />
          </TouchableOpacity>
          {renderCantoImage()}
          <TouchableOpacity
            onPress={() => navigateToCanto(currentCantoIndex + 1)}
            style={styles.navButton}
            activeOpacity={0.7}
            disabled={currentCantoIndex === cantos.length - 1}>
            <Feather
              name="chevron-right"
              size={rMS(28)}
              color={
                currentCantoIndex === cantos.length - 1
                  ? Colors.textLight
                  : Colors.primary
              }
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>
          Canto {cantoId} {cantotitle}
        </Text>
      </Animated.View>

      <FlatList
        data={chapters}
        renderItem={renderChapterItem}
        keyExtractor={(item: Chapter) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        style={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No chapters found</Text>
          </View>
        }
      />
    </View>
  );
};

export default Chapter;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Space.md,
    paddingTop: Space.md,
    paddingBottom: Space.sm,
  },
  backButton: {
    width: height < 1000 ? rV(43) : rV(35),
    height: height < 1000 ? rV(43) : rV(35),
    borderRadius: 20,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.cardShadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  topSection: {
    paddingHorizontal: Space.md,
    marginTop: Space.md,
    marginBottom: Space.lg,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: Space.lg,
    marginBottom: Space.md,
  },
  navButton: {
    padding: Space.sm,
    borderRadius: 20,
    backgroundColor: Colors.card,
    shadowColor: Colors.cardShadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  coverImage: {
    marginHorizontal: Space.sm,
  },
  title: {
    fontSize: rMS(24),
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 0.5,
    marginTop: Space.md,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingTop: Space.sm,
    paddingBottom: Space.xxxl,
  },
  emptyContainer: {
    padding: Space.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: rMS(16),
    color: Colors.textLight,
    fontWeight: '500',
  },
});
