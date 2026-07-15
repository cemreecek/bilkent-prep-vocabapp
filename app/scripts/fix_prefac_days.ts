import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Fixing PreFac Days...');
  const list = await prisma.vocabList.findFirst({
    where: { level: 'PreFac', unit: 'Fall Semester' }
  });

  if (!list) {
    console.log('List not found');
    return;
  }

  const fixes = [
    { set: 4, sourceDay: 2, newDay: 3, split: true },
    { set: 5, sourceDay: 2, newDay: 3, split: true },
    { set: 5, sourceDay: 4, newDay: 5, split: true },
    { set: 6, sourceDay: 2, newDay: 3, split: true },
    { set: 6, sourceDay: 4, newDay: 5, split: true },
    { set: 7, sourceDay: 4, newDay: 5, split: false }, // Shift Day 4 to Day 5
    { set: 7, sourceDay: 3, newDay: 4, split: true },  // Split Day 3 -> Day 4
    { set: 8, sourceDay: 2, newDay: 3, split: true }
  ];

  for (const fix of fixes) {
    const words = await prisma.vocabWord.findMany({
      where: { listId: list.id, week: fix.set, day: fix.sourceDay },
      orderBy: { id: 'asc' } // Original insertion order preserves doc order
    });

    if (fix.split) {
      if (words.length > 25) {
        // Find exactly where the next day starts.
        // Usually it's around half, let's just do Math.ceil(words.length / 2) 
        // Wait! In Set 4, length was 34. 17 and 17. 
        // Set 5 Day 2: 31. 16 and 15?
        const half = Math.ceil(words.length / 2);
        const toMove = words.slice(half);
        for (const w of toMove) {
          await prisma.vocabWord.update({ where: { id: w.id }, data: { day: fix.newDay }});
        }
        console.log(`Set ${fix.set}: Split Day ${fix.sourceDay}, moved ${toMove.length} words to Day ${fix.newDay}`);
      }
    } else {
      // Move all
      if (words.length > 0) {
        for (const w of words) {
          await prisma.vocabWord.update({ where: { id: w.id }, data: { day: fix.newDay }});
        }
        console.log(`Set ${fix.set}: Moved all ${words.length} words from Day ${fix.sourceDay} to Day ${fix.newDay}`);
      }
    }
  }

  // Update JSONs too
  for (let s = 4; s <= 8; s++) {
    const jsonPath = path.join(process.cwd(), 'public', 'data', 'flashcards', `prefac-set-${s}.json`);
    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      
      const dbWords = await prisma.vocabWord.findMany({
        where: { listId: list.id, week: s }
      });
      
      // Update the day in the JSON from the DB
      for (const item of data) {
        const dbWord = dbWords.find(w => w.word.toLowerCase() === item.word.toLowerCase());
        if (dbWord) {
          item.day = dbWord.day;
        }
      }
      fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
      console.log(`Updated JSON for Set ${s}`);
    }
  }
}

main().then(() => prisma.$disconnect()).catch(console.error);
