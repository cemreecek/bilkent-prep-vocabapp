const fs = require('fs');
const path = require('path');

function clean(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const f of files) {
    if (!f.endsWith('.json')) continue;
    const p = path.join(dir, f);
    const text = fs.readFileSync(p, 'utf8').trim();
    if (text === '[]') {
      console.log('Deleting empty file: ' + p);
      fs.unlinkSync(p);
    }
  }
}

clean(path.join(__dirname, '../public/data/practices'));
clean(path.join(__dirname, '../public/data/flashcards'));
