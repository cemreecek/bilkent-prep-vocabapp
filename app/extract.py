import zipfile
import xml.etree.ElementTree as ET

def extract_text(docx_path):
    with zipfile.ZipFile(docx_path) as docx:
        xml_content = docx.read('word/document.xml')
        tree = ET.XML(xml_content)
        texts = [node.text for node in tree.iter() if node.tag.endswith('t') and node.text]
        return '\n'.join(texts)

print(extract_text('d:/Bilkent/BilkentApp/BilkentApp/Upper/VOCABULARY STRAND/P 1&3 VOCABULARY SETS & PRACTICE MATERIALS/PERIODS 1&3 VOCABULARY SETS/Upper Intermediate Periods 1-3 Vocabulary Set 8.docx'))
