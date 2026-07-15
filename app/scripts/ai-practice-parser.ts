import { GoogleGenerativeAI } from '@google/generative-ai';
import * as path from 'path';
import * as fs from 'fs';
import * as mammoth from 'mammoth';
import * as dotenv from 'dotenv';

// Load .env.local explicitly since we aren't running through Next.js
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('ERROR: GEMINI_API_KEY environment variable is missing.');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
// Using gemini-2.5-flash since your project has access to the newest models!
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

async function extractQuestionsFromText(rawText: string, level: string, unit: string) {
  const prompt = `
You are an English Teaching Assistant. Your job is to extract practice questions from the following raw text exported from a Word Document.
The document contains English vocabulary practice materials.
The level is ${level} and the unit is ${unit}.

Rules:
1. Ignore general headers, page numbers, or irrelevant instructions.
2. Include ALL exercise types found in the document (e.g. matching, gap-fill, cloze, odd-one-out, sentence completion). DO NOT skip or eliminate any exercises EXCEPT for writing, speaking, and cross-word puzzle exercises, which you MUST completely ignore.
3. Group the questions by their instruction into "Sections". For each instruction chunk, create a section.
3. Determine the type of the section: 'multiple-choice', 'cloze', 'gap-fill', 'paragraph-cloze', 'word-bank', 'matching', or 'rewriting'.
4. 'paragraph-cloze' is a single paragraph that has multiple blanks (e.g. {1}, {2}, {3}). The options array will contain multiple subarrays, each corresponding to a blank index. NEVER classify a paragraph with multiple blanks as 'gap-fill'.
5. 'word-bank': A block of sentences with blanks, sharing a common list of words. Format this EXACTLY like 'paragraph-cloze'.
6. 'matching': A word and a definition. For each item, questionText is the word, options are the definitions.
7. 'rewriting': A sentence to be rewritten. questionText is the original, correctAnswer is the expected output.
8. CRITICAL RULE FOR BOLD TEXT: If the instruction mentions a "bolded word" (e.g., "DIFFERENT MEANINGS OF THE BOLDED WORD"), you MUST wrap the target word in the questionText with Markdown bold asterisks (e.g. "She was **sacked** from her job"). Do NOT forget the ** asterisks!
9. Output the data as a STRICT, VALID JSON Array of Section objects.

Output Schema constraint (TypeScript interface):
interface PracticeOption {
  text: string;
  isCorrect: boolean;
  blankIndex?: number;
}
interface PracticeItem {
  questionText: string;
  correctAnswer?: string;
  options: PracticeOption[];
}
interface PracticeSection {
  instruction: string;
  type: 'multiple-choice' | 'cloze' | 'gap-fill' | 'paragraph-cloze' | 'word-bank' | 'matching' | 'rewriting';
  items: PracticeItem[];
}
// Return an array of PracticeSection objects.

Return ONLY the raw JSON array (no markdown block, no conversational text).

Raw Text:
"""
${rawText}
"""
  `;

  let retries = 5;
  while (retries > 0) {
    try {
      const result = await model.generateContent(prompt);
      let responseText = result.response.text();
      
      // Clean up markdown wrapping if present
      if (responseText.startsWith('```json')) {
        responseText = responseText.substring(7);
        if (responseText.endsWith('```')) {
          responseText = responseText.substring(0, responseText.length - 3);
        }
      }
      return JSON.parse(responseText.trim());
    } catch (e: any) {
      if (e.status === 429 || e.status === 503 || (e.message && (e.message.includes('429') || e.message.includes('503')))) {
        console.log(`Hit ${e.status} error. Sleeping for 30 seconds before retrying...`);
        await new Promise(r => setTimeout(r, 30000));
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
  console.log('Starting AI-Powered Practice Parser...');
  const rootDir = path.resolve(process.cwd(), '../');
  const materialsDir = path.join(rootDir, 'Upper', 'VOCABULARY STRAND', 'P 1&3 VOCABULARY SETS & PRACTICE MATERIALS', 'PERIODS 1&3 PRACTICE MATERIALS FOR SETS');
  
  if (!fs.existsSync(materialsDir)) {
    console.error('Materials directory not found:', materialsDir);
    return;
  }

  const files = fs.readdirSync(materialsDir).filter(f => f.endsWith('.docx') && f.includes('Set 8'));
  
  const outputPath = path.join(process.cwd(), 'public', 'data', 'practices');
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
    const parsedQuestions = await extractQuestionsFromText(text, 'Upper Intermediate', `Set ${setNum}`);

    const outFilePath = path.join(outputPath, `upper-set-${setNum}.json`);
    fs.writeFileSync(outFilePath, JSON.stringify(parsedQuestions, null, 2));

    console.log(`✅ Success! Extracted ${parsedQuestions.length} sections.`);
    console.log(`Saved structured JSON to: ${outFilePath}`);
  }
}

main().catch(console.error);
