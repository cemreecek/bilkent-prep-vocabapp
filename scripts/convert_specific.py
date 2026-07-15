import os
import subprocess
import sys

# Windows paths to the specific directories
dirs = [
    r"D:\Bilkent\BilkentApp\BilkentApp\Prefac\FALL SEMESTER\WORDLIST SETS & PRACTICE MATERIALS\PFC WORD LIST SETS FALL PRACTICE MATERIALS (Updated September 2024)",
    r"D:\Bilkent\BilkentApp\BilkentApp\Upper\VOCABULARY STRAND\P 1&3 VOCABULARY SETS & PRACTICE MATERIALS\PERIODS 1&3 PRACTICE MATERIALS FOR SETS"
]

markitdown_path = r"C:\Users\cecek\AppData\Roaming\Python\Python314\Scripts\markitdown.exe"

if not os.path.exists(markitdown_path):
    print(f"markitdown not found at {markitdown_path}")
    sys.exit(1)

for d in dirs:
    if not os.path.exists(d):
        print(f"Directory not found: {d}")
        continue
    
    print(f"\nProcessing directory: {d}")
    for root, _, files in os.walk(d):
        for file in files:
            # Skip temporary Word files starting with ~$
            if file.startswith("~$"):
                continue
                
            if file.endswith('.docx'):
                input_path = os.path.join(root, file)
                output_path = os.path.splitext(input_path)[0] + '.md'
                print(f"Converting {file}...")
                try:
                    subprocess.run([markitdown_path, input_path, "-o", output_path], check=True)
                except Exception as e:
                    print(f"Failed to convert {input_path}: {e}")

print("\nDone converting!")
