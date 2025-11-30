import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ImageBackground,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
  Animated,
  ScrollView,
} from 'react-native';
import {
  GestureHandlerRootView,
  ScrollView as GScrollView,
} from 'react-native-gesture-handler';
import RoundNavigationButton from '../Components/RoundNavigationButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SQLite from 'react-native-sqlite-storage';
import {useFocusEffect} from '@react-navigation/native';
import {BottomSheetModal, BottomSheetModalProvider} from '@gorhom/bottom-sheet';
import Feather from 'react-native-vector-icons/Feather';
import {rS, rMS, rV} from '../Components/responsive';
import {NativeSyntheticEvent, NativeScrollEvent} from 'react-native';
import {checkAndShowAd} from '../utils/adManager';
import Orientation from 'react-native-orientation-locker';
import {Colors} from '../constants/colors';
import {fadeIn} from '../constants/animations';
import {Space} from '../constants/spacing';
import {StatusBar} from 'react-native';

const {width, height} = Dimensions.get('window');

interface Chapter {
  id: number;
  chapterNumber: number;
  cantoId: number;
}

interface Canto {
  id: number;
  cantoNumber: number;
}

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

const themes = {
  black: {
    backgroundImage: require('../Images/black.jpg'),
    backgroundColor: Colors.backgroundDark, // Fallback color
    textColor: '#F5F5F5', // Lighter for better visibility on dark
    verseTextColor: '#E2852E', // Orange for verse text
    iconColor: '#FFFFFF', // White icons for dark mode
    circleColor: Colors.backgroundDark,
    border: Colors.cardBorder,
  },
  white: {
    backgroundImage: null, // Use solid color to match Chapter screen
    backgroundColor: Colors.background, // Match Chapter screen background color
    textColor: Colors.textPrimary,
    verseTextColor: '#E2852E', // Orange for verse text
    iconColor: Colors.textPrimary, // Dark icons for light mode
    circleColor: Colors.card,
    border: Colors.cardBorder,
  },
  default: {
    backgroundImage: require('../Images/3.jpg'),
    backgroundColor: Colors.background, // Fallback color matching Chapter screen
    textColor: Colors.textPrimary,
    verseTextColor: '#E2852E', // Orange for verse text
    iconColor: Colors.textPrimary, // Dark icons for default
    circleColor: Colors.primary,
    border: Colors.cardBorder,
  },
};

type ThemeKey = 'black' | 'white' | 'default';

export const db1 = SQLite.openDatabase(
  {name: 'Book1.db', location: 'default'},
  () => {
    console.log('Database opened successfully');
  },
  error => {
    console.log('Error opening database: ', error);
  },
);

interface Verse {
  id: number;
  verseNumber: number;
  text: string;
  synonyms: string;
  translation: string;
  purport: string;
  cantoId: number;
  chapterId: number;
}

