import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import * as path from 'path';
import * as fs from 'fs';
import * as xlsx from 'xlsx';
import WordExtractor from 'word-extractor';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('ERROR: GEMINI_API_KEY environment variable is missing.');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ 
  model: 'gemini-2.5-flash',
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          word: { type: SchemaType.STRING },
          day: { type: SchemaType.INTEGER, description: "The day of the week this word belongs to. 1 = MONDAY, 2 = TUESDAY, etc." },
          definition: { type: SchemaType.STRING, description: "A simple B1/B2 level definition for the word, matching its most common academic meaning." },
          example: { type: SchemaType.STRING, description: "A simple B1/B2 level example sentence. IMPORTANT: If a collocation was provided, you MUST use that exact collocation phrase in the sentence." },
        },
        required: ["word", "day", "definition", "example"],
      }
    }
  }
});

async function extractFlashcardsFromText(wordsData: any[], level: string, unit: string) {
  const wordsJsonStr = JSON.stringify(wordsData, null, 2);
  const prompt = `
You are an English Teaching Assistant. Your job is to generate flashcard data for the following vocabulary words.
The level is ${level} and the unit is ${unit}.

Here is the list of words, their assigned day of the week (1=Monday, 5=Friday), and their target collocation (if available).

${wordsJsonStr}

Rules:
1. Return exactly one JSON object per word in the list.
2. Maintain the 'day' property as provided.
3. For each word, generate a simple B1/B2 level definition.
4. For each word, generate a short, simple B1/B2 level example sentence.
5. CRITICAL: If the word data contains a "collocation" field with a value, your generated example sentence MUST include that exact collocation. For example, if the collocation is "take the tube", the sentence should be "She always takes the tube to work." (You can conjugate the verb appropriately).
  `;

  let retries = 5;
  while (retries > 0) {
    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      return JSON.parse(responseText.trim());
    } catch (e: any) {
      if (e.status === 429 || (e.message && e.message.includes('429'))) {
        console.log('Hit 429 Rate Limit. Sleeping for 60 seconds before retrying...');
        await new Promise(r => setTimeout(r, 60000));
        retries--;
      } else {
        console.error('Failed to parse AI output as JSON:', e);
        return [];
      }
    }
  }
  return [];
}

async function main() {
  console.log('Starting Pre-Fac Flashcard Parser...');
  
  // 1. Read Excel
  const excelPath = path.resolve('D:/Bilkent/BilkentApp/BilkentApp/Prefac/FALL SEMESTER/2024-25 PFC LEVEL WORDLIST (Updated 25.06.2024).xlsx');
  const workbook = xlsx.readFile(excelPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData: any[] = xlsx.utils.sheet_to_json(sheet);
  
  const wordMap = new Map<string, any>();
  
  for (const row of rawData) {
    const hw = row['__EMPTY'];
    if (typeof hw === 'string' && hw.trim() !== '' && hw !== 'HEADWORD') {
      wordMap.set(hw.trim().toLowerCase(), {
        verb: row['__EMPTY_1'],
        noun: row['__EMPTY_2'],
        adj: row['__EMPTY_3'],
        adv: row['__EMPTY_4'],
        collocation: row['__EMPTY_5']
      });
    }
  }
  console.log(`Loaded ${wordMap.size} words from Excel.`);

  const materialsDir = 'D:/Bilkent/BilkentApp/BilkentApp/Prefac/FALL SEMESTER/WORDLIST SETS & PRACTICE MATERIALS/PFC LEVEL WORDLIST SETS (Updated September 2024)';
  
  const files = fs.readdirSync(materialsDir).filter(f => f.endsWith('.doc'));
  
  const outputPath = path.join(process.cwd(), 'public', 'data', 'flashcards');
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  const extractor = new WordExtractor();

  for (const file of files) {
    const match = file.match(/Set (\d+)/);
    if (!match) continue;
    const setNum = match[1];
    
    // Only parse if not already generated, or we can just generate all.
    const outFilePath = path.join(outputPath, `prefac-set-${setNum}.json`);
    if (fs.existsSync(outFilePath)) {
       console.log(`Skipping Set ${setNum}, already exists.`);
       continue;
    }

    console.log(`\nExtracting text from: ${file}`);
    const filePath = path.join(materialsDir, file);
    
    const doc = await extractor.extract(filePath);
    const text = doc.getBody();
    
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    let currentDay = 1;
    const wordsToProcess: any[] = [];
    
    for (const line of lines) {
      const upperLine = line.toUpperCase();
      if (upperLine.includes('MONDAY')) currentDay = 1;
      else if (upperLine.includes('TUESDAY')) currentDay = 2;
      else if (upperLine.includes('WEDNESDAY')) currentDay = 3;
      else if (upperLine.includes('THURSDAY')) currentDay = 4;
      else if (upperLine.includes('FRIDAY')) currentDay = 5;
      else if (upperLine.includes('SET')) {
         // ignore "SET 1 MONDAY" part handling as it usually contains the day too
      } else {
         // It's a word!
         const word = line.replace(/[^a-zA-Z\s-]/g, '').trim();
         if (word.length > 1) {
            const lowerWord = word.toLowerCase();
            const excelData = wordMap.get(lowerWord) || {};
            wordsToProcess.push({
               word: word,
               day: currentDay,
               collocation: excelData.collocation || null
            });
         }
      }
    }

    console.log(`Found ${wordsToProcess.length} words for Set ${setNum}. Sending to Gemini...`);
    
    console.log('Sleeping for 60 seconds to avoid API rate limits...');
    await new Promise(r => setTimeout(r, 60000));
    
    const parsedFlashcards = await extractFlashcardsFromText(wordsToProcess, 'Pre-Fac', `Fall Semester Set ${setNum}`);

    fs.writeFileSync(outFilePath, JSON.stringify(parsedFlashcards, null, 2));

    console.log(`✅ Success! Extracted ${parsedFlashcards.length} flashcards.`);
    console.log(`Saved structured JSON to: ${outFilePath}`);
  }
}

main().catch(console.error);
