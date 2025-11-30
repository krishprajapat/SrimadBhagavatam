import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import {BottomSheetModal, BottomSheetModalProvider} from '@gorhom/bottom-sheet';
import SQLite from 'react-native-sqlite-storage';
import {rS, rMS, rV} from '../Components/responsive';
import {Colors} from '../constants/colors';
import {Space} from '../constants/spacing';
import {useNavigation} from '@react-navigation/native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaView} from 'react-native-safe-area-context';
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

const Search = () => {
  const navigation = useNavigation();
  const [canto, setCanto] = useState('');
  const [chapter, setChapter] = useState('');
  const [verse, setVerse] = useState('');

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
            (navigation as any).navigate('Verse', {
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

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <BottomSheetModalProvider>
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.header}>
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
            <Text style={styles.headerTitle}>Search</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            <View style={styles.searchContainer}>
              <Text style={styles.title}>Find Verse</Text>
              <Text style={styles.subtitle}>
                Enter Canto, Chapter, and Verse numbers
              </Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Canto</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Canto Number"
                  placeholderTextColor={Colors.textLight}
                  value={canto}
                  onChangeText={setCanto}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Chapter</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Chapter Number"
                  placeholderTextColor={Colors.textLight}
                  value={chapter}
                  onChangeText={setChapter}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Verse</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Verse Number"
                  placeholderTextColor={Colors.textLight}
                  value={verse}
                  onChangeText={setVerse}
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity
                onPress={handleSearch}
                style={styles.searchButton}
                activeOpacity={0.8}>
                <Feather
                  name="search"
                  size={rMS(20)}
                  color={Colors.textOnDark}
                />
                <Text style={styles.searchButtonText}>Search</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Space.md,
    paddingTop: Space.md,
    paddingBottom: Space.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  backButton: {
    padding: Space.sm,
  },
  headerTitle: {
    fontSize: rMS(20),
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Space.lg,
  },
  searchContainer: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: Space.xl,
    shadowColor: Colors.cardShadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: rMS(24),
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Space.xs,
  },
  subtitle: {
    fontSize: rMS(14),
    color: Colors.textLight,
    marginBottom: Space.xl,
  },
  inputContainer: {
    marginBottom: Space.lg,
  },
  label: {
    fontSize: rMS(14),
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Space.sm,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: Space.md,
    paddingVertical: Space.md,
    fontSize: rMS(16),
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  searchButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Space.md,
    paddingHorizontal: Space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Space.md,
    shadowColor: Colors.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  searchButtonText: {
    color: Colors.textOnDark,
    fontSize: rMS(16),
    fontWeight: '600',
    marginLeft: Space.sm,
  },
});

export default Search;
