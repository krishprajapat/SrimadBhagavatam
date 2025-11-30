import SQLite from 'react-native-sqlite-storage';

interface Verse {
  verseNumber: number;
  text: string[];
  synonyms: string;
  translation: string;
  purport: string[];
}

interface Chapter {
  chapterNumber: number;
  verses: Verse[];
}

interface Canto {
  cantoNumber: number;
  cantotitle: string;
  chapters: Chapter[];
}

interface Data {
  cantoNumber: number;
  chapters: Chapter[];
}

const db = SQLite.openDatabase(
  {
    name: 'SrimadBhagavatam2.db',
    location: 'default',
  },
  () => console.log('Database opened'),
  error => console.log('SQLite error: ', error),
);

export const initDatabase = () => {
  db.transaction(tx => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS Cantos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cantoNumber INTEGER,
        cantotitle TEXT
      );`,
      [],
      () => console.log('Cantos table created'),
      error => console.log('SQLite error: ', error),
    );

    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS Chapters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cantoId INTEGER,
        chapterNumber INTEGER,
        chapterName TEXT,
        FOREIGN KEY(cantoId) REFERENCES Cantos(id)
      );`,
      [],
      () => console.log('Chapters table created'),
      error => console.log('SQLite error: ', error),
    );

    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS Verses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chapterId INTEGER,
        verseNumber INTEGER,
        text TEXT,
        synonyms TEXT,
        translation TEXT,
        purport TEXT,
        FOREIGN KEY(chapterId) REFERENCES Chapters(id)
      );`,
      [],
      () => console.log('Verses table created'),
      error => console.log('SQLite error: ', error),
    );
  });
};

export const insertCanto = (canto: Canto) => {
  db.transaction(tx => {
    tx.executeSql(
      'SELECT * FROM Cantos WHERE cantoNumber = ?',
      [canto.cantoNumber],
      (tx, results) => {
        if (results.rows.length === 0) {
          tx.executeSql(
            'INSERT INTO Cantos (cantoNumber, cantotitle) VALUES (?, ?)',
            [canto.cantoNumber, canto.cantotitle],
            (tx, results) => {
              const cantoId = results.insertId;
              canto.chapters.forEach(chapter => {
                tx.executeSql(
                  'SELECT * FROM Chapters WHERE cantoId = ? AND chapterNumber = ?',
                  [cantoId, chapter.chapterNumber],
                  (tx, results) => {
                    if (results.rows.length === 0) {
                      tx.executeSql(
                        'INSERT INTO Chapters (cantoId, chapterNumber) VALUES (?, ?)',
                        [cantoId, chapter.chapterNumber],
                        (tx, results) => {
                          const chapterId = results.insertId;
                          chapter.verses.forEach(verse => {
                            tx.executeSql(
                              'SELECT * FROM Verses WHERE chapterId = ? AND verseNumber = ?',
                              [chapterId, verse.verseNumber],
                              (tx, results) => {
                                if (results.rows.length === 0) {
                                  tx.executeSql(
                                    'INSERT INTO Verses (chapterId, verseNumber, text, synonyms, translation, purport) VALUES (?, ?, ?, ?, ?, ?)',
                                    [
                                      chapterId,
                                      verse.verseNumber,
                                      verse.text.join('\n'),
                                      verse.synonyms,
                                      verse.translation,
                                      verse.purport.join('\n'),
                                    ],
                                    () => console.log('Verse inserted'),

                                    error =>
                                      console.log('SQLite error: ', error),
                                  );
                                }
                              },
                              error => console.log('SQLite error: ', error),
                            );
                          });
                        },
                        error => console.log('SQLite error: ', error),
                      );
                    }
                  },
                  error => console.log('SQLite error: ', error),
                );
              });
            },
            error => console.log('SQLite error: ', error),
          );
        }
      },
      error => console.log('SQLite error: ', error),
    );
  });
};
