import {
  Dimensions,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  Platform,
  Animated,
} from 'react-native';
import React, {useEffect, useRef} from 'react';
import Home from '../Screens/Home';
import Note from '../Screens/Note';
import Bookmark from '../Screens/Bookmark';
import Search from '../Screens/Search';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Feather from 'react-native-vector-icons/Feather';
import {rS, rV, rMS} from './responsive';
import {Colors} from '../constants/colors';
import {fadeIn} from '../constants/animations';
import {Space} from '../constants/spacing';
import CustomTabBar from './CustomTabBar';

const Bottamtab = createBottomTabNavigator();
const {height, width} = Dimensions.get('window');

const Tab = () => {
  const {width, height} = useWindowDimensions();

  return (
    <Bottamtab.Navigator
      screenOptions={{
        tabBarHideOnKeyboard: true,
        headerShown: false,
        tabBarShowLabel: false,
      }}
      tabBar={props => <CustomTabBar {...props} />}>
      <Bottamtab.Screen
        name="Home"
        component={Home}
        options={{
          tabBarShowLabel: false,
        }}
      />

      <Bottamtab.Screen
        name="Bookmarks"
        component={Bookmark}
        options={{
          tabBarShowLabel: false,
        }}
      />
      <Bottamtab.Screen
        name="Notes"
        component={Note}
        options={{
          tabBarShowLabel: false,
        }}
      />
    </Bottamtab.Navigator>
  );
};
export default Tab;
