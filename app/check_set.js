const d = require('./public/data/flashcards/prefac-set-4.json');
console.log('Set 4 Day 2 length:', d.filter(x=>x.day===2).length);
console.log('Set 4 Day 2 Words:', d.filter(x=>x.day===2).map(x=>x.word).join(', '));
