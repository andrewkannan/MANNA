const fs = require('fs');

async function fetchVerses() {
  const data = JSON.parse(fs.readFileSync('./src/db/raw_excel_data.json', 'utf8'));
  const finalData = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const reference = row['Bible Reference'];
    console.log(`Fetching ${i + 1}/${data.length}: ${reference}`);
    
    try {
      const response = await fetch(`https://bible-api.com/${encodeURIComponent(reference)}?translation=kjv`);
      if (!response.ok) {
        console.error(`Failed to fetch ${reference}: ${response.statusText}`);
        finalData.push({ ...row, Text: "Failed to load text. Please check connection or reference." });
        continue;
      }
      const result = await response.json();
      finalData.push({
        ...row,
        Text: result.text.trim()
      });
    } catch (e) {
      console.error(`Error fetching ${reference}:`, e);
      finalData.push({ ...row, Text: "Failed to load text." });
    }
    
    // Simple delay to avoid rate limiting
    await new Promise(res => setTimeout(res, 200));
  }

  fs.writeFileSync('./src/db/seed.json', JSON.stringify(finalData, null, 2));
  console.log('Finished generating seed.json');
}

fetchVerses();
