import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting Strict CSV Practice Data Seeder...');

  // The template is located in the root of the project (one level up from app)
  const csvPath = path.join(process.cwd(), '..', 'practice_template.csv');
  if (!fs.existsSync(csvPath)) {
    console.log(`❌ No CSV file found at ${csvPath}`);
    return;
  }
  
  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  
  const parsed = Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    console.error('❌ Errors parsing CSV:', parsed.errors);
    return;
  }

  const rows: any[] = parsed.data;
  console.log(`Successfully read ${rows.length} rows from CSV.`);

  // Group by List (Level + Unit)
  const listsToSeed = new Set<string>();
  for (const row of rows) {
    if (row.Level && row.Unit) {
      listsToSeed.add(`${row.Level}---${row.Unit}`);
    }
  }

  // Ensure lists exist and clear old questions for exactly these lists to prevent duplicates
  const listIdMap = new Map<string, string>();
  for (const listKey of listsToSeed) {
    const [level, unit] = listKey.split('---');
    let list = await prisma.vocabList.findFirst({
      where: { level: level as any, unit: unit }
    });

    if (!list) {
      list = await prisma.vocabList.create({
        data: { level: level as any, unit: unit }
      });
      console.log(`Created new VocabList: ${level} ${unit}`);
    } else {
      console.log(`Wiping old questions for existing VocabList: ${level} ${unit} to prevent duplicates...`);
      await prisma.practiceQuestion.deleteMany({
        where: { listId: list.id }
      });
    }
    listIdMap.set(listKey, list.id);
  }

  console.log(`\nInjecting ${rows.length} questions into Database...`);
  
  let inserted = 0;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row.Level || !row.Unit || !row.Question_Type) continue;

    const listKey = `${row.Level}---${row.Unit}`;
    const listId = listIdMap.get(listKey);
    if (!listId) continue;

    const type = row.Question_Type.trim();
    const qText = row.Question_Text || "";
    const instruction = row.Instruction || "";
    const week = parseInt(row.Week) || 1;
    const correctAnsRaw = (row.Correct_Answer || "").toString();

    let optionsData: any[] = [];
    let dbCorrectAnswer: string | null = correctAnsRaw;

    if (type === 'multiple-choice') {
      // Correct_Answer should be A, B, C, D, or E
      const answerChar = correctAnsRaw.trim().toUpperCase();
      const choiceMap: any = { 'A': row.Option_A, 'B': row.Option_B, 'C': row.Option_C, 'D': row.Option_D, 'E': row.Option_E };
      
      Object.keys(choiceMap).forEach(key => {
        if (choiceMap[key]) {
          optionsData.push({
            text: choiceMap[key].trim(),
            isCorrect: key === answerChar,
            blankIndex: 1
          });
        }
      });
      dbCorrectAnswer = 'multiple'; // Following schema convention
    } 
    else if (type === 'paragraph-cloze') {
      // Options are comma separated per blank (Option_A = Blank 1, Option_B = Blank 2, etc.)
      // Correct answers are pipe separated
      const correctAnswersList = correctAnsRaw.split('|').map((s: string) => s.trim());
      const blankCols = [row.Option_A, row.Option_B, row.Option_C, row.Option_D, row.Option_E];

      blankCols.forEach((colRaw, idx) => {
        if (colRaw && colRaw.trim() !== '') {
          const blankIndex = idx + 1;
          const choices = colRaw.split(',').map((s: string) => s.trim());
          const correctChoice = correctAnswersList[idx] || "";
          
          choices.forEach((choice: string) => {
            optionsData.push({
              text: choice,
              isCorrect: choice.toLowerCase() === correctChoice.toLowerCase(),
              blankIndex: blankIndex
            });
          });
        }
      });
      dbCorrectAnswer = 'multiple';
    }
    else if (type === 'word-bank') {
      // Options are inside Word_Bank_Choices, comma separated
      // Note: for word bank, the student drags from a common pool to blanks.
      // We store all words as options for blank 1, or just let the frontend use the options array.
      if (row.Word_Bank_Choices) {
        const bankWords = row.Word_Bank_Choices.split(',').map((s: string) => s.trim());
        bankWords.forEach((word: string) => {
          optionsData.push({
            text: word,
            isCorrect: true, // For word bank, all are "valid" options, correctness is judged by the correctAnswersList
            blankIndex: 1
          });
        });
      }
      dbCorrectAnswer = correctAnsRaw; // e.g., "sunny | beach"
    }
    else if (type === 'matching') {
      // Simple text match
      dbCorrectAnswer = correctAnsRaw.trim();
    }
    else if (type === 'open-ended') {
      dbCorrectAnswer = correctAnsRaw.trim();
    }

    try {
      await prisma.practiceQuestion.create({
        data: {
          listId: listId,
          week: week,
          questionText: qText,
          instruction: instruction,
          type: type,
          correctAnswer: dbCorrectAnswer,
          options: {
            create: optionsData
          }
        }
      });
      inserted++;
    } catch(e: any) {
      console.error(`❌ Error inserting row ${i + 2}:`, e.message);
    }
  }

  console.log(`✅ Success! Seeded ${inserted} questions from CSV.`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