const VerseScreen = ({route, navigation}: any) => {
  const {
    chapterNumber,
    chapterId,
    cantoId,
    verseNumber: initialVerseNumber,
  } = route.params;

  const [verses, setVerses] = useState<Verse[]>([]);
  const [currentVerseIndex, setCurrentVerseIndex] = useState<number>(0);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState(rMS(16));
  const [currentTheme, setCurrentTheme] = useState<ThemeKey>('white'); // Default to white theme to match Chapter screen
  const bottomSheetModalRefForIcon = useRef<BottomSheetModal>(null);
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [areNavButtonsVisible, setAreNavButtonsVisible] = useState(true);
  const {width: screenWidth, height: screenHeight} = useWindowDimensions();
  const [orientation, setOrientation] = useState<'PORTRAIT' | 'LANDSCAPE'>(
    'PORTRAIT',
  );

  const themeStyles = themes[currentTheme];

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

  // Initialize database table
  useEffect(() => {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS Bookmarks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        verseId INTEGER,
        chapterId INTEGER,
        cantoId INTEGER,
        chapterNumber INTEGER, 
        verseNumber INTEGER,
        text TEXT
      );
    `;
    db1.transaction(tx => {
      tx.executeSql(
        createTableSQL,
        [],
        () => console.log('Table created successfully'),
        error => console.log('Error creating table: ', error),
      );
    });
  }, []);

  // Fetch chapter ID if only chapterNumber is provided
  const fetchChapterId = async (
    chapterNumber: number,
  ): Promise<number | null> => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT id FROM Chapters WHERE chapterNumber = ? AND cantoId = ?',
          [chapterNumber, cantoId],
          (_, {rows}) => {
            if (rows.length > 0) {
              resolve(rows.item(0).id);
            } else {
              resolve(null);
            }
          },
          error => {
            console.log('Error fetching chapter ID: ', error);
            reject(error);
          },
        );
      });
    });
  };

  // Fetch verses
  const fetchVerses = (chapterIdParam: number): Promise<Verse[]> => {
    return new Promise<Verse[]>((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM Verses WHERE chapterId = ? ORDER BY verseNumber',
          [chapterIdParam],
          (_, {rows}) => {
            const verses: Verse[] = [];
            for (let i = 0; i < rows.length; i++) {
              verses.push(rows.item(i) as Verse);
            }
            resolve(verses);
          },
          error => {
            console.log('Error fetching verses: ', error);
            reject(error);
          },
        );
      });
    });
  };

  // Fetch chapter
  const fetchChapter = (chapterIdParam: number) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM Chapters WHERE id = ?',
        [chapterIdParam],
        (_, {rows}) => {
          if (rows.length > 0) {
            setChapter(rows.item(0));
          }
        },
        error => console.log('Error fetching chapter: ', error),
      );
    });
  };

  // Load verses - consolidated logic
  useEffect(() => {
    const loadVerses = async () => {
      setIsLoading(true);
      try {
        let actualChapterId = chapterId;

        // If only chapterNumber is provided, fetch chapterId
        if (!actualChapterId && chapterNumber) {
          actualChapterId = (await fetchChapterId(chapterNumber)) || 0;
        }

        if (actualChapterId) {
          fetchChapter(actualChapterId);
          const fetchedVerses = await fetchVerses(actualChapterId);
          setVerses(fetchedVerses);

          // Set initial verse index
          if (initialVerseNumber && fetchedVerses.length > 0) {
            const verseIndex = fetchedVerses.findIndex(
              v => v.verseNumber === initialVerseNumber,
            );
            if (verseIndex !== -1) {
              setCurrentVerseIndex(verseIndex);
            }
          }

          // Check bookmark for current verse
          if (fetchedVerses.length > 0) {
            const currentVerse = fetchedVerses[0];
            checkIfBookmarked(
              currentVerse.id,
              actualChapterId,
              cantoId,
              chapterNumber || currentVerse.chapterId,
            );
          }
        }
      } catch (error) {
        console.error('Error loading verses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadVerses();
  }, [chapterId, chapterNumber, cantoId, initialVerseNumber]);

  // Check if bookmarked
  const checkIfBookmarked = (
    verseId: number,
    chapterIdParam: number,
    cantoIdParam: number,
    chapterNumberParam: number,
  ) => {
    db1.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM Bookmarks WHERE verseId = ? AND chapterId = ? AND cantoId = ? AND chapterNumber = ?',
        [verseId, chapterIdParam, cantoIdParam, chapterNumberParam],
        (_, {rows}) => {
          setIsBookmarked(rows.length > 0);
        },
        error => console.log('Error checking bookmark: ', error),
      );
    });
  };

  // Update bookmark check when verse changes
  useFocusEffect(
    useCallback(() => {
      if (
        verses.length > 0 &&
        currentVerseIndex >= 0 &&
        currentVerseIndex < verses.length
      ) {
        const verse = verses[currentVerseIndex];
        checkIfBookmarked(
          verse.id,
          verse.chapterId,
          cantoId,
          chapter?.chapterNumber || chapterNumber || 0,
        );
      }
    }, [currentVerseIndex, verses, cantoId, chapter, chapterNumber]),
  );

  // Save last read verse
  useEffect(() => {
    return () => {
      if (
        verses.length > 0 &&
        currentVerseIndex >= 0 &&
        currentVerseIndex < verses.length
      ) {
        const verse = verses[currentVerseIndex];
        const lastReadVerse = {
          cantoId: cantoId,
          chapterId: chapter?.chapterNumber || chapterNumber || 0,
          verseNumber: verse.verseNumber,
        };
        AsyncStorage.setItem('lastReadVerse', JSON.stringify(lastReadVerse));
      }
    };
  }, [currentVerseIndex, verses, cantoId, chapter, chapterNumber]);

  // Toggle bookmark
  const toggleBookmark = () => {
    if (
      verses.length === 0 ||
      currentVerseIndex < 0 ||
      currentVerseIndex >= verses.length
    ) {
      return;
    }

    const verse = verses[currentVerseIndex];
    const chapterNumberParam = chapter?.chapterNumber || chapterNumber || 0;

    if (isBookmarked) {
      db1.transaction(tx => {
        tx.executeSql(
          'DELETE FROM Bookmarks WHERE verseId = ? AND chapterId = ? AND cantoId = ? AND chapterNumber = ?',
          [verse.id, verse.chapterId, cantoId, chapterNumberParam],
          () => {
            setIsBookmarked(false);
          },
          error => console.log('Error removing bookmark: ', error),
        );
      });
    } else {
      db1.transaction(tx => {
        tx.executeSql(
          'INSERT INTO Bookmarks (verseId, chapterId, cantoId, chapterNumber, verseNumber, text) VALUES (?, ?, ?, ?, ?, ?)',
          [
            verse.id,
            verse.chapterId,
            cantoId,
            chapterNumberParam,
            verse.verseNumber,
            verse.text,
          ],
          () => {
            setIsBookmarked(true);
          },
          error => console.log('Error saving bookmark: ', error),
        );
      });
    }
  };

  const increaseFontSize = () => {
    if (fontSize < rMS(30)) {
      setFontSize(fontSize + 1);
    }
  };

  const decreaseFontSize = () => {
    if (fontSize > rMS(12)) {
      setFontSize(fontSize - 1);
    }
  };

  const cycleTheme = () => {
    const themeKeys: ThemeKey[] = ['default', 'white', 'black'];
    const currentIndex = themeKeys.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themeKeys.length;
    setCurrentTheme(themeKeys[nextIndex]);
  };

  const fetchNextChapter = async (
    chapterIdParam: number | undefined,
  ): Promise<Chapter | null> => {
    if (!chapterIdParam) return null;
    return new Promise<Chapter | null>((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM Chapters WHERE id > ? ORDER BY id ASC LIMIT 1',
          [chapterIdParam],
          (_, {rows}) => {
            resolve(rows.length > 0 ? rows.item(0) : null);
          },
          error => reject(error),
        );
      });
    });
  };

  const fetchPreviousChapter = async (
    chapterIdParam: number | undefined,
  ): Promise<Chapter | null> => {
    if (!chapterIdParam) return null;
    return new Promise<Chapter | null>((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM Chapters WHERE id < ? ORDER BY id DESC LIMIT 1',
          [chapterIdParam],
          (_, {rows}) => {
            resolve(rows.length > 0 ? rows.item(0) : null);
          },
          error => reject(error),
        );
      });
    });
  };

  const navigateToNextVerse = async () => {
    await checkAndShowAd();
    if (currentVerseIndex < verses.length - 1) {
      setCurrentVerseIndex(currentVerseIndex + 1);
    } else {
      const nextChapter = await fetchNextChapter(chapter?.id);
      if (nextChapter) {
        setChapter(nextChapter);
        const nextChapterVerses = await fetchVerses(nextChapter.id);
        setVerses(nextChapterVerses);
        setCurrentVerseIndex(0);
      }
    }
  };

  const navigateToPreviousVerse = async () => {
    await checkAndShowAd();
    if (currentVerseIndex > 0) {
      setCurrentVerseIndex(currentVerseIndex - 1);
    } else {
      const prevChapter = await fetchPreviousChapter(chapter?.id);
      if (prevChapter) {
        setChapter(prevChapter);
        const prevChapterVerses = await fetchVerses(prevChapter.id);
        setVerses(prevChapterVerses);
        setCurrentVerseIndex(prevChapterVerses.length - 1);
      }
    }
  };

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const yOffset = event.nativeEvent.contentOffset.y;
      setAreNavButtonsVisible(yOffset <= 0);
    },
    [],
  );

  const toggleOrientation = () => {
    if (orientation === 'PORTRAIT') {
      Orientation.lockToLandscape();
      setOrientation('LANDSCAPE');
    } else {
      Orientation.lockToPortrait();
      setOrientation('PORTRAIT');
    }
  };

  useEffect(() => {
    const handleOrientationChange = (o: string) => {
      if (o === 'LANDSCAPE-LEFT' || o === 'LANDSCAPE-RIGHT') {
        setOrientation('LANDSCAPE');
      } else if (o === 'PORTRAIT') {
        setOrientation('PORTRAIT');
      }
    };
    Orientation.addOrientationListener(handleOrientationChange);
    return () => {
      Orientation.removeOrientationListener(handleOrientationChange);
    };
  }, []);

  useEffect(() => {
    return () => {
      Orientation.lockToPortrait();
    };
  }, []);

  const openBottomSheet = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const closeBottomSheet = useCallback(() => {
    bottomSheetModalRef.current?.dismiss();
  }, []);

  const openBottomSheetForIcon = useCallback(() => {
    bottomSheetModalRefForIcon.current?.present();
  }, []);

  const closeBottomSheetForIcon = useCallback(() => {
    bottomSheetModalRefForIcon.current?.dismiss();
  }, []);

  const renderVerse = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      );
    }

    if (
      verses.length === 0 ||
      currentVerseIndex < 0 ||
      currentVerseIndex >= verses.length
    ) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, {color: themeStyles.textColor}]}>
            No verses found
          </Text>
        </View>
      );
    }

    const verse = verses[currentVerseIndex];
    return (
      <GScrollView
        style={styles.contentContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}>
        <Text style={[styles.verseNumber, {color: themeStyles.textColor}]}>
          SB {cantoId}.{chapter?.chapterNumber || chapterNumber || 0}.
          {verse.verseNumber}
        </Text>
        <Text
          style={[
            styles.verseText,
            {
              fontFamily: 'Mukta-ExtraBold',
              fontSize: fontSize + 1.5,
              color: themeStyles.verseTextColor, // Matches background theme
              letterSpacing: 1.2,
              lineHeight: (fontSize + 1.5) * 1.8,
            },
          ]}>
          {verse.text}
        </Text>
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                fontFamily: 'Mukta-Bold',
                color: themeStyles.textColor,
                lineHeight: fontSize * 1.8,
              },
              {fontSize: fontSize},
            ]}>
            Synonyms
          </Text>
          <Text
            style={[
              styles.sectionContent,
              {
                fontFamily: 'Mukta-Medium',
                color: themeStyles.textColor,
                lineHeight: fontSize * 1.8,
              },
              {fontSize: fontSize},
            ]}>
            {verse.synonyms}
          </Text>
        </View>
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                fontFamily: 'Mukta-Bold',
                color: themeStyles.textColor,
                lineHeight: fontSize * 1.8,
              },
              {fontSize: fontSize},
            ]}>
            Translation
          </Text>
          <Text
            style={[
              styles.sectionContent,
              {
                fontFamily: 'Mukta-Medium',
                color: themeStyles.textColor,
                lineHeight: fontSize * 1.8,
              },
              {fontSize: fontSize},
            ]}>
            {verse.translation}
          </Text>
        </View>
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                fontFamily: 'Mukta-Bold',
                color: themeStyles.textColor,
                lineHeight: fontSize * 1.8,
              },
              {fontSize: fontSize},
            ]}>
            Purport
          </Text>
          <Text
            style={[
              styles.sectionContent,
              {
                fontFamily: 'Mukta-Light',
                color: themeStyles.textColor,
                lineHeight: fontSize * 1.8,
              },
              {fontSize: fontSize},
            ]}>
            {verse.purport}
          </Text>
        </View>
      </GScrollView>
    );
  };

  if (isLoading && verses.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <BottomSheetModalProvider>
        {themeStyles.backgroundImage ? (
          <ImageBackground
            source={themeStyles.backgroundImage}
            style={styles.backgroundImage}>
            <StatusBar
              barStyle={
                currentTheme === 'black' ? 'light-content' : 'dark-content'
              }
              translucent={true}
              backgroundColor="transparent"
            />
            <View
              style={[styles.container, {paddingTop: getSafeAreaPadding()}]}>
              <View style={styles.headerRow}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => navigation.goBack()}
                  activeOpacity={0.7}>
                  <Feather
                    name="arrow-left"
                    size={rMS(24)}
                    color={themeStyles.textColor}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.orientationButton}
                  onPress={toggleOrientation}
                  activeOpacity={0.7}>
                  <Feather
                    name="rotate-cw"
                    size={rMS(22)}
                    color={themeStyles.textColor}
                  />
                </TouchableOpacity>
              </View>
              {renderVerse()}
            </View>

            {areNavButtonsVisible && verses.length > 0 && (
              <View
                style={[
                  styles.navigationButtons,
                  orientation === 'LANDSCAPE'
                    ? {
                        top: screenHeight * 0.4,
                        paddingHorizontal: Space.md,
                      }
                    : {
                        top: screenHeight * 0.75,
                        paddingHorizontal: Space.md,
                      },
                ]}>
                <RoundNavigationButton
                  onPress={navigateToPreviousVerse}
                  iconName="arrow-left"
                  style={styles.navigationButton}
                />
                <RoundNavigationButton
                  onPress={navigateToNextVerse}
                  iconName="arrow-right"
                  style={styles.navigationButton}
                />
              </View>
            )}

            <View style={styles.bottomTabBar}>
              <View style={styles.bottomTabBarInner}>
                <TouchableOpacity
                  style={styles.tabButton}
                  onPress={openBottomSheetForIcon}
                  activeOpacity={0.6}>
                  <View style={styles.tabIconWrapper}>
                    <Feather
                      name="type"
                      size={rMS(22)}
                      color={Colors.textPrimary}
                    />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.tabButton}
                  onPress={openBottomSheet}
                  activeOpacity={0.6}>
                  <View style={styles.tabIconWrapper}>
                    <Feather
                      name="list"
                      size={rMS(22)}
                      color={Colors.textPrimary}
                    />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.tabButton}
                  onPress={cycleTheme}
                  activeOpacity={0.6}>
                  <View
                    style={[
                      styles.themeButton,
                      {backgroundColor: themeStyles.circleColor},
                    ]}>
                    <View
                      style={[
                        styles.themeButtonInner,
                        {borderColor: themeStyles.border},
                      ]}
                    />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.tabButton}
                  onPress={toggleBookmark}
                  activeOpacity={0.6}>
                  <View style={styles.tabIconWrapper}>
                    <Feather
                      name="bookmark"
                      size={rMS(22)}
                      color={isBookmarked ? Colors.primary : Colors.textPrimary}
                      fill={isBookmarked ? Colors.primary : 'none'}
                    />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </ImageBackground>
        ) : (
          <View
            style={[
              styles.backgroundImage,
              {
                backgroundColor:
                  themeStyles.backgroundColor || Colors.background,
              },
            ]}>
            <StatusBar
              barStyle={
                currentTheme === 'black' ? 'light-content' : 'dark-content'
              }
              translucent={true}
              backgroundColor="transparent"
            />
            <View
              style={[styles.container, {paddingTop: getSafeAreaPadding()}]}>
              <View style={styles.headerRow}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => navigation.goBack()}
                  activeOpacity={0.7}>
                  <Feather
                    name="arrow-left"
                    size={rMS(24)}
                    color={themeStyles.textColor}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.orientationButton}
                  onPress={toggleOrientation}
                  activeOpacity={0.7}>
                  <Feather
                    name="rotate-cw"
                    size={rMS(22)}
                    color={themeStyles.textColor}
                  />
                </TouchableOpacity>
              </View>
              {renderVerse()}
            </View>

            {areNavButtonsVisible && verses.length > 0 && (
              <View
                style={[
                  styles.navigationButtons,
                  orientation === 'LANDSCAPE'
                    ? {
                        top: screenHeight * 0.4,
                        paddingHorizontal: Space.md,
                      }
                    : {
                        top: screenHeight * 0.75,
                        paddingHorizontal: Space.md,
                      },
                ]}>
                <RoundNavigationButton
                  onPress={navigateToPreviousVerse}
                  iconName="arrow-left"
                  style={styles.navigationButton}
                />
                <RoundNavigationButton
                  onPress={navigateToNextVerse}
                  iconName="arrow-right"
                  style={styles.navigationButton}
                />
              </View>
            )}

            <View style={styles.bottomTabBar}>
              <View style={styles.bottomTabBarInner}>
                <TouchableOpacity
                  style={styles.tabButton}
                  onPress={openBottomSheetForIcon}
                  activeOpacity={0.6}>
                  <View style={styles.tabIconWrapper}>
                    <Feather
                      name="type"
                      size={rMS(22)}
                      color={Colors.textPrimary}
                    />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.tabButton}
                  onPress={openBottomSheet}
                  activeOpacity={0.6}>
                  <View style={styles.tabIconWrapper}>
                    <Feather
                      name="list"
                      size={rMS(22)}
                      color={Colors.textPrimary}
                    />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.tabButton}
                  onPress={cycleTheme}
                  activeOpacity={0.6}>
                  <View
                    style={[
                      styles.themeButton,
                      {backgroundColor: themeStyles.circleColor},
                    ]}>
                    <View
                      style={[
                        styles.themeButtonInner,
                        {borderColor: themeStyles.border},
                      ]}
                    />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.tabButton}
                  onPress={toggleBookmark}
                  activeOpacity={0.6}>
                  <View style={styles.tabIconWrapper}>
                    <Feather
                      name="bookmark"
                      size={rMS(22)}
                      color={isBookmarked ? Colors.primary : Colors.textPrimary}
                      fill={isBookmarked ? Colors.primary : 'none'}
                    />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <BottomSheetModal
          ref={bottomSheetModalRef}
          index={0}
          snapPoints={['45%', '65%', '85%']}
          handleComponent={() => <View style={styles.handle} />}
          backgroundStyle={{
            backgroundColor: Colors.card,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
          }}>
          <View style={styles.bottomSheetContainer}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.cantoAndChapterInfo}>
                Canto {cantoId} • Chapter{' '}
                {chapter?.chapterNumber || chapterNumber || 0}
              </Text>
              <Text style={styles.verseCountText}>{verses.length} Verses</Text>
            </View>
            <FlatList
              data={verses}
              showsVerticalScrollIndicator={false}
              renderItem={({item}) => {
                const isActive =
                  currentVerseIndex ===
                  verses.findIndex(v => v.verseNumber === item.verseNumber);
                return (
                  <TouchableOpacity
                    onPress={() => {
                      const verseIndex = verses.findIndex(
                        v => v.verseNumber === item.verseNumber,
                      );
                      if (verseIndex !== -1) {
                        setCurrentVerseIndex(verseIndex);
                        closeBottomSheet();
                      }
                    }}
                    activeOpacity={0.7}
                    style={styles.verseButtonContainer}>
                    <View
                      style={[
                        styles.verseNumberItem,
                        isActive && styles.verseNumberItemActive,
                      ]}>
                      <Text
                        style={[
                          styles.flatListItemText,
                          isActive && styles.flatListItemTextActive,
                        ]}>
                        {item.verseNumber}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
              keyExtractor={item => item.id.toString()}
              numColumns={orientation === 'LANDSCAPE' ? 11 : 5}
              contentContainerStyle={styles.verseListContent}
              columnWrapperStyle={
                orientation !== 'LANDSCAPE' ? styles.verseRow : undefined
              }
            />
          </View>
        </BottomSheetModal>

        <BottomSheetModal
          ref={bottomSheetModalRefForIcon}
          index={0}
          snapPoints={['30%', '45%']}
          handleComponent={() => <View style={styles.handle} />}
          backgroundStyle={{backgroundColor: Colors.card}}>
          <View style={styles.fontSizeContainer}>
            <Text style={styles.fontSizeTitle}>Font Size</Text>
            <View style={styles.fontSizeControls}>
              <TouchableOpacity
                onPress={decreaseFontSize}
                style={styles.fontSizeButton}
                activeOpacity={0.7}
                disabled={fontSize <= rMS(12)}>
                <Feather
                  name="minus"
                  size={rMS(24)}
                  color={
                    fontSize <= rMS(12) ? Colors.textLight : Colors.textPrimary
                  }
                />
              </TouchableOpacity>
              <View style={styles.fontSizeDisplay}>
                <Text style={styles.fontSizeText}>{Math.round(fontSize)}</Text>
              </View>
              <TouchableOpacity
                onPress={increaseFontSize}
                style={styles.fontSizeButton}
                activeOpacity={0.7}
                disabled={fontSize >= rMS(30)}>
                <Feather
                  name="plus"
                  size={rMS(24)}
                  color={
                    fontSize >= rMS(30) ? Colors.textLight : Colors.textPrimary
                  }
                />
              </TouchableOpacity>
            </View>
          </View>
        </BottomSheetModal>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
};

export default VerseScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Space.xl,
  },
  emptyText: {
    fontSize: rMS(18),
    fontWeight: '500',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Space.md,
    paddingTop: Space.md,
    paddingBottom: Space.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.cardShadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orientationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.cardShadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Space.md,
    paddingBottom: height * 0.2, // Extra padding to prevent text hiding behind bottom tab
  },
  verseNumber: {
    fontSize: rMS(20),
    fontWeight: '600',
    textAlign: 'center',
    marginTop: Space.md,
    marginBottom: Space.lg,
    letterSpacing: 0.5,
  },
  verseText: {
    textAlign: 'center',
    marginBottom: Space.xl,
  },
  section: {
    marginTop: Space.xl,
    marginBottom: Space.md,
  },
  sectionTitle: {
    textAlign: 'center',
    marginBottom: Space.md,
    fontWeight: '600',
  },
  sectionContent: {
    textAlign: 'left',
    marginTop: Space.sm,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    width: '100%',
    left: 0,
    right: 0,
    zIndex: 10,
  },
  navigationButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom:
      Platform.OS === 'ios'
        ? height > 800
          ? 34
          : 20
        : Platform.OS === 'android'
        ? height > 800
          ? Space.lg
          : Space.md
        : Space.md,
    paddingTop: Space.md,
    backgroundColor: 'transparent',
  },
  bottomTabBarInner: {
    backgroundColor: Colors.card,
    marginHorizontal: Space.md,
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: Space.md,
    paddingHorizontal: Space.sm,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: Colors.cardShadow,
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 16,
    ...Platform.select({
      ios: {
        backgroundColor: Colors.blur,
      },
      android: {
        backgroundColor: Colors.card,
      },
    }),
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.cardShadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  themeButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
  },
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  bottomSheetContainer: {
    flex: 1,
    backgroundColor: Colors.card,
    paddingHorizontal: Space.lg,
    paddingTop: Space.md,
    paddingBottom: Space.xl,
  },
  bottomSheetHeader: {
    marginBottom: Space.lg,
    paddingBottom: Space.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  cantoAndChapterInfo: {
    fontSize: rMS(22),
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Space.xs,
    letterSpacing: 0.3,
  },
  verseCountText: {
    fontSize: rMS(14),
    fontWeight: '500',
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: Space.xs,
  },
  verseListContent: {
    paddingBottom: Space.xl,
  },
  verseRow: {
    justifyContent: 'space-between',
    marginBottom: Space.sm,
  },
  verseButtonContainer: {
    flex: 1,
    maxWidth: '20%',
    marginHorizontal: Space.xs,
  },
  verseNumberItem: {
    width: '100%',
    alignItems: 'center',
    borderRadius: 16,
    overflow: 'hidden',
  },
  verseNumberItemActive: {
    transform: [{scale: 1.05}],
  },
  flatListItemText: {
    fontSize: rMS(16),
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
    paddingVertical: Space.md,
    borderRadius: 16,
    shadowColor: Colors.cardShadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    width: '100%',
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    fontWeight: '600',
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
  },
  flatListItemTextActive: {
    backgroundColor: Colors.primary,
    color: Colors.textOnDark,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fontSizeContainer: {
    padding: Space.lg,
    alignItems: 'center',
  },
  fontSizeTitle: {
    fontSize: rMS(20),
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Space.xl,
  },
  fontSizeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  fontSizeButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.cardShadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  fontSizeDisplay: {
    marginHorizontal: Space.xl,
    minWidth: 60,
    alignItems: 'center',
  },
  fontSizeText: {
    fontSize: rMS(24),
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  handle: {
    width: rS(40),
    height: rV(4),
    backgroundColor: Colors.cardBorder,
    borderRadius: rS(4),
    marginVertical: Space.sm,
    alignSelf: 'center',
  },
});
