const fs = require('fs');
const d = JSON.parse(fs.readFileSync('d:/Bilkent/BilkentApp/BilkentApp/app/public/data/flashcards/upper-set-8.json', 'utf8'));
const days = {};
d.forEach(w => {
  days[w.day] = (days[w.day] || 0) + 1;
});
console.log(days);
