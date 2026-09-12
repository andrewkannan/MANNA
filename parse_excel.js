import xlsx from 'xlsx';
import fs from 'fs';

try {
  const workbook = xlsx.readFile('./Bible_Verse_Markups.xlsx');
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet);

  const parsedData = data.map((row: any) => {
    // We assume columns like Book, Chapter, Verse, Text, etc. 
    // We'll log the first row to see the structure if needed.
    return row;
  });

  fs.writeFileSync('./src/db/raw_excel_data.json', JSON.stringify(parsedData, null, 2));
  console.log('Successfully extracted raw data. Check src/db/raw_excel_data.json to see the structure.');
} catch (e) {
  console.error('Error parsing excel:', e);
}
