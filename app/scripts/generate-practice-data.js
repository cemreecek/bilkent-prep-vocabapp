const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const appDir = path.resolve(__dirname, '..');
const outputDir = path.join(appDir, 'src', 'data');
const levelsDir = path.join(outputDir, 'levels');
const practiceDir = path.join(outputDir, 'practice');

const sources = [
  {
    sourcePath: path.join(appDir, '..', 'Elementary', 'VOCABULARY STRAND', 'VOCABULARY STRAND', 'WORDLISTS', 'ELEMENTARY LEVEL WORDLIST (2025-26) (updated June 2025).xlsx'),
    level: 'Elementary',
    unit: 'Elementary Level Wordlist',
    listName: 'elementary-level-wordlist',
  },
  {
    sourcePath: path.join(appDir, '..', 'Intermediate', 'VOCABULARY STRAND', 'WORDLISTS', '2024-2025 INTERMEDIATE LEVEL WORDLIST updated June 2024.xlsx'),
    level: 'Intermediate',
    unit: 'Intermediate Level Wordlist',
    listName: 'intermediate-level-wordlist',
  },
  {
    sourcePath: path.join(appDir, '..', 'Prefac', 'WORDLIST SETS & VOCABULARY STRAND', '2025-26 PFC LEVEL WORDLIST (Updated 12.06.2025).xlsx'),
    level: 'Pre-faculty',
    unit: 'Prep Faculty Level Wordlist',
    listName: 'prefac-level-wordlist',
  },
  {
    sourcePath: path.join(appDir, '..', 'Upper', 'VOCABULARY STRAND', 'UPPER-INTERMEDIATE LEVEL WORDLIST (2024-2025).xlsx'),
    level: 'Upper Intermediate',
    unit: 'Upper Intermediate Level Wordlist',
    listName: 'upper-intermediate-wordlist',
  },
];

function normalizeValue(value) {
  if (value == null) {
    return '';
  }
  return String(value).trim();
}

function createListId(level, unit) {
  return `${level.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${unit.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`.replace(/^-+|-+$/g, '');
}

function buildDefinition(row, headerMap) {
  const parts = [];
  ['verb', 'noun', 'adjective', 'adverb', 'collocation'].forEach((key) => {
    const value = normalizeValue(row[headerMap[key]] || '');
    if (value) {
      if (key === 'collocation') {
        parts.push(`Example: ${value}`);
      } else {
        parts.push(`${key}: ${value}`);
      }
    }
  });

  if (parts.length > 0) {
    return parts.join(' | ');
  }

  return 'Practice the word in context to improve recall.';
}

const lists = [];

if (!fs.existsSync(levelsDir)) {
  fs.mkdirSync(levelsDir, { recursive: true });
}
if (!fs.existsSync(practiceDir)) {
  fs.mkdirSync(practiceDir, { recursive: true });
}

sources.forEach((source) => {
  if (!fs.existsSync(source.sourcePath)) {
    console.warn(`Source not found: ${source.sourcePath}`);
    return;
  }

  const workbook = xlsx.readFile(source.sourcePath);
  const sheets = workbook.SheetNames;

  sheets.forEach((sheetName, sheetIndex) => {
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, raw: false });
    const headerIndex = rows.findIndex((row) => Array.isArray(row) && row.some((cell) => typeof cell === 'string' && cell.toUpperCase().includes('HEADWORD')));
    if (headerIndex < 0) {
      return;
    }

    const headers = rows[headerIndex].map((cell) => normalizeValue(cell).toLowerCase());
    const headerMap = {};
    headers.forEach((header, idx) => {
      if (header.includes('headword')) headerMap.headword = idx;
      if (header.includes('verb')) headerMap.verb = idx;
      if (header.includes('noun')) headerMap.noun = idx;
      if (header.includes('adjective')) headerMap.adjective = idx;
      if (header.includes('adverb')) headerMap.adverb = idx;
      if (header.includes('collocation')) headerMap.collocation = idx;
    });

    if (!headerMap.headword) {
      return;
    }

    const unitName = sheetName === 'Sheet1' || sheetName === 'Sheet2' || sheetName === 'Sheet3'
      ? `${source.unit} ${sheetName}`
      : source.unit;

    const listId = createListId(source.listName, unitName);
    const words = [];

    rows.slice(headerIndex + 1).forEach((row, rowIndex) => {
      const headword = normalizeValue(row[headerMap.headword]);
      if (!headword) {
        return;
      }

      const definition = buildDefinition(row, headerMap);
      words.push({
        id: `${listId}-${rowIndex + 1}`,
        word: headword,
        definition,
      });
    });

    if (!words.length) {
      return;
    }

    const practiceList = {
      id: listId,
      level: source.level,
      unit: unitName,
      words,
    };

    fs.writeFileSync(path.join(practiceDir, `${listId}.json`), JSON.stringify(practiceList, null, 2));
    lists.push({
      id: listId,
      level: source.level,
      unit: unitName,
      wordCount: words.length,
      file: `practice/${listId}.json`,
    });
  });
});

fs.writeFileSync(path.join(levelsDir, 'levels.json'), JSON.stringify(lists, null, 2));
console.log(`Generated ${lists.length} practice list(s) and levels.json.`);
