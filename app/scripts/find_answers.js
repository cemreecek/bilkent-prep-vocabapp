const fs = require('fs')
const path = require('path')

const practicesDir = path.join(__dirname, '..', 'public', 'data', 'practices')
const files = fs.readdirSync(practicesDir).filter(f => f.endsWith('.json'))

for (const file of files) {
  const content = fs.readFileSync(path.join(practicesDir, file), 'utf8')
  const data = JSON.parse(content)
  for (const chunk of data) {
    for (const item of chunk.items || []) {
      if ((!item.options || item.options.length === 0) && (item.answer || item.correctAnswer)) {
        console.log(`Found an item without options but with an answer in ${file}:`)
        console.log(item)
        return
      }
    }
  }
}
