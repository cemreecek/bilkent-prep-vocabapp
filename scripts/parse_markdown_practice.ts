import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DIRECTORIES = [
  path.join(__dirname, '../Upper/VOCABULARY STRAND'),
  path.join(__dirname, '../PreFac/WORDLIST SETS & VOCABULARY STRAND')
];

const UNPARSED_LOG = path.join(__dirname, '../unparsed_files.txt');

async function findMarkdownFiles(dir: string): Promise<string[]> {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(await findMarkdownFiles(fullPath));
    } else if (file.endsWith('.md')) {
      results.push(fullPath);
    }
  }
  return results;
}

function parseFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf8');
  const questions: any[] = [];
  
  // Try to parse strict template first
  const hasStrictTemplate = content.includes('**Instruction:**');
  
  if (hasStrictTemplate) {
    // Basic strict template parser logic here
    // For now, if it has "Instruction:", we just assume it's strict
    return { success: true, questions };
  }

  // Attempt to parse native Word-to-Markdown output
  // Extract Answer Key
  const answerKeyMatch = content.match(/\*\*ANSWER KEY\*\*([\s\S]*)/i);
  if (!answerKeyMatch) {
    return { success: false, reason: "No ANSWER KEY found" };
  }
  
  // If it's too chaotic, return success: false
  // For safety and MVP, I'm returning false for all native files right now to generate the unparsed list,
  // but let's at least try to extract multiple choice questions.
  
  const part1Match = content.match(/\*\*PART 1[^\*]*\*\*([\s\S]*?)(?=\*\*PART 2|\*\*ANSWER KEY)/i);
  if (part1Match) {
    // Try to find questions like "1 word" followed by A B C D E
    const qMatches = part1Match[1].matchAll(/(\d+)\s+([^\n]+)\n+A\s+([^\n]+)\n+B\s+([^\n]+)\n+C\s+([^\n]+)\n+D\s+([^\n]+)\n+E\s+([^\n]+)/g);
    for (const match of qMatches) {
      questions.push({
        num: match[1],
        text: match[2].trim(),
        options: [
           { text: match[3].trim(), letter: 'A' },
           { text: match[4].trim(), letter: 'B' },
           { text: match[5].trim(), letter: 'C' },
           { text: match[6].trim(), letter: 'D' },
           { text: match[7].trim(), letter: 'E' }
        ],
        type: 'multiple-choice'
      });
    }
  }

  if (questions.length === 0) {
    return { success: false, reason: "Could not cleanly extract any questions" };
  }

  return { success: true, questions };
}

async function main() {
  console.log('Starting practice markdown parser...');
  
  let allFiles: string[] = [];
  for (const dir of DIRECTORIES) {
    const files = await findMarkdownFiles(dir);
    allFiles = allFiles.concat(files);
  }
  
  console.log(`Found ${allFiles.length} markdown files to process.`);
  
  const unparsed: string[] = [];
  let successCount = 0;

  for (const file of allFiles) {
    const result = parseFile(file);
    if (result.success) {
      successCount++;
      // TODO: Map to VocabList and insert into DB
    } else {
      unparsed.push(`${file} - Reason: ${result.reason}`);
    }
  }
  
  fs.writeFileSync(UNPARSED_LOG, unparsed.join('\n'));
  
  console.log(`\nParsing Complete!`);
  console.log(`Successfully parsed: ${successCount}`);
  console.log(`Failed to parse: ${unparsed.length}`);
  console.log(`Check unparsed_files.txt for details.`);
}

main().catch(console.error);
