import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting AI Practice Data Seeder...');

  const dirPath = path.join(process.cwd(), 'public', 'data', 'practices');
  const files = fs.readdirSync(dirPath).filter(f => f.startsWith('upper-set-') && f.endsWith('.json'));

  for (const file of files) {
    const dataPath = path.join(dirPath, file);
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const questions = JSON.parse(rawData);

    const match = file.match(/upper-set-(\d+)/);
    const setNum = match ? match[1] : '1';

    console.log(`\nProcessing Set ${setNum} (${questions.length} sections)...`);

    // Upsert the VocabList to attach questions to
    let list = await prisma.vocabList.findFirst({
      where: { level: 'Upper', unit: `Set ${setNum}` }
    });

    if (!list) {
      list = await prisma.vocabList.create({
        data: {
          level: 'Upper',
          unit: `Set ${setNum}`
        }
      });
      console.log(`Created VocabList for Upper Set ${setNum}`);
    } else {
      console.log(`Found existing VocabList for Upper Set ${setNum}`);
      // Clear out old questions if we're reseeding
      await prisma.practiceQuestion.deleteMany({
        where: { listId: list.id }
      });
      console.log(`Cleared existing practice questions for this list.`);
    }

    console.log(`Inserting Practice Sections for Set ${setNum}...`);
  
  let inserted = 0;
  for (const section of questions) {
    if (section.type === 'paragraph-cloze' || section.type === 'word-bank') {
      // Group items by exact questionText so we insert the paragraph only ONCE
      const grouped = new Map<string, any>();
      for (const item of section.items) {
        // Assign blankIndex based on subarray position if missing
        let processedOptions: any[] = [];
        if (Array.isArray(item.options)) {
          if (item.options.length > 0 && Array.isArray(item.options[0])) {
            item.options.forEach((subArr: any[], idx: number) => {
              subArr.forEach(opt => {
                processedOptions.push({ ...opt, blankIndex: opt.blankIndex || (idx + 1) });
              });
            });
          } else {
            processedOptions = item.options.map((opt: any) => ({ ...opt, blankIndex: opt.blankIndex || 1 }));
          }
        }

        if (!grouped.has(item.questionText)) {
          grouped.set(item.questionText, { ...item, allOptions: [...processedOptions] });
        } else {
          grouped.get(item.questionText).allOptions.push(...processedOptions);
        }
      }
      
      for (const [text, mergedItem] of grouped.entries()) {
        await prisma.practiceQuestion.create({
          data: {
            listId: list.id,
            week: parseInt(setNum),
            questionText: text,
            instruction: section.instruction,
            type: section.type,
            correctAnswer: 'multiple',
            options: {
              create: mergedItem.allOptions.map((opt: any) => ({
                text: opt.text,
                isCorrect: opt.isCorrect,
                blankIndex: opt.blankIndex
              }))
            }
          }
        });
        inserted++;
      }
    } else {
      // Normal insertion for other types
      for (const q of section.items) {
        const flattenedOptions = Array.isArray(q.options) ? q.options.flat() : [];
        await prisma.practiceQuestion.create({
          data: {
            listId: list.id,
            week: parseInt(setNum),
            questionText: q.questionText,
            instruction: section.instruction,
            type: section.type,
            correctAnswer: q.correctAnswer || null,
            options: {
              create: flattenedOptions.map((opt: any) => ({
                text: opt.text,
                isCorrect: opt.isCorrect,
                blankIndex: opt.blankIndex || 1
              }))
            }
          }
        });
        inserted++;
      }
    }
  }

    console.log(`✅ Success! Seeded ${inserted} questions for Set ${setNum}.`);
  }
  
  console.log('All files processed!');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
