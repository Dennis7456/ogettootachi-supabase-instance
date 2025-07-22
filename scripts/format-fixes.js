const fs = require('fs');
const path = require('path');
function fixCommas(content) {
  // Fix missing commas in object definitions
  content = content.replace(/(\w+):\s*([^,\n]+)(\n\s*\w+:)/g, '$1: $2,$3');
  // Fix missing commas in arrays
  content = content.replace(/(\w+)\s*(\n\s*\w+)/g, '$1,$2');
  // Fix _createClient calls
  content = content.replace(
    /(_createClient\(\s*\w+\.\w+)\s*(\w+\.\w+\s*\))/g,
    '$1, $2'
  );
  return content;
}
function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.js')) {
      try {
        let content = fs.readFileSync(fullPath, 'utf8');
        const fixedContent = fixCommas(content);
        if (content !== fixedContent) {
          fs.writeFileSync(fullPath, fixedContent);
        }
      } catch (error) {
        console.error(`Error processing ${fullPath}:`, error);
      }
    }
  });
}
// Run the script on the current directory
processDirectory(process.cwd());
