const WordExtractor = require('word-extractor');
const fs = require('fs');
const extractor = new WordExtractor();
extractor.extract('D:/Bilkent/BilkentApp/BilkentApp/Prefac/FALL SEMESTER/WORDLIST SETS & PRACTICE MATERIALS/PFC LEVEL WORDLIST SETS (Updated September 2024)/PFC Fall Semester Wordlist- Set 4.doc')
  .then(doc => fs.writeFileSync('dump_set4.txt', doc.getBody()))
  .catch(console.error);
