import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Level } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { level, unit, week, data } = body;

    if (!level || !unit || !data || !Array.isArray(data)) {
      return NextResponse.json({ error: "Missing required fields: level, unit, or data." }, { status: 400 });
    }

    // 1. Find or Create VocabList
    let list = await prisma.vocabList.findFirst({
      where: { level: level as Level, unit: unit }
    });

    if (!list) {
      list = await prisma.vocabList.create({
        data: {
          level: level as Level,
          unit: unit
        }
      });
    }

    // 2. Wipe old questions to prevent duplicates
    await prisma.practiceQuestion.deleteMany({
      where: { listId: list.id }
    });

    // 3. Inject new questions
    let inserted = 0;
    for (const section of data) {
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
                week: week || 1,
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
            console.error("Error inserting cloze item:", e.message);
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
                week: week || 1,
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
            console.error("Error inserting standard item:", e.message);
          }
        }
      }
    }

    return NextResponse.json({ success: true, message: `Successfully saved ${inserted} questions.` });
  } catch (error: any) {
    console.error("Error saving practice data:", error);
    return NextResponse.json({ error: error.message || "Unknown error during saving" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
