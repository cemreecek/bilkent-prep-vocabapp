import os
import sys
import win32com.client
import docx

def doc_to_docx(doc_path):
    word = win32com.client.Dispatch("Word.Application")
    word.Visible = False
    
    # Save as docx
    docx_path = doc_path + "x"
    if not os.path.exists(docx_path):
        print(f"Converting {doc_path} to {docx_path}...")
        doc = word.Documents.Open(doc_path)
        # 16 represents wdFormatDocumentDefault (docx)
        doc.SaveAs2(docx_path, FileFormat=16)
        doc.Close()
    else:
        print(f"{docx_path} already exists.")
        
    word.Quit()
    return docx_path

def inspect_docx(docx_path):
    print(f"Inspecting {docx_path}...")
    doc = docx.Document(docx_path)
    for i, p in enumerate(doc.paragraphs[:50]): # print first 50 paragraphs
        text = p.text.strip()
        if text:
            print(f"P{i}: {text}")

if __name__ == "__main__":
    test_doc = r"d:\Bilkent\BilkentApp\BilkentApp\Prefac\WORDLIST SETS & VOCABULARY STRAND\PFC LEVEL SPRING WORDLIST SETS (Updated June 2025)\PFC Spring Semester Wordlist- Set 1.doc"
    try:
        docx_path = doc_to_docx(test_doc)
        inspect_docx(docx_path)
    except Exception as e:
        print(f"Error: {e}")
