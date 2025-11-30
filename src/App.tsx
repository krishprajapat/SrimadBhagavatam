import {StyleSheet, Text, View} from 'react-native';
import React, {useEffect, version} from 'react';
import {initDatabase, insertCanto} from './Database/Database';
import Home from './Screens/Home';
// import verses from './Database/verses.json';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {NavigationContainer} from '@react-navigation/native';
import Chapter from './Screens/Chapter';
import Verse from './Screens/Verse';
import Tab from './Components/Tab';
import Bookmark from './Screens/Bookmark';
// @ts-ignore
import VersionCheck from 'react-native-version-check';
import {Alert, Linking} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import analytics from '@react-native-firebase/analytics';
import DeviceInfo from 'react-native-device-info';

interface Canto {
  cantoNumber: number;
  cantotitle: string;
  chapters: {
    chapterNumber: number;
    verses: {
      verseNumber: number;
      text: string[];
      synonyms: string;
      translation: string;
      purport: string[];
    }[];
  }[];
}

const importedVerses: Canto[] = require('./Database/verses.json');

const stack = createNativeStackNavigator();

const App = () => {
  useEffect(() => {
    //   initDatabase();
    //  importedVerses.forEach((canto:Canto) => {
    //     insertCanto(canto);
    //   });
    const checkForUpdates = async () => {
      try {
        // Hardcode for Play Store and your package name
        const packageName = 'com.srimad02'; // Replace with your actual Play Store package name if different
        console.log('Package Name:', packageName);

        const latestVersion = await VersionCheck.getLatestVersion({
          provider: 'playStore',
          packageName,
          fetchDate: true,
        });
        console.log('Latest Version:', latestVersion);

        const currentVersion = await VersionCheck.getCurrentVersion();
        console.log('Current Version:', currentVersion);

        const updateNeeded = VersionCheck.needUpdate({
          currentVersion,
          latestVersion,
        });

        if (updateNeeded.isNeeded) {
          Alert.alert(
            'Update Available',
            'A new version of the app is available. Please update to continue using all features.',
            [
              {
                text: 'Update Now',
                onPress: () => {
                  const storeUrl =
                    'https://play.google.com/store/apps/details?id=' +
                    packageName;
                  Linking.openURL(storeUrl);
                },
              },
              {
                text: 'Later',
                style: 'cancel',
                onPress: () => {
                  // Store the last check time to avoid frequent prompts
                  AsyncStorage.setItem(
                    'lastUpdateCheck',
                    new Date().toISOString(),
                  );
                },
              },
            ],
            {cancelable: false},
          );
        }
      } catch (error) {
        console.error('Version check failed:', error);
      }
    };

    // Check if we should show the update prompt
    AsyncStorage.getItem('lastUpdateCheck').then(lastCheck => {
      if (
        !lastCheck ||
        new Date().getTime() - new Date(lastCheck).getTime() >
          24 * 60 * 60 * 1000
      ) {
        checkForUpdates();
      }
    });
  }, []);

  React.useEffect(() => {
    // Track app open and version
    const trackAppVersion = async () => {
      const version = DeviceInfo.getVersion();
      await analytics().logAppOpen();
      await analytics().logEvent('app_open_with_version', {version});
    };
    trackAppVersion();
  }, []);

  return (
    <NavigationContainer>
      <stack.Navigator>
        <stack.Screen
          name="Tab"
          component={Tab}
          options={{headerShown: false, animation: 'default'}}
        />
        <stack.Screen
          name="Chapter"
          component={Chapter}
          options={{animation: 'fade', headerShown: false}}
        />
        <stack.Screen
          name="Verse"
          component={Verse}
          options={{headerShown: false}}
        />
        <stack.Screen name="Bookmark" component={Bookmark} />
        <stack.Screen name="Home" component={Home} />
      </stack.Navigator>
    </NavigationContainer>
  );
};

export default App;

const styles = StyleSheet.create({});
