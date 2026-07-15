import WordExtractor from 'word-extractor';

const extractor = new WordExtractor();
const extracted = extractor.extract("D:/Bilkent/BilkentApp/BilkentApp/Prefac/FALL SEMESTER/WORDLIST SETS & PRACTICE MATERIALS/PFC LEVEL WORDLIST SETS (Updated September 2024)/PFC Fall Semester Wordlist- Set 1.doc");

extracted.then(function(doc) {
  console.log(doc.getBody().substring(0, 500));
}).catch(console.error);
