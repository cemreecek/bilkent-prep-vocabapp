import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env') });

// Check for API key
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Error: GEMINI_API_KEY environment variable not found. Please set it.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
// Using gemini-2.5-flash
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const OUTPUT_DIR = path.join(__dirname, '../public/data/practices');

const DIRS = [
    "D:\\Bilkent\\BilkentApp\\BilkentApp\\Prefac\\FALL SEMESTER\\WORDLIST SETS & PRACTICE MATERIALS\\PFC WORD LIST SETS FALL PRACTICE MATERIALS (Updated September 2024)",
    "D:\\Bilkent\\BilkentApp\\BilkentApp\\Upper\\VOCABULARY STRAND\\P 1&3 VOCABULARY SETS & PRACTICE MATERIALS\\PERIODS 1&3 PRACTICE MATERIALS FOR SETS"
];

const SCHEMA = `
You must output ONLY valid JSON. Do not use markdown blocks like \`\`\`json. Just raw JSON.
The JSON must be an array of objects representing sections of a practice exam.

Section Types: "multiple-choice", "paragraph-cloze", "gap-fill", "word-bank", "matching".

Schema:
[
  {
    "instruction": "Instruction text here",
    "type": "multiple-choice", // or other types
    "items": [
      // For multiple-choice
      {
        "questionText": "Question text",
        "options": [ { "text": "A", "isCorrect": false }, { "text": "B", "isCorrect": true } ]
      },
      // For gap-fill (where user types answer)
      {
        "questionText": "Question text with blank ______",
        "correctAnswer": "Answer",
        "options": []
      },
      // For paragraph-cloze or word-bank
      {
        "questionText": "Paragraph text with {1} and {2} markers",
        "options": [
          // Array for blank 1
          [ { "text": "A", "isCorrect": true, "blankIndex": 1 }, { "text": "B", "isCorrect": false, "blankIndex": 1 } ],
          // Array for blank 2
          [ { "text": "C", "isCorrect": false, "blankIndex": 2 }, { "text": "D", "isCorrect": true, "blankIndex": 2 } ]
        ]
      }
    ]
  }
]
`;

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const filesToParse: string[] = [];

  for (const dir of DIRS) {
      if (!fs.existsSync(dir)) continue;
      const files = fs.readdirSync(dir);
      for (const file of files) {
          if (file.endsWith(".md")) {
              if (file.includes("Set 1") && file.includes("PFC")) {
                  console.log(`Skipping: ${file} (Pre-Fac Set 1 omitted as requested)`);
                  continue;
              }
              filesToParse.push(path.join(dir, file));
          }
      }
  }

  for (const filePath of filesToParse) {
    const fileName = path.basename(filePath, '.md');
    
    // Map filename to expected format for seeder script
    let outName = '';
    if (fileName.includes("Upper") || fileName.includes("Periods")) {
        const match = fileName.match(/Set\s+(\d+)/i);
        if (match) outName = `upper-set-${match[1]}.json`;
    } else if (fileName.includes("PFC")) {
        const match = fileName.match(/Set\s+(\d+)/i);
        if (match) outName = `prefac-practice-set-${match[1]}.json`;
    }

    if (!outName) {
        console.log(`Could not determine naming convention for ${fileName}`);
        continue;
    }

    const outPath = path.join(OUTPUT_DIR, outName);
    
    if (fs.existsSync(outPath)) {
        console.log(`Skipping already parsed file: ${outName}`);
        continue;
    }
    
    console.log(`Parsing ${fileName} -> ${outName}...`);
    
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      const prompt = `
You are an expert OCR parser. Your job is to convert the following messy document text into a perfectly structured JSON array.

Follow the schema rules exactly. If a section is speaking questions, you can use type="open-ended". If it's matching, use type="matching".
Make sure to extract the correct answers from the ANSWER KEY at the bottom of the document and map them to the questions by setting "isCorrect": true or "correctAnswer".

` + SCHEMA + `

DOCUMENT:
` + fileContent;

      const result = await model.generateContent(prompt);
      let text = result.response.text().trim();
      
      // Cleanup markdown block if model accidentally included it
      if (text.startsWith('\`\`\`json')) {
        text = text.substring(7);
      }
      if (text.endsWith('\`\`\`')) {
        text = text.substring(0, text.length - 3);
      }
      text = text.trim();

      // Test JSON validity
      JSON.parse(text);

      fs.writeFileSync(outPath, text, 'utf8');
      console.log(`✅ Saved to ${outPath}`);
      
    } catch (e: any) {
      console.error(`❌ Failed to parse ${fileName}: ${e.message}`);
    }
    
    // Add a 25-second delay to strictly respect the 5 RPM limit (even if it failed)
    await new Promise(resolve => setTimeout(resolve, 25000));
  }
  
  console.log("All AI parsing completed.");
}

main().catch(console.error);
