import os
import glob
import json
import win32com.client
import docx

def get_word():
    word = win32com.client.Dispatch("Word.Application")
    word.Visible = False
    return word

def doc_to_docx(word, doc_path):
    docx_path = doc_path + "x"
    if not os.path.exists(docx_path):
        print(f"  -> Converting {os.path.basename(doc_path)}...")
        try:
            doc = word.Documents.Open(doc_path)
            doc.SaveAs2(docx_path, FileFormat=16)
            doc.Close()
        except Exception as e:
            print(f"  -> Failed to convert {doc_path}: {e}")
            return None
    return docx_path

def parse_wordlist(docx_path):
    flashcards = []
    try:
        doc = docx.Document(docx_path)
        # Highly simplistic heuristic: grab anything that looks like a word from a table
        for table in doc.tables:
            for row in table.rows:
                word_text = row.cells[0].text.strip()
                if word_text and len(word_text.split()) < 4 and not word_text.upper().startswith("SET"):
                    flashcards.append({
                        "id": word_text.lower().replace('/', '_'),
                        "word": word_text,
                        "definition": "Manual touch-up needed"
                    })
    except Exception as e:
        pass
    return flashcards

def extract_level(word, level, level_dir):
    print(f"--- Extracting {level} ---")
    
    wordlists = []
    practices = []
    
    # Collect all doc/docx files
    all_files = []
    for root, dirs, files in os.walk(level_dir):
        for file in files:
            if file.endswith('.doc') or file.endswith('.docx'):
                if 'wordlist' in file.lower() or 'vocab' in file.lower():
                    all_files.append(os.path.join(root, file))

    sets_data = []
    count = 1
    
    for fpath in all_files:
        # Convert if doc
        target_docx = fpath
        if fpath.endswith('.doc'):
            target_docx = doc_to_docx(word, fpath)
            
        if target_docx and os.path.exists(target_docx):
            print(f"  -> Parsing {os.path.basename(target_docx)}")
            cards = parse_wordlist(target_docx)
            if cards:
                sets_data.append({
                    "id": f"{level.lower()}-set-{count}",
                    "level": level.lower(),
                    "title": os.path.basename(fpath).replace('.docx', '').replace('.doc', ''),
                    "flashcards": cards,
                    "practices": [{"id": f"practice-{count}", "type": "manual", "title": "Auto-extracted practices need manual mapping", "content": "Manual extraction needed"}]
                })
                count += 1
                
    # Save level output
    out_file = fr"d:\Bilkent\BilkentApp\BilkentApp\app\public\data\vocabulary_{level.lower()}.json"
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump({"sets": sets_data}, f, indent=2)

def main():
    levels = ['Elementary', 'Intermediate', 'Pin', 'Upper']
    base_dir = r"d:\Bilkent\BilkentApp\BilkentApp"
    
    word = get_word()
    try:
        for level in levels:
            level_dir = os.path.join(base_dir, level)
            extract_level(word, level, level_dir)
    finally:
        word.Quit()
        
    print("Done extracting all levels!")

if __name__ == "__main__":
    main()
