import docx

def inspect_docx(docx_path):
    print(f"Inspecting tables in {docx_path}...")
    doc = docx.Document(docx_path)
    
    for i, table in enumerate(doc.tables):
        print(f"--- Table {i} ---")
        for j, row in enumerate(table.rows[:5]): # first 5 rows
            row_data = [cell.text.strip().replace('\n', ' ') for cell in row.cells]
            print(f"Row {j}: {row_data}")
        if len(table.rows) > 5:
            print(f"... and {len(table.rows) - 5} more rows")

if __name__ == "__main__":
    test_docx = r"d:\Bilkent\BilkentApp\BilkentApp\Prefac\WORDLIST SETS & VOCABULARY STRAND\PFC LEVEL SPRING WORDLIST SETS (Updated June 2025)\PFC Spring Semester Wordlist- Set 1.docx"
    try:
        inspect_docx(test_docx)
    except Exception as e:
        print(f"Error: {e}")
