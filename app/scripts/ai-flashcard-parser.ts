import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import * as path from 'path';
import * as fs from 'fs';
import * as mammoth from 'mammoth';
import * as dotenv from 'dotenv';

// Load .env.local explicitly
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
          day: { type: SchemaType.INTEGER, description: "The day of the week this word belongs to. 1 = MONDAY, 2 = TUESDAY, 3 = WEDNESDAY, 4 = THURSDAY, 5 = FRIDAY." },
          definition: { type: SchemaType.STRING, description: "A simple B1/B2 level definition for the word, matching its most common academic meaning." },
          example: { type: SchemaType.STRING, description: "A simple B1/B2 level example sentence demonstrating the word's meaning." },
        },
        required: ["word", "day", "definition", "example"],
      }
    }
  }
});

async function extractFlashcardsFromText(rawText: string, level: string, unit: string) {
  const prompt = `
You are an English Teaching Assistant. Your job is to extract vocabulary words from the following raw text exported from a Word Document.
The document contains English vocabulary lists assigned to different days of the week (MONDAY, TUESDAY, etc.).
The level is ${level} and the unit is ${unit}.

Rules:
1. Extract every single word listed under a day header.
2. For the 'day' property, use an integer: MONDAY = 1, TUESDAY = 2, WEDNESDAY = 3, THURSDAY = 4, FRIDAY = 5.
3. For each word, generate a simple B1/B2 level definition. If the word has multiple meanings, choose the one most likely to be tested in an academic/upper-intermediate context (e.g. "Account" means an arrangement with a bank, not a story).
4. For each word, generate a short, simple B1/B2 level example sentence.

Raw Text:
"""
${rawText}
"""
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
  console.log('Starting AI-Powered Flashcard Parser...');
  const rootDir = path.resolve(process.cwd(), '../');
  const materialsDir = path.join(rootDir, 'Upper', 'VOCABULARY STRAND', 'P 1&3 VOCABULARY SETS & PRACTICE MATERIALS', 'PERIODS 1&3 VOCABULARY SETS');
  
  if (!fs.existsSync(materialsDir)) {
    console.error('Materials directory not found:', materialsDir);
    return;
  }

  const files = fs.readdirSync(materialsDir).filter(f => f.endsWith('.docx') && (f.includes('Set 5') || f.includes('Set 6') || f.includes('Set 7') || f.includes('Set 8')));
  
  const outputPath = path.join(process.cwd(), 'public', 'data', 'flashcards');
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  for (const file of files) {
    console.log(`\nExtracting text from: ${file}`);
    const filePath = path.join(materialsDir, file);
    const mammothResult = await mammoth.extractRawText({ path: filePath });
    const text = mammothResult.value;

    const match = file.match(/Set (\d+)/);
    const setNum = match ? match[1] : 'Unknown';

    console.log(`Sending text to Gemini for intelligent parsing (Set ${setNum})...`);
    
    // Add 45-second delay to avoid 429 quota limits (15 requests per minute usually)
    // But since it's 20 per day or minute? 20 requests limit was hit.
    // We'll sleep for 60 seconds to be absolutely sure.
    console.log('Sleeping for 60 seconds to avoid API rate limits...');
    await new Promise(r => setTimeout(r, 60000));
    
    const parsedFlashcards = await extractFlashcardsFromText(text, 'Upper Intermediate', `Set ${setNum}`);

    const outFilePath = path.join(outputPath, `upper-set-${setNum}.json`);
    fs.writeFileSync(outFilePath, JSON.stringify(parsedFlashcards, null, 2));

    console.log(`✅ Success! Extracted ${parsedFlashcards.length} flashcards.`);
    console.log(`Saved structured JSON to: ${outFilePath}`);
  }
}

main().catch(console.error);
