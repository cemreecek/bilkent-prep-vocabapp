require('dotenv').config();
const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

async function importVocabFromExcel(filePath, level, unit) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  console.log(`Importing ${data.length} words from ${filePath} for ${level} ${unit}`);

  const vocabListId = `${level.toLowerCase()}-${unit.toLowerCase().replace(' ', '-')}`;

  await prisma.vocabList.upsert({
    where: { id: vocabListId },
    update: {},
    create: {
      id: vocabListId,
      level,
      unit,
      words: {
        create: data.map(row => ({
          word: row.Word || row.word,
          definition: row.Definition || row.definition
        }))
      }
    }
  });
}

async function main() {
  const basePath = path.join(__dirname, '..', '..');

  // Elementary
  await importVocabFromExcel(
    path.join(basePath, 'Elementary', 'VOCABULARY STRAND', 'VOCABULARY STRAND', 'WORDLISTS', 'ELEMENTARY LEVEL WORDLIST (2025-26) (updated June 2025).xlsx'),
    'Elementary',
    'Unit 1'
  );

  // Intermediate
  await importVocabFromExcel(
    path.join(basePath, 'Intermediate', 'VOCABULARY STRAND', 'WORDLISTS', '2024-2025 INTERMEDIATE LEVEL WORDLIST updated June 2024.xlsx'),
    'Intermediate',
    'Unit 1'
  );

  // Add more as needed

  console.log('Migration completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });