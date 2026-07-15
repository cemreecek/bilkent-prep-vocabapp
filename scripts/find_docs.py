import os
import glob

def find_docs():
    levels = ['Elementary', 'Intermediate', 'Pin', 'Upper']
    base_dir = r"d:\Bilkent\BilkentApp\BilkentApp"
    
    for level in levels:
        print(f"--- {level} ---")
        level_dir = os.path.join(base_dir, level)
        for root, dirs, files in os.walk(level_dir):
            for file in files:
                if file.endswith('.doc') or file.endswith('.docx'):
                    # filter out the big syllabus docs we saw earlier
                    if 'wordlist' in file.lower() or 'practice' in file.lower() or 'vocab' in file.lower() or 'task' in file.lower():
                        rel_path = os.path.relpath(os.path.join(root, file), level_dir)
                        print(rel_path)

if __name__ == "__main__":
    find_docs()
