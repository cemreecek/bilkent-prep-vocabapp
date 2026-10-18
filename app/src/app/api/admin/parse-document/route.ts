import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import mammoth from "mammoth";

const SCHEMA = `
You must output ONLY valid JSON. Do not use markdown blocks like \`\`\`json. Just raw JSON.
The JSON must be an array of objects representing sections of a practice exam.

Section Types: "multiple-choice", "paragraph-cloze", "gap-fill", "word-bank", "matching", "open-ended".

Schema:
[
  {
    "instruction": "Instruction text here",
    "type": "multiple-choice",
    "items": [
      {
        "questionText": "Question text",
        "options": [ { "text": "A", "isCorrect": false }, { "text": "B", "isCorrect": true } ]
      },
      {
        "questionText": "Question text with blank ______",
        "correctAnswer": "Answer",
        "options": []
      },
      {
        "questionText": "Paragraph text with {1} and {2} markers",
        "options": [
          [ { "text": "A", "isCorrect": true, "blankIndex": 1 }, { "text": "B", "isCorrect": false, "blankIndex": 1 } ],
          [ { "text": "C", "isCorrect": false, "blankIndex": 2 }, { "text": "D", "isCorrect": true, "blankIndex": 2 } ]
        ]
      }
    ]
  }
]
`;
const SYSTEM_PROMPT = `You convert exam documents into strict JSON. Accuracy of the answer key is more important than anything else.

RULES
1. Output ONLY a raw JSON array that matches the schema. No prose, no markdown, no comments.
2. The ANSWER KEY in the document is the ONLY source of truth. Never infer, guess, or "improve" an answer. If the key gives a letter (e.g. "3. B"), map it to the option that carries that letter in the document, not to the option's position in your output.
3. Keep option text exactly as written in the document (same spelling, no added letters like "A)" in "text").
4. multiple-choice / word-bank / matching: exactly ONE option per question has "isCorrect": true.
5. paragraph-cloze: for EACH blank, exactly ONE option has "isCorrect": true, and every option carries the correct "blankIndex".
6. gap-fill: "correctAnswer" must be the key's answer verbatim (no numbering, no trailing punctuation unless part of the answer).
7. If the key is missing or ambiguous for a question, set "needsReview": true on that item instead of guessing.

INTERNAL VERIFICATION (do silently, never print it)
Before emitting the JSON, for every question: (a) find its entry in the ANSWER KEY, (b) locate the exact option/word it points to, (c) re-read the question and confirm that option fits, (d) confirm the JSON marks that same option and no other. If any check fails, fix the JSON or set "needsReview": true. Only then output.`;

function validateSections(sections: any): string[] {
  const problems: string[] = [];
  if (!Array.isArray(sections)) return ["Top-level value is not an array."];
  const correctCount = (opts: any) => (Array.isArray(opts) ? opts.filter((o: any) => o?.isCorrect === true).length : 0);
  sections.forEach((s: any, si: number) => {
    (s?.items ?? []).forEach((item: any, ii: number) => {
      if (item?.needsReview) return;
      const where = `Section ${si + 1}, item ${ii + 1}`;
      const opts = item?.options ?? [];
      if (s.type === "paragraph-cloze") {
        opts.forEach((group: any, gi: number) => {
          if (correctCount(group) !== 1) problems.push(`${where}, blank ${gi + 1}: needs exactly one correct option.`);
        });
      } else if (opts.length > 0) {
        if (correctCount(opts) !== 1) problems.push(`${where}: needs exactly one correct option (found ${correctCount(opts)}).`);
      } else if (s.type === "gap-fill" && !String(item?.correctAnswer ?? "").trim()) {
        problems.push(`${where}: missing correctAnswer.`);
      }
    });
  });
  return problems;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "No Gemini API Key configured on server" }, { status: 500 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let extractedText = "";

    // Extract text based on file type
    if (file.name.endsWith(".docx")) {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else {
      // Assume markdown or plain text
      extractedText = buffer.toString("utf-8");
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json({ error: "Could not extract text from document" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: { temperature: 0, responseMimeType: "application/json" },
    });

    const basePrompt = SCHEMA + "\n\nDOCUMENT:\n" + extractedText;
    let parsedJson: any = null;
    let problems: string[] = [];

    for (let attempt = 0; attempt < 2; attempt++) {
      const prompt = attempt === 0
        ? basePrompt
        : basePrompt + "\n\nYOUR PREVIOUS OUTPUT FAILED VALIDATION:\n- " + problems.join("\n- ") + "\nRe-read the ANSWER KEY and return a corrected JSON array.";
      const result = await model.generateContent(prompt);
      let text = result.response.text().trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
      try {
        parsedJson = JSON.parse(text);
        problems = validateSections(parsedJson);
      } catch (e: any) {
        parsedJson = null;
        problems = ["Output was not valid JSON: " + e.message];
      }
      if (problems.length === 0) break;
    }

    if (problems.length > 0) {
      // Never silently save a bad answer key: surface it so the teacher can review.
      return NextResponse.json({ success: true, data: parsedJson, warnings: problems });
    }

    return NextResponse.json({ success: true, data: parsedJson });
  } catch (error: any) {
    console.error("Error parsing document with AI:", error);
    return NextResponse.json({ error: error.message || "Unknown error during AI parsing" }, { status: 500 });
  }
}
