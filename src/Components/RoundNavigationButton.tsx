import { rS,rMS,rV } from '../Components/responsive';
import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const RoundNavigationButton = ({ onPress, iconName, style }:any) => {
 return (
    <TouchableOpacity onPress={onPress} style={[styles.roundButton, style]}>
      <MaterialIcons name={iconName} size={rMS(30)} color="#000" />
    </TouchableOpacity>
 );
};

const styles = StyleSheet.create({
 roundButton: {
    width: rS(50),
    height: rV(50),
    borderRadius: rS(30),
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
 },
});

export default RoundNavigationButton;
