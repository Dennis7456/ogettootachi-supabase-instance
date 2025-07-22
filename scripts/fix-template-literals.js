const fs = require("fs");
const path = require("path");

function fixTemplateLiterals(filePath) {
  try {
    let content = fs.readFileSync(filePath, "utf8");
    
    // Replace nested console.log() calls and unlogged template literals
    const complexTemplateRegex = /(\s*)(console\.log\()*`([^`]+)`\s*\);?\s*$/gm;
    const finalContent = content.replace(complexTemplateRegex, (match, indent, prefix, literal) => {
      // If it's already a console.log, ensure it's not nested
      if (prefix && prefix.match(/console\.log\(/g).length > 1) {
        return `${indent}console.log(\`${literal}\`);`;
      }
      // If it's not a console.log at all, convert to console.log
      else if (!prefix) {
        return `${indent}console.log(\`${literal}\`);`;
      }
      // If it's a single console.log, keep it as is
      return match;
    });
    
    if (content !== finalContent) {
      fs.writeFileSync(filePath, finalContent, "utf8");
      console.log(`Fixed template literals in ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

function traverseDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && file !== 'node_modules' && file !== '.git') {
      traverseDirectory(fullPath);
    } else if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.mjs')) && 
               fullPath.includes('ogetto-otachi-frontend')) {
      fixTemplateLiterals(fullPath);
    }
  });
}

// Start from the current directory
traverseDirectory(process.cwd());

console.log('Finished processing template literals.');
