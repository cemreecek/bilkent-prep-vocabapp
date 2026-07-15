import fs from 'fs'
import path from 'path'
import * as xlsx from 'xlsx'
import mammoth from 'mammoth'

export interface PracticeItem {
  id: string
  question: string
  options: { id: string, text: string, isCorrect: boolean }[]
  instruction: string
  mode: 'cloze' | 'multiple-choice'
}

export async function loadPracticeMaterials(levelFolder: string): Promise<PracticeItem[]> {
  const rootPath = path.resolve(process.cwd(), '..')
  let folderPath = ''

  if (levelFolder === 'Elementary') {
    folderPath = path.join(rootPath, 'Elementary', 'VOCABULARY STRAND', 'VOCABULARY STRAND')
  } else if (levelFolder === 'Intermediate') {
    folderPath = path.join(rootPath, 'Intermediate', 'VOCABULARY STRAND')
  } else if (levelFolder === 'Pin') {
    folderPath = path.join(rootPath, 'Pin', 'VOCABULARY STRAND PERIOD 2')
  } else if (levelFolder === 'Upper') {
    folderPath = path.join(rootPath, 'Upper', 'VOCABULARY STRAND', 'P 1&3 VOCABULARY SETS & PRACTICE MATERIALS')
  } else if (levelFolder === 'Prefac') {
    folderPath = path.join(rootPath, 'Prefac', 'WORDLIST SETS & VOCABULARY STRAND', 'PFC WORD LIST SETS SPRING PRACTICE MATERIALS (Updated June 2025)')
  }

  const items: PracticeItem[] = []
  
  if (!fs.existsSync(folderPath)) {
    console.warn('Folder not found:', folderPath)
    return items
  }

  const files = fs.readdirSync(folderPath)

  for (const file of files) {
    const ext = path.extname(file).toLowerCase()
    const filePath = path.join(folderPath, file)
    
    if (ext === '.docx' || ext === '.doc') {
      try {
        // Simple heuristic extraction using mammoth for docx
        const result = await mammoth.extractRawText({ path: filePath })
        const text = result.value
        
        // Basic parsing logic to find cloze test sentences or multiple choice
        // For demonstration, we'll create a few sample questions based on the text length or presence of blanks
        const lines = text.split('\n').filter(l => l.trim().length > 10)
        
        for (let i = 0; i < Math.min(3, lines.length); i++) {
          const line = lines[i]
          // If it looks like a sentence, turn it into a cloze practice
          if (line.split(' ').length > 5) {
            const words = line.split(' ')
            // Pick a random medium-length word to blank out
            const targetWordIndex = words.findIndex(w => w.length > 5 && w.length < 12)
            
            if (targetWordIndex !== -1) {
              const targetWord = words[targetWordIndex]
              words[targetWordIndex] = '_____'
              
              items.push({
                id: `${file}-${i}`,
                question: words.join(' '),
                instruction: 'Select the most appropriate synonym to fill in the blank',
                mode: 'cloze',
                options: [
                  { id: 'a', text: targetWord.replace(/[.,!?]/g, ''), isCorrect: true },
                  { id: 'b', text: 'ObscureWord1', isCorrect: false },
                  { id: 'c', text: 'Distractor2', isCorrect: false },
                  { id: 'd', text: 'Incorrect3', isCorrect: false },
                ].sort(() => Math.random() - 0.5)
              })
            }
          }
        }
      } catch (err) {
        console.warn('Could not parse document:', file)
      }
    } else if (ext === '.xlsx') {
      try {
        const workbook = xlsx.readFile(filePath)
        const sheetName = workbook.SheetNames[0]
        const data = xlsx.utils.sheet_to_json<any>(workbook.Sheets[sheetName])
        
        for (let i = 0; i < Math.min(5, data.length); i++) {
          const row = data[i]
          const word = row.Word || row.word || Object.values(row)[0]
          const definition = row.Definition || row.definition || Object.values(row)[1]
          
          if (word && definition) {
            items.push({
              id: `${file}-${i}`,
              question: `Which word means: "${definition}"?`,
              instruction: 'Select the correct vocabulary word',
              mode: 'multiple-choice',
              options: [
                { id: 'a', text: word, isCorrect: true },
                { id: 'b', text: 'Distractor Word 1', isCorrect: false },
                { id: 'c', text: 'Distractor Word 2', isCorrect: false },
                { id: 'd', text: 'Distractor Word 3', isCorrect: false },
              ].sort(() => Math.random() - 0.5)
            })
          }
        }
      } catch (err) {
        console.warn('Could not parse excel:', file)
      }
    }
  }

  // Fallback if no files could be parsed
  if (items.length === 0) {
    items.push({
      id: `fallback-${levelFolder}`,
      question: `The professor's _____ approach to research ensured no detail was overlooked.`,
      instruction: 'Select the most appropriate word',
      mode: 'cloze',
      options: [
        { id: '1', text: 'A) Scrupulous', isCorrect: true },
        { id: '2', text: 'B) Haphazard', isCorrect: false },
        { id: '3', text: 'C) Superficially', isCorrect: false },
        { id: '4', text: 'D) Negligent', isCorrect: false }
      ]
    })
  }

  return items
}
