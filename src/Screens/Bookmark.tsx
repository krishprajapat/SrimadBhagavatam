import React, {useCallback, useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import SQLite from 'react-native-sqlite-storage';
import {useFocusEffect} from '@react-navigation/native';
import {rMS, rS, rV} from '../Components/responsive';
import {Colors} from '../constants/colors';
import {Space} from '../constants/spacing';
import {fadeIn} from '../constants/animations';
import Card from '../Components/Card';
import Feather from 'react-native-vector-icons/Feather';
import {SafeAreaView} from 'react-native-safe-area-context';
import Logo from '../Components/Logo';
import ConfirmDialog from '../Components/ConfirmDialog';

const {height} = Dimensions.get('window');

interface BookmarkItem {
  id: number;
  verseId: number;
  chapterId: number;
  cantoId: number;
  chapterNumber: number;
  verseNumber: number;
  text: string;
}

export const db1 = SQLite.openDatabase(
  {name: 'Book1.db', location: 'default'},
  () => {
    console.log('Database opened successfully');
  },
  error => {
    console.log('Error opening database: ', error);
  },
);

const getSafeAreaPadding = () => {
  if (Platform.OS === 'ios') {
    return height > 800 ? 44 : 20; // iPhone X/11/12/13/14/15 series have larger safe area
  } else {
    // Android devices, including tablets
    return StatusBar.currentHeight || 24; // Default to 24 if not available
  }
};

// Separate component for bookmark item to fix hook issue
const BookmarkItemComponent: React.FC<{
  item: BookmarkItem;
  index: number;
  onPress: (item: BookmarkItem) => void;
  onDelete: (id: number) => void;
}> = ({item, index, onPress, onDelete}) => {
  const itemAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeIn(itemAnim, 300, index * 50).start();
  }, [itemAnim, index]);

  return (
    <Animated.View
      style={{
        opacity: itemAnim,
        transform: [
          {
            scale: itemAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.95, 1],
            }),
          },
        ],
      }}>
      <Card
        onPress={() => onPress(item)}
        padding={Space.md}
        marginBottom={Space.sm}>
        <View style={styles.bookmarkContent}>
          <View style={styles.textContainer}>
            <Text style={styles.bookmarkVerseRef}>
              Canto {item.cantoId} • Chapter {item.chapterNumber} • Verse{' '}
              {item.verseNumber}
            </Text>
            <Text
              style={styles.bookmarkText}
              numberOfLines={2}
              ellipsizeMode="tail">
              {item.text}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => onDelete(item.id)}
            style={styles.deleteIconContainer}
            activeOpacity={0.7}>
            <Feather name="trash-2" size={rMS(20)} color={Colors.textLight} />
          </TouchableOpacity>
        </View>
      </Card>
    </Animated.View>
  );
};

const Bookmark = ({navigation}: any) => {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [bookmarkToDelete, setBookmarkToDelete] = useState<number | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      fetchBookmarks();
      fadeIn(fadeAnim, 300).start();
    }, []),
  );

  const fetchBookmarks = () => {
    db1.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM Bookmarks',
        [],
        (_, results) => {
          const tempBookmarks: BookmarkItem[] = [];
          for (let i = 0; i < results.rows.length; i++) {
            tempBookmarks.push(results.rows.item(i));
          }
          setBookmarks(tempBookmarks);
        },
        error => console.log('Error fetching bookmarks: ', error),
      );
    });
  };

  const handleDelete = (id: number) => {
    setBookmarkToDelete(id);
    setDeleteDialogVisible(true);
  };

  const confirmDelete = () => {
    if (bookmarkToDelete !== null) {
      db1.transaction(tx => {
        tx.executeSql(
          'DELETE FROM Bookmarks WHERE id = ?',
          [bookmarkToDelete],
          () => {
            console.log('Bookmark deleted');
            fetchBookmarks(); // Refresh the list
            setDeleteDialogVisible(false);
            setBookmarkToDelete(null);
          },
          error => console.log('Error deleting bookmark: ', error),
        );
      });
    }
  };

  const cancelDelete = () => {
    setDeleteDialogVisible(false);
    setBookmarkToDelete(null);
  };

  const handleGoToVerse = (item: BookmarkItem) => {
    navigation.navigate('Verse', {
      cantoId: item.cantoId,
      chapterId: item.chapterId,
      chapterNumber: item.chapterNumber,
      verseNumber: item.verseNumber,
    });
  };

  const renderItem = ({item, index}: {item: BookmarkItem; index: number}) => (
    <BookmarkItemComponent
      item={item}
      index={index}
      onPress={handleGoToVerse}
      onDelete={handleDelete}
    />
  );

  return (
    <SafeAreaView
      style={[styles.container, {paddingTop: getSafeAreaPadding()}]}
      edges={['top']}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.background}
        translucent={false}
      />
      <Animated.View style={[styles.header, {opacity: fadeAnim}]}>
        <Logo />
      </Animated.View>
      <FlatList
        data={bookmarks}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="bookmark" size={rMS(48)} color={Colors.textLight} />
            <Text style={styles.emptyText}>No bookmarks yet.</Text>
          </View>
        }
      />
      <ConfirmDialog
        visible={deleteDialogVisible}
        title="Delete Bookmark"
        message="Are you sure you want to delete this bookmark? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        confirmColor="#FF6B6B"
      />
    </SafeAreaView>
  );
};

export default Bookmark;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Space.md,
    paddingTop: Space.md,
    paddingBottom: Space.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    marginBottom: Space.md,
  },
  listContent: {
    paddingHorizontal: Space.md,
    paddingBottom: Space.xxxl,
  },
  bookmarkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    marginRight: Space.md,
  },
  bookmarkVerseRef: {
    fontSize: rMS(14),
    fontWeight: '600',
    color: '#B8860B', // Intense golden color to match logo
    marginBottom: rV(4),
  },
  bookmarkText: {
    fontSize: rMS(13),
    color: Colors.textSecondary,
    lineHeight: rMS(18),
  },
  deleteIconContainer: {
    padding: Space.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Space.xl,
    marginTop: Space.xxxl,
  },
  emptyText: {
    fontSize: rMS(18),
    fontWeight: '500',
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: Space.md,
  },
});
