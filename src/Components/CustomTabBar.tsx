import React from 'react';
import {View, StyleSheet, Platform, TouchableOpacity} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Colors} from '../constants/colors';
import {Space} from '../constants/spacing';
import {rMS} from './responsive';
import Feather from 'react-native-vector-icons/Feather';

interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

const CustomTabBar: React.FC<CustomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bottomTabBar,
        {
          paddingBottom:
            Platform.OS === 'ios' ? Math.max(insets.bottom, 20) : Space.md,
        },
      ]}>
      <View style={styles.bottomTabBarInner}>
        {state.routes.map((route: any, index: number) => {
          const {options} = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const iconName =
            route.name === 'Home'
              ? 'home'
              : route.name === 'Bookmarks'
              ? 'bookmark'
              : route.name === 'Notes'
              ? 'book-open'
              : 'circle';

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? {selected: true} : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              style={styles.tabButton}
              activeOpacity={0.6}>
              <View
                style={[
                  styles.tabIconWrapper,
                  isFocused && styles.tabIconWrapperActive,
                ]}>
                <Feather
                  name={iconName}
                  size={rMS(22)}
                  color={isFocused ? '#B8860B' : Colors.textLight}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: Space.sm,
    backgroundColor: 'transparent',
  },
  bottomTabBarInner: {
    backgroundColor: Colors.card,
    marginHorizontal: Space.sm,
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: Space.sm,
    paddingHorizontal: Space.sm,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    shadowColor: Colors.cardShadow,
    shadowOffset: {width: 0, height: -6},
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 20,
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
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIconWrapperActive: {
    backgroundColor: '#E8D5B7', // Light gold background
    shadowColor: '#B8860B', // Intense golden shadow
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});

export default CustomTabBar;
