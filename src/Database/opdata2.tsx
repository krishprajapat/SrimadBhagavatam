import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import SQLite from 'react-native-sqlite-storage';

    export const db1 = SQLite.openDatabase(
        {
          name: 'Book.db',
          location: 'default',
        },
        () => {},
        error => { console.log(error.message); },
      );
   
   

export default db1

const styles = StyleSheet.create({})