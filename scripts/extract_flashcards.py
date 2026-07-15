import docx
import json

def extract_set1():
    wordlist_doc = r"d:\Bilkent\BilkentApp\BilkentApp\Prefac\WORDLIST SETS & VOCABULARY STRAND\PFC LEVEL SPRING WORDLIST SETS (Updated June 2025)\PFC Spring Semester Wordlist- Set 1.docx"
    doc = docx.Document(wordlist_doc)
    
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    flashcards = []
    
    for i, table in enumerate(doc.tables):
        if i >= len(days):
            break
        day = days[i]
        for row in table.rows:
            word = row.cells[0].text.strip()
            if word:
                flashcards.append({
                    "id": word.lower(),
                    "day": day,
                    "word": word,
                    "definition": "", # Need definition
                })
    
    with open('flashcards_raw.json', 'w', encoding='utf-8') as f:
        json.dump(flashcards, f, indent=2)

if __name__ == "__main__":
    extract_set1()
