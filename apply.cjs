const fs = require('fs');

function applyWrapper(file) {
  let c = fs.readFileSync(file, 'utf8');
  if (c.includes('PageWrapper')) return;
  c = "import { PageWrapper } from '../components/animations/PageWrapper';\n" + c;
  
  c = c.replace(/<div className="min-h-full([^>]*)">/, '<PageWrapper className="min-h-full$1">');
  
  // Find the last </div>
  const lastDivIndex = c.lastIndexOf('</div>');
  if (lastDivIndex !== -1) {
    c = c.substring(0, lastDivIndex) + '</PageWrapper>' + c.substring(lastDivIndex + 6);
  }
  
  fs.writeFileSync(file, c);
}

applyWrapper('src/pages/Settings.tsx');
applyWrapper('src/pages/Progress.tsx');
applyWrapper('src/pages/DisplayControl.tsx');
applyWrapper('src/pages/VerseDetail.tsx');
applyWrapper('src/pages/Home.tsx');
