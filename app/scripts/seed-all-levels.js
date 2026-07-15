const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const levelMapping = {
  'Elementary': 'Elementary',
  'Intermediate': 'Intermediate',
  'Pre-faculty': 'Prefac',
  'Upper Intermediate': 'Upper'
};

async function main() {
  const levelsFilePath = path.join(__dirname, '../src/data/levels/levels.json');
  if (!fs.existsSync(levelsFilePath)) {
    console.error('Levels metadata file not found at', levelsFilePath);
    process.exit(1);
  }

  const levelsMeta = JSON.parse(fs.readFileSync(levelsFilePath, 'utf8'));
  let totalWordsIngested = 0;

  for (const listMeta of levelsMeta) {
    const listFilePath = path.join(__dirname, '../src/data', listMeta.file);
    if (!fs.existsSync(listFilePath)) {
      console.warn(`File missing for list ${listMeta.id}`);
      continue;
    }

    const listData = JSON.parse(fs.readFileSync(listFilePath, 'utf8'));
    const prismaLevel = levelMapping[listData.level];

    if (!prismaLevel) {
      console.warn(`Unmapped level string: ${listData.level}. Skipping ${listData.id}`);
      continue;
    }

    // Upsert the VocabList
    console.log(`Ingesting list: ${listData.id} (${prismaLevel}) - ${listData.words.length} words`);
    
    const vocabList = await prisma.vocabList.upsert({
      where: { id: listData.id },
      update: {
        level: prismaLevel,
        unit: listData.unit
      },
      create: {
        id: listData.id,
        level: prismaLevel,
        unit: listData.unit
      }
    });

    // Delete existing words for this list to avoid duplicates if re-run
    await prisma.vocabWord.deleteMany({
      where: { listId: vocabList.id }
    });

    // We can chunk the inserts if they are too large, but <1000 is fine for Prisma createMany
    const wordPayloads = listData.words.map((w, idx) => ({
      id: w.id, // using the generated id
      listId: vocabList.id,
      week: Math.floor(idx / 50) + 1, // distribute them into weeks of 50 words each for pacing
      word: w.word,
      definition: w.definition || 'Practice the word in context.'
    }));

    await prisma.vocabWord.createMany({
      data: wordPayloads,
      skipDuplicates: true
    });

    totalWordsIngested += wordPayloads.length;
  }

  console.log(`Successfully ingested ${totalWordsIngested} words across ${levelsMeta.length} lists!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
