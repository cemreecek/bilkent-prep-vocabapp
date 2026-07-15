import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import * as path from 'path';
import * as fs from 'fs';
import * as mammoth from 'mammoth';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('ERROR: GEMINI_API_KEY environment variable is missing.');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ 
  model: 'gemini-2.5-flash', // Flash model has higher rate limits
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          type: { type: SchemaType.STRING, description: "Must be one of: 'multiple-choice', 'cloze', or 'gap-fill'" },
          instruction: { type: SchemaType.STRING, description: "The task instruction (e.g. 'Choose the correct option', 'Fill in the blanks with the correct form')." },
          questionText: { type: SchemaType.STRING, description: "The question text or sentence. For blanks, use '_____'." },
          correctAnswer: { type: SchemaType.STRING, description: "The exact correct answer. Required for 'gap-fill'." },
          options: {
            type: SchemaType.ARRAY,
            description: "Required for 'multiple-choice' and 'cloze'. An array of the available choices.",
            items: {
              type: SchemaType.OBJECT,
              properties: {
                text: { type: SchemaType.STRING, description: "The option text" },
                isCorrect: { type: SchemaType.BOOLEAN, description: "Whether this option is the correct one" }
              },
              required: ["text", "isCorrect"]
            }
          }
        },
        required: ["type", "instruction", "questionText"]
      }
    }
  }
});

async function extractPracticesFromText(rawText: string, level: string, unit: string) {
  const prompt = `
You are an English Teaching Assistant. Your job is to extract vocabulary practice questions from the following raw text extracted from a Word Document.
The document contains English vocabulary practice tasks (which might include multiple choice questions, cloze tests/paragraphs with blanks, word banks, matching, or word-formation gap-fills).
The level is ${level} and the unit is ${unit}.

Instructions for parsing:
1. Read the instructions for each part carefully to understand what the student needs to do.
2. Convert every task into one of three supported formats: 'multiple-choice', 'cloze', or 'gap-fill'.
   - If it's a multiple choice question with A/B/C/D options, output type: 'multiple-choice', fill the 'options' array, and set 'isCorrect' true for the correct one (deduced from the answer key if present, or solve it yourself if you can).
   - If it's a paragraph with numbered blanks and options provided for each blank, output type: 'cloze', create a question for each blank where 'questionText' is the sentence containing the blank '_____', and provide the 'options'.
   - If it's a fill-in-the-blanks using a word bank, output type: 'gap-fill', where 'questionText' is the sentence with '_____', and 'correctAnswer' is the word that fits. (You can solve it yourself).
   - If it's word formation (e.g., "She acts _____ (BEAUTY)"), output type: 'gap-fill', 'questionText' is "She acts _____ (BEAUTY)", and 'correctAnswer' is "beautifully".
3. Use the Answer Key at the end of the document to identify correct answers if it is provided. If an answer key is NOT provided, use your expert knowledge to determine the correct answers.
4. Output an array of question objects matching the required JSON schema.

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
  console.log('Starting Pre-Fac Practice Parser...');
  
  const materialsDir = 'D:/Bilkent/BilkentApp/BilkentApp/Prefac/FALL SEMESTER/WORDLIST SETS & PRACTICE MATERIALS/PFC WORD LIST SETS FALL PRACTICE MATERIALS (Updated September 2024)';
  
  const files = fs.readdirSync(materialsDir).filter(f => f.endsWith('.docx'));
  
  const outputPath = path.join(process.cwd(), 'public', 'data', 'practices');
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  for (const file of files) {
    const match = file.match(/Set (\d+)/);
    if (!match) continue;
    const setNum = match[1];
    
    const outFilePath = path.join(outputPath, `prefac-practice-set-${setNum}.json`);
    if (fs.existsSync(outFilePath)) {
       console.log(`Skipping Practice Set ${setNum}, already exists.`);
       continue;
    }

    console.log(`\nExtracting text from: ${file}`);
    const filePath = path.join(materialsDir, file);
    
    const mammothResult = await mammoth.extractRawText({ path: filePath });
    const text = mammothResult.value;

    console.log(`Sending text to Gemini for intelligent parsing (Practice Set ${setNum})...`);
    
    console.log('Sleeping for 60 seconds to avoid API rate limits...');
    await new Promise(r => setTimeout(r, 60000));
    
    const parsedPractices = await extractPracticesFromText(text, 'Pre-Fac', `Fall Semester Set ${setNum}`);

    // Add week number to each parsed question
    const FinalPractices = parsedPractices.map((q: any) => ({ ...q, week: parseInt(setNum) }));

    fs.writeFileSync(outFilePath, JSON.stringify(FinalPractices, null, 2));

    console.log(`✅ Success! Extracted ${FinalPractices.length} practice questions.`);
    console.log(`Saved structured JSON to: ${outFilePath}`);
  }
}

main().catch(console.error);
