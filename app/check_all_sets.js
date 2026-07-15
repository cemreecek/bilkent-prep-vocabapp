const sets = [4, 5, 6, 7, 8];
sets.forEach(s => {
  const d = require(`./public/data/flashcards/prefac-set-${s}.json`);
  console.log(`Set ${s}:`);
  [1, 2, 3, 4, 5].forEach(day => {
     console.log(`  Day ${day}:`, d.filter(x=>x.day===day).length);
  });
});
