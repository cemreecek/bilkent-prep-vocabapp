import os
import subprocess
import glob

dirs = [r"d:\Bilkent\BilkentApp\BilkentApp\Upper", r"d:\Bilkent\BilkentApp\BilkentApp\PreFac"]

markitdown_path = r"C:\Users\cecek\AppData\Roaming\Python\Python314\Scripts\markitdown.exe"

for d in dirs:
    if not os.path.exists(d): continue
    for root, _, files in os.walk(d):
        for file in files:
            if file.endswith('.pdf') or file.endswith('.docx'):
                input_path = os.path.join(root, file)
                output_path = os.path.splitext(input_path)[0] + '.md'
                print(f"Converting {file}...")
                try:
                    subprocess.run([markitdown_path, input_path, "-o", output_path], check=True)
                except Exception as e:
                    print(f"Failed to convert {input_path}: {e}")
