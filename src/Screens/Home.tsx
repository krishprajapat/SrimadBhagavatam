import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  Image,
  Dimensions,
  Animated,
  Platform,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import SQLite from 'react-native-sqlite-storage';
import images from '../Database/Image';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {rS, rMS, rV} from '../Components/responsive';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useFocusEffect} from '@react-navigation/native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import defaultImage from '../Images/white.jpg';
import LinearGradient from 'react-native-linear-gradient';
import {BottomSheetModal, BottomSheetModalProvider} from '@gorhom/bottom-sheet';
import {initializeInterstitialAd, checkAndShowAd} from '../utils/adManager';
import {Colors} from '../constants/colors';
import {fadeIn, scaleIn} from '../constants/animations';
import {Space} from '../constants/spacing';
import SectionHeader from '../Components/SectionHeader';
import ContinueReadingCard from '../Components/ContinueReadingCard';
import Logo from '../Components/Logo';
import Feather from 'react-native-vector-icons/Feather';

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

interface Canto {
  id: number;
  cantoNumber: number;
  cantoId: number;
  cantotitle: string;
}

const {width, height} = Dimensions.get('window');
// Detect if device is a tablet (Android tablets typically have width > 600dp)
const isTablet = width > 600 || (Platform.OS === 'android' && width > 500);

// Calculate available height (screen - header - bottom tab)
// Better handling for different device sizes including tablets
const getHeaderHeight = () => {
  if (Platform.OS === 'ios') {
    return height > 800 ? 100 : 80;
  } else {
    // Android: account for tablets and different screen sizes
    if (isTablet) return 100;
    return height > 800 ? 90 : 80;
  }
};

const getBottomTabHeight = () => {
  if (Platform.OS === 'ios') {
    return height > 800 ? 100 : 80;
  } else {
    // Android: account for tablets
    if (isTablet) return 100;
    return height > 800 ? 90 : 80;
  }
};

const headerHeight = getHeaderHeight();
const bottomTabHeight = getBottomTabHeight();
const availableHeight = height - headerHeight - bottomTabHeight;

// Adjust carousel to fit on screen - responsive for tablets
const Item_width = isTablet ? width * 0.5 : width * 0.65; // Smaller on tablets for better layout
const Item_spacing = Space.sm; // Space between items
const Item_total_width = Item_width + Item_spacing * 2; // Total width including margins
const carouselImageHeight = availableHeight * (isTablet ? 0.6 : 0.65); // Slightly smaller on tablets
// Calculate empty item size to center the first item
// The first real item (index 1) should be centered
// emptyItem + leftMargin + itemWidth/2 = screenWidth/2
// So: emptyItem = (screenWidth - itemWidth)/2 - leftMargin
// But we need to account for the fact that the item has marginHorizontal
const EMPTY_ITEM_SIZE = (width - Item_width) / 2 - Item_spacing;

