const fs = require('fs');
const d = JSON.parse(fs.readFileSync('d:/Bilkent/BilkentApp/BilkentApp/app/public/data/flashcards/upper-set-8.json', 'utf8'));
d.forEach((w, i) => console.log(`${i}: ${w.word} (Day ${w.day})`));
