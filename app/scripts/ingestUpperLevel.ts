import { PrismaClient } from '@prisma/client'
import * as path from 'path'
import * as fs from 'fs'
import * as mammoth from 'mammoth'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting Exact Ingestion for Upper Level...')
  const rootDir = path.resolve(process.cwd(), '../Upper/VOCABULARY STRAND')
  const practiceSetsDir = path.join(rootDir, 'P 1&3 VOCABULARY SETS & PRACTICE MATERIALS', 'PERIODS 1&3 PRACTICE MATERIALS FOR SETS')

  let upperList = await prisma.vocabList.findFirst({
    where: { level: 'UpperIntermediate', unit: 'Periods 1-3' }
  })
  if (!upperList) {
    upperList = await prisma.vocabList.create({
      data: { level: 'UpperIntermediate', unit: 'Periods 1-3' }
    })
  }

  // Clear ONLY practice questions (we keep VocabWords from excel since they might be used elsewhere)
  await prisma.practiceQuestion.deleteMany({ where: { listId: upperList.id } })

  const files = fs.readdirSync(practiceSetsDir)

  for (let week = 1; week <= 8; week++) {
    const practiceFile = files.find(f => f.includes(`Set ${week} Practice Material.docx`))
    if (!practiceFile) {
      console.warn(`Missing practice file for week ${week}`)
      continue
    }

    console.log(`Parsing Set ${week}...`)
    const docxPath = path.join(practiceSetsDir, practiceFile)
    const result = await mammoth.extractRawText({ path: docxPath })
    const text = result.value

    // Extract Answer Key (assuming it's at the end)
    let answerKey = ''
    const answerKeyMatch = text.match(/ANSWER KEY([\s\S]*)/i)
    if (answerKeyMatch) {
      answerKey = answerKeyMatch[1]
    }

    // --- PART 1: Definition Matching ---
    const part1Match = text.match(/PART 1:([\s\S]*?)PART 2:/i)
    if (part1Match) {
      const part1Text = part1Match[1]
      // Try to extract lines starting with a number, capturing until the next number
      const qBlocks = part1Text.split(/(?=\n\d+\s+)/)
      
      for (const block of qBlocks) {
        const qMatch = block.match(/^\n?(\d+)\s+([\s\S]+?)(?=\n[A-E]\s+|\n?[A-E]\)|\t[A-E]\s+)/)
        if (qMatch) {
          const qNum = qMatch[1]
          const definition = qMatch[2].trim().replace(/\n/g, ' ')
          
          // Extract options
          const optionsText = block.substring(qMatch[0].length)
          // We can split by A, B, C, D, E (with optional parens or tabs)
          const optMatches = optionsText.match(/[A-E][\)\t\s]+([^\nA-E]+)(?=[A-E][\)\t\s]|$)/gi)
          
          if (optMatches && optMatches.length === 5) {
            // Find correct answer from answer key for Part 1
            // Look for "PART 1" in answer key and the specific question number
            let correctLetter = 'A' // fallback
            const p1Key = answerKey.match(/PART 1([\s\S]*?)(PART 2|$)/i)
            if (p1Key) {
               // Look for "1 A" or just a list of letters
               // We will attempt a generic letter search
               const letters = p1Key[1].match(/[A-E]/g)
               if (letters && letters[parseInt(qNum)-1]) {
                 correctLetter = letters[parseInt(qNum)-1]
               }
            }
            
            const optionsToSave = optMatches.map(opt => {
               const letter = opt.charAt(0).toUpperCase()
               const text = opt.replace(/^[A-E][\)\t\s]+/, '').trim()
               return { text, isCorrect: letter === correctLetter }
            })

            await prisma.practiceQuestion.create({
              data: {
                listId: upperList.id,
                week,
                type: 'multiple-choice',
                instruction: 'Choose the word that matches the dictionary definition',
                questionText: definition,
                options: { create: optionsToSave }
              }
            })
          }
        }
      }
    }

    // --- PART 2: Cloze Texts ---
    const part2Match = text.match(/PART 2:([\s\S]*?)PART 3:/i)
    if (part2Match) {
      const part2Text = part2Match[1]
      
      // Extract Text blocks
      const textBlocks = part2Text.match(/Text \d+:[\s\S]*?(?=Text \d+:|$)/gi)
      if (textBlocks) {
        for (const tBlock of textBlocks) {
           const paragraphMatch = tBlock.match(/Text \d+:([\s\S]*?)(?=\n\d+\s+[A-E])/)
           if (paragraphMatch) {
              const paragraph = paragraphMatch[1].trim()
              
              // We split the paragraph by blanks, but since we are saving questions per blank:
              // Find all blanks e.g. (1)______________
              const blanks = paragraph.match(/\(\d+\)_{5,}/g)
              if (blanks) {
                 for (const blank of blanks) {
                    const bNumMatch = blank.match(/\((\d+)\)/)
                    if (bNumMatch) {
                       const bNum = bNumMatch[1]
                       // Create a sentence for this blank. (We can just provide the whole paragraph, replacing this specific blank with _____ and restoring others)
                       let qText = paragraph.replace(blank, '_____')
                       // Remove other blank lines
                       qText = qText.replace(/\(\d+\)_{5,}/g, '_____')

                       // Find the options for this bNum
                       const optRegex = new RegExp(`\n\\s*${bNum}\\s+[A-E][\\s\\S]*?(?=\\n\\s*\\d+\\s+[A-E]|$)`, 'i')
                       const optMatch = tBlock.match(optRegex)
                       
                       if (optMatch) {
                          const oMatch = optMatch[0]
                          const opts = oMatch.match(/[A-E][\)\t\s]+([^\nA-E]+)(?=[A-E][\)\t\s]|$)/gi)
                          if (opts && opts.length >= 4) {
                             // Answer key lookup
                             let correctLetter = 'A'
                             const p2Key = answerKey.match(/PART 2([\s\S]*?)(PART 3|$)/i)
                             if (p2Key) {
                               // Usually keys are listed in order
                               const letters = p2Key[1].match(/[A-E]/g)
                               // This is tricky because the numbering is absolute (e.g. 5, 6, 7). We can find the exact number.
                               const specificKey = p2Key[1].match(new RegExp(`${bNum}\\s*([A-E])`))
                               if (specificKey) {
                                  correctLetter = specificKey[1].toUpperCase()
                               } else if (letters && letters[parseInt(bNum)-1]) {
                                  correctLetter = letters[parseInt(bNum)-1]
                               }
                             }

                             const optionsToSave = opts.map(opt => {
                               const letter = opt.trim().charAt(0).toUpperCase()
                               const text = opt.replace(/^[A-E][\)\t\s]+/, '').trim()
                               return { text, isCorrect: letter === correctLetter }
                             })

                             await prisma.practiceQuestion.create({
                                data: {
                                   listId: upperList.id,
                                   week,
                                   type: 'cloze',
                                   instruction: 'Fill in the blank in the text',
                                   questionText: qText,
                                   options: { create: optionsToSave }
                                }
                             })
                          }
                       }
                    }
                 }
              }
           }
        }
      }
    }

    // --- PART 3: Word Formation (Gap-fill) ---
    const part3Match = text.match(/PART 3:([\s\S]*?)(?:PART 4:|ANSWER KEY|$)/i)
    if (part3Match) {
       const p3Text = part3Match[1]
       // Lines like: 1. She placed the chairs_______________ around the room. (STRATEGIC)
       const lines = p3Text.split('\n')
       for (const line of lines) {
          const match = line.match(/^\s*(\d+)\.\s*(.*?)_{5,}(.*?)\(([A-Z]+)\)/i)
          if (match) {
             const qNum = match[1]
             const before = match[2].trim()
             const after = match[3].trim()
             const baseWord = match[4].trim()

             const qText = `${before} _____ ${after} (${baseWord})`
             
             // Answer key lookup
             let correctAnswer = baseWord // fallback
             const p3Key = answerKey.match(/PART 3([\s\S]*?)(PART 4|ANSWER KEY|$)/i)
             if (p3Key) {
                // Usually words are listed in order
                const words = p3Key[1].split('\n').map(w => w.trim()).filter(w => w.length > 2 && !w.includes('PART'))
                // Try finding absolute match
                const specificMatch = p3Key[1].match(new RegExp(`^\\s*${qNum}\\.?\\s+([A-Z]+)`, 'im'))
                if (specificMatch) {
                   correctAnswer = specificMatch[1]
                } else if (words.length > 0 && words[parseInt(qNum)-1]) {
                   correctAnswer = words[parseInt(qNum)-1]
                }
             }

             await prisma.practiceQuestion.create({
                data: {
                   listId: upperList.id,
                   week,
                   type: 'gap-fill',
                   instruction: 'Form the correct word to fit the blank',
                   questionText: qText,
                   correctAnswer: correctAnswer
                }
             })
          }
       }
    }
    
  }
  
  console.log('Ingestion Complete!')
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
