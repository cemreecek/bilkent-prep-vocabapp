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
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = "You are an expert OCR parser. Your job is to convert the following messy Word-to-Markdown document into a perfectly structured JSON array. Follow the schema rules exactly. If a section is speaking questions, you can use type=\"open-ended\". If it's matching, use type=\"matching\". Make sure to extract the correct answers from the ANSWER KEY at the bottom of the document and map them to the questions by setting \"isCorrect\": true or \"correctAnswer\".\n\n" + SCHEMA + "\n\nDOCUMENT:\n" + extractedText;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    
    if (text.startsWith('\`\`\`json')) {
      text = text.substring(7);
    }
    if (text.endsWith('\`\`\`')) {
      text = text.substring(0, text.length - 3);
    }
    text = text.trim();

    const parsedJson = JSON.parse(text);

    return NextResponse.json({ success: true, data: parsedJson });
  } catch (error: any) {
    console.error("Error parsing document with AI:", error);
    return NextResponse.json({ error: error.message || "Unknown error during AI parsing" }, { status: 500 });
  }
}