const Home = ({navigation, route}: any) => {
  const [cantos, setCantos] = useState<Canto[]>([]);
  const [scrollX, setscrollX] = useState(new Animated.Value(0));
  const [data, setData] = useState<({key: string} | Canto)[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const [lastReadVerse, setLastReadVerse] = useState<{
    cantoId: number | null;
    chapterId: number | null;
    verseNumber: number | null;
  }>({
    cantoId: null,
    chapterId: null,
    verseNumber: null,
  });
  const [lastReadCantoTitle, setLastReadCantoTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [canto, setCanto] = useState('');
  const [chapter, setChapter] = useState('');
  const [verse, setVerse] = useState('');
  const searchBottomSheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    initializeInterstitialAd();
    fadeIn(fadeAnim, 300).start();
    scaleIn(scaleAnim, 300).start();
  }, []);

  // Open search modal when Search tab is pressed
  useEffect(() => {
    if (route?.params?.openSearch) {
      setTimeout(() => {
        searchBottomSheetRef.current?.present();
        navigation.setParams({openSearch: false});
      }, 100);
    }
  }, [route?.params?.openSearch, navigation]);

  useEffect(() => {
    fetchData().then((fetchedData: Canto[]) => {
      setData([{key: 'dummy-start'}, ...fetchedData, {key: 'dummy-end'}]);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('lastReadVerse').then(lastReadVerseString => {
        if (lastReadVerseString) {
          const lastReadVerseData = JSON.parse(lastReadVerseString);
          setLastReadVerse(lastReadVerseData);

          db.transaction(tx => {
            tx.executeSql(
              'SELECT cantotitle FROM Cantos WHERE id = ?',
              [lastReadVerseData.cantoId],
              (_, {rows}) => {
                if (rows.length > 0) {
                  setLastReadCantoTitle(rows.item(0).cantotitle);
                }
              },
              error => {
                console.log('Error fetching cantotitle: ', error);
              },
            );
          });
        }
      });
    }, []),
  );

  const imageSource1 =
    lastReadVerse.cantoId !== null && lastReadVerse.cantoId > 0
      ? images[lastReadVerse.cantoId - 1]
      : defaultImage;

  const fetchData = () => {
    return new Promise<Canto[]>((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM Cantos',
          [],
          (_, {rows}) => {
            const temp = [];
            for (let i = 0; i < rows.length; i++) {
              temp.push(rows.item(i));
            }
            resolve(temp);
          },
          error => {
            console.log('Error fetching cantos: ', error);
            reject(error);
          },
        );
      });
    });
  };

  const navigateToLastReadVerse = async () => {
    if (
      lastReadVerse.cantoId &&
      lastReadVerse.chapterId &&
      lastReadVerse.verseNumber
    ) {
      await checkAndShowAd();
      navigation.navigate('Verse', {
        cantoId: lastReadVerse.cantoId,
        chapterNumber: lastReadVerse.chapterId,
        verseNumber: lastReadVerse.verseNumber,
      });
    } else {
      Alert.alert('No last read verse found.');
    }
  };

  const navigateToChapterScreen = async (cantoId: number) => {
    await checkAndShowAd();
    navigation.navigate('Chapter', {cantoId});
  };

  const handleSearch = () => {
    if (!canto || !chapter || !verse) {
      Alert.alert('Please fill all fields');
      return;
    }

    const cantoId = parseInt(canto, 10);
    const chapterNumber = parseInt(chapter, 10);
    const verseNumber = parseInt(verse, 10);

    if (isNaN(cantoId) || isNaN(chapterNumber) || isNaN(verseNumber)) {
      Alert.alert('Please enter valid numbers');
      return;
    }

    db.transaction(tx => {
      tx.executeSql(
        'SELECT id FROM Chapters WHERE chapterNumber = ? AND cantoId = ?',
        [chapterNumber, cantoId],
        (_, {rows}) => {
          if (rows.length > 0) {
            const chapterId = rows.item(0).id;
            searchBottomSheetRef.current?.dismiss();
            navigation.navigate('Verse', {
              chapterId: chapterId,
              cantoId: cantoId,
              chapterNumber: chapterNumber,
              verseNumber: verseNumber,
            });
            // Clear fields after navigation
            setCanto('');
            setChapter('');
            setVerse('');
          } else {
            Alert.alert('Chapter not found');
          }
        },
        error => {
          console.log('Error searching:', error);
          Alert.alert('Error searching for chapter');
        },
      );
    });
  };

  const renderCarouselItem = ({item, index}: {item: any; index: number}) => {
    if (index === 0 || index === data.length - 1) {
      return <View style={{width: EMPTY_ITEM_SIZE}} />;
    }

    const inputRange = [
      (index - 2) * Item_total_width,
      (index - 1) * Item_total_width,
      index * Item_total_width,
    ];
    const translateY = scrollX.interpolate({
      inputRange,
      outputRange: [-5, -20, -5],
      extrapolate: 'clamp',
    });
    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.6, 1, 0.6],
      extrapolate: 'clamp',
    });

    const scaleY = scrollX.interpolate({
      inputRange,
      outputRange: [0.85, 1, 0.85],
      extrapolate: 'clamp',
    });

    const imageSource = images[index - 1];

    return (
      <TouchableOpacity
        onPress={() => navigateToChapterScreen(item.id)}
        activeOpacity={0.9}>
        <Animated.View
          style={{
            transform: [{translateY}, {scaleY}],
            opacity: opacity,
            marginTop: rV(10),
            alignItems: 'center',
            justifyContent: 'center',
            width: Item_width,
            marginHorizontal: Item_spacing, // Add space between images
          }}>
          <View style={styles.carouselCard}>
            <Image source={imageSource} style={styles.carouselItemImage} />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.2)']}
              style={styles.gradient}
            />
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <BottomSheetModalProvider>
        <SafeAreaProvider>
          <SafeAreaView
            style={{flex: 1, backgroundColor: Colors.background}}
            edges={['top']}>
            <View style={styles.container}>
              <StatusBar
                barStyle="dark-content"
                backgroundColor={Colors.background}
                translucent={false}
              />
              <Animated.View
                style={[
                  styles.header,
                  {opacity: fadeAnim, transform: [{scale: scaleAnim}]},
                ]}>
                <View style={styles.logoContainer}>
                  <Logo />
                </View>
                <TouchableOpacity
                  style={styles.searchButton}
                  onPress={() => searchBottomSheetRef.current?.present()}
                  activeOpacity={0.7}>
                  <Feather
                    name="search"
                    size={rMS(20)}
                    color={Colors.primary}
                  />
                </TouchableOpacity>
              </Animated.View>

              <View style={styles.contentContainer}>
                <View style={styles.carouselContainer}>
                  <Animated.FlatList
                    data={data}
                    renderItem={renderCarouselItem}
                    keyExtractor={(item, index) => index.toString()}
                    horizontal
                    contentContainerStyle={styles.carouselContent}
                    showsHorizontalScrollIndicator={false}
                    snapToInterval={Item_total_width}
                    decelerationRate={0.98}
                    snapToAlignment="start"
                    scrollEventThrottle={16}
                    pagingEnabled
                    onScroll={Animated.event(
                      [{nativeEvent: {contentOffset: {x: scrollX}}}],
                      {useNativeDriver: true},
                    )}
                  />
                </View>

                {lastReadVerse.cantoId &&
                  lastReadVerse.chapterId &&
                  lastReadVerse.verseNumber && (
                    <View style={styles.continueSection}>
                      <Text style={styles.continueHeader}>
                        Continue Reading
                      </Text>
                      <View style={styles.continueCardWrapper}>
                        <ContinueReadingCard
                          cantoId={lastReadVerse.cantoId}
                          cantoTitle={lastReadCantoTitle}
                          chapterId={lastReadVerse.chapterId}
                          verseNumber={lastReadVerse.verseNumber}
                          coverImage={imageSource1}
                          onPress={navigateToLastReadVerse}
                        />
                      </View>
                    </View>
                  )}
              </View>
            </View>
          </SafeAreaView>
        </SafeAreaProvider>

        <BottomSheetModal
          ref={searchBottomSheetRef}
          index={0}
          snapPoints={['60%', '80%']}
          handleComponent={() => <View style={styles.handle} />}
          backgroundStyle={{backgroundColor: Colors.card}}>
          <View style={styles.modalView}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderText}>Canto</Text>
              <Text style={styles.modalHeaderText}>Chapter</Text>
              <Text style={styles.modalHeaderText}>Verse</Text>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                onChangeText={setCanto}
                value={canto}
                keyboardType="numeric"
                placeholderTextColor={Colors.textLight}
                placeholder="1"
              />
              <TextInput
                style={styles.input}
                onChangeText={setChapter}
                value={chapter}
                keyboardType="numeric"
                placeholderTextColor={Colors.textLight}
                placeholder="1"
              />
              <TextInput
                style={styles.input}
                onChangeText={setVerse}
                value={verse}
                keyboardType="numeric"
                placeholderTextColor={Colors.textLight}
                placeholder="1"
              />
            </View>
            <TouchableOpacity
              onPress={handleSearch}
              style={styles.searchButtonModal}
              activeOpacity={0.8}>
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>
        </BottomSheetModal>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Space.md,
    paddingTop: Space.lg,
    paddingBottom: Space.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    marginBottom: Space.md,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  searchButton: {
    padding: Space.sm,
    borderRadius: 20,
    backgroundColor: Colors.card,
    shadowColor: Colors.cardShadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  carouselContainer: {
    height: carouselImageHeight + Space.lg, // Full height with some margin
    justifyContent: 'center',
    marginTop: Space.sm,
    marginBottom: Space.sm,
  },
  carouselContent: {
    alignItems: 'center',
    paddingVertical: Space.sm,
    paddingLeft: 0,
    paddingRight: 0,
  },
  carouselCard: {
    borderRadius: 28, // Slightly larger to accommodate border
    borderWidth: 5,
    borderColor: '#FFFFFF', // White border
    shadowColor: Colors.cardShadow,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF', // White background
    padding: 0, // No padding, border will show
  },
  carouselItemImage: {
    width: Item_width,
    height: carouselImageHeight,
    resizeMode: 'cover',
    borderRadius: 24, // Match inner radius
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
    borderRadius: 24,
  },
  continueSection: {
    paddingHorizontal: Space.md,
    paddingBottom:
      width > 600 || (Platform.OS === 'android' && width > 500)
        ? 120
        : Platform.OS === 'ios'
        ? height > 800
          ? 120
          : 100
        : height > 800
        ? 110
        : 100, // Ensure it's above bottom tab, responsive for tablets
    marginTop: Space.sm,
  },
  continueHeader: {
    fontSize: rMS(18),
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Space.sm,
    paddingHorizontal: Space.xs,
  },
  continueCardWrapper: {
    paddingHorizontal: 0,
  },
  modalView: {
    margin: Space.md,
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: Space.lg,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: Space.lg,
  },
  modalHeaderText: {
    color: Colors.textPrimary,
    fontSize: rMS(16),
    fontWeight: '600',
  },
  inputContainer: {
    width: '100%',
    marginBottom: Space.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Space.sm,
  },
  input: {
    height: rV(52),
    borderColor: Colors.cardBorder,
    borderWidth: 1.5,
    paddingLeft: Space.md,
    width: '30%',
    borderRadius: 12,
    fontSize: rMS(15),
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },
  searchButtonModal: {
    backgroundColor: Colors.primary,
    paddingVertical: Space.md,
    paddingHorizontal: Space.xl,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Space.sm,
    shadowColor: Colors.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
  },
  searchButtonText: {
    color: Colors.textOnDark,
    fontSize: rMS(16),
    fontWeight: '600',
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
