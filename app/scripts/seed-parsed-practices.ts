import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting Auto-Parsed AI Practice Data Seeder...');
  
  console.log('Running seeder without global wipe...');
  
  const dirPath = path.join(process.cwd(), 'public', 'data', 'practices', 'auto-parsed');
  if (!fs.existsSync(dirPath)) {
    console.log('No auto-parsed directory found.');
    return;
  }
  
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const dataPath = path.join(dirPath, file);
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    let questions = [];
    try {
      questions = JSON.parse(rawData);
    } catch (e) {
      console.error(`Error parsing JSON in ${file}`);
      continue;
    }

    // Determine level and unit from filename
    // e.g. "PFC Spring Semester Wordlist- Set 1.json" -> Level: "Pre-Faculty", Unit: "Set 1"
    let level: any = 'UpperIntermediate';
    if (file.toLowerCase().includes('pfc') || file.toLowerCase().includes('prefac')) {
      level = 'PreFac';
    } else if (file.toLowerCase().includes('upper')) {
      level = 'UpperIntermediate';
    }

    let unit = 'Extra Practice';
    const setMatch = file.match(/set\s*(\d+)/i);
    if (setMatch) {
      unit = `Set ${setMatch[1]}`;
    }

    console.log(`\nProcessing ${file} (${questions.length} sections)...`);
    console.log(`Mapped to Level: ${level}, Unit: ${unit}`);

    // Upsert the VocabList to attach questions to
    let list = await prisma.vocabList.findFirst({
      where: { level: level, unit: unit }
    });

    if (!list) {
      list = await prisma.vocabList.create({
        data: {
          level: level,
          unit: unit
        }
      });
      console.log(`Created VocabList for ${level} ${unit}`);
    } else {
      console.log(`Found existing VocabList for ${level} ${unit}. Clearing its existing questions...`);
      await prisma.practiceQuestion.deleteMany({
        where: { listId: list.id }
      });
    }

    console.log(`Inserting Practice Sections...`);
  
    let inserted = 0;
    for (const section of questions) {
      if (!section || !section.items) continue;
      
      if (section.type === 'paragraph-cloze' || section.type === 'word-bank') {
        const grouped = new Map<string, any>();
        for (const item of section.items) {
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
          try {
            await prisma.practiceQuestion.create({
              data: {
                listId: list.id,
                week: setMatch ? parseInt(setMatch[1]) : 1,
                questionText: text,
                instruction: section.instruction || "",
                type: section.type,
                correctAnswer: 'multiple',
                options: {
                  create: mergedItem.allOptions.map((opt: any) => ({
                    text: opt.text || "",
                    isCorrect: !!opt.isCorrect,
                    blankIndex: opt.blankIndex || 1
                  }))
                }
              }
            });
            inserted++;
          } catch(e: any) {
            console.error(`Error inserting cloze item:`, e.message);
          }
        }
      } else {
        // Normal insertion for other types
        for (const q of section.items) {
          try {
            const flattenedOptions = Array.isArray(q.options) ? q.options.flat() : [];
            await prisma.practiceQuestion.create({
              data: {
                listId: list.id,
                week: setMatch ? parseInt(setMatch[1]) : 1,
                questionText: q.questionText || "",
                instruction: section.instruction || "",
                type: section.type || "multiple-choice",
                correctAnswer: q.correctAnswer || null,
                options: {
                  create: flattenedOptions.map((opt: any) => ({
                    text: opt.text || "",
                    isCorrect: !!opt.isCorrect,
                    blankIndex: opt.blankIndex || 1
                  }))
                }
              }
            });
            inserted++;
          } catch(e: any) {
            console.error(`Error inserting standard item:`, e.message);
          }
        }
      }
    }

    console.log(`✅ Success! Seeded ${inserted} questions from ${file}.`);
  }
  
  console.log('All auto-parsed files processed!');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
