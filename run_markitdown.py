import os
import subprocess

pdf_path = r"D:\Bilkent\BilkentApp\BilkentApp\somefeedbackfromthetesters\knowcity test.pdf"
md_path = r"D:\Bilkent\BilkentApp\BilkentApp\somefeedbackfromthetesters\knowcity_test.md"

subprocess.run([
    r"C:\Users\cecek\AppData\Roaming\Python\Python314\Scripts\markitdown.exe", 
    pdf_path, 
    "-o", 
    md_path
], check=True)
