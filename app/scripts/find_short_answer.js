const fs = require('fs')
const path = require('path')

const practicesDir = path.join(__dirname, '..', 'public', 'data', 'practices')
const files = fs.readdirSync(practicesDir).filter(f => f.endsWith('.json'))

for (const file of files) {
  const content = fs.readFileSync(path.join(practicesDir, file), 'utf8')
  if (content.includes('short-answer')) {
    const data = JSON.parse(content)
    for (const chunk of data) {
      if (chunk.type === 'short-answer' || chunk.type === 'sentence-construction') {
        console.log(`File: ${file}`)
        console.log(JSON.stringify(chunk.items[0], null, 2))
        return
      }
    }
  }
}
