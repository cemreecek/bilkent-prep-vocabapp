const fs = require('fs');
[4, 5, 6, 7, 8].forEach(set => {
  const data = require(`./public/data/flashcards/prefac-set-${set}.json`);
  console.log(`PreFac Set ${set} Days:`, [...new Set(data.map(x => x.day))].sort());
});
