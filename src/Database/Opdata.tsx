import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import SQLite from 'react-native-sqlite-storage';

export const db = SQLite.openDatabase(
  {
    name: 'SrimadBhagavatam2.db',
    location: 'default',
  },
  () => {},
  error => {
    console.log(error.message);
  },
);

export default db;

const styles = StyleSheet.create({});
