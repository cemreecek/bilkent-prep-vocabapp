import * as xlsx from 'xlsx';

const workbook = xlsx.readFile('D:/Bilkent/BilkentApp/BilkentApp/Prefac/FALL SEMESTER/2024-25 PFC LEVEL WORDLIST (Updated 25.06.2024).xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet);

console.log(`Total rows: ${data.length}`);
if (data.length > 0) {
  console.log("Keys of first row:");
  console.log(Object.keys(data[0]));
  console.log("\nFirst 3 rows:");
  console.log(data.slice(0, 3));
  
  // Try to find where Set/Week data is
  console.log("\nSample row 50:");
  console.log(data[50]);
}
