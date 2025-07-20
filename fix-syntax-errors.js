function fixSyntaxErrors(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    // Remove trailing commas and semicolons
    content = content.replace(/,;/g, ',');
    content = content.replace(/,\s*\);/g, ');');
    content = content.replace(/,\s*$/gm, '');
    // Remove extra semicolons after function calls or method chains
    content = content.replace(/\);,;/g, ');');
    content = content.replace(/\);;\s*$/gm, ');');
    // Remove standalone semicolons or commas
    content = content.replace(/^\s*[,;]\s*$/gm, '');
    // Fix common syntax errors in configuration and function calls
    content = content.replace(/config\.[^\n]+,\s*;/gm, '');
    content = content.replace(/config\.[^\n]+,\s*\n/gm, '\n');
    // Remove empty lines between configuration and next statement
    content = content.replace(
      /(\s*config\.[^\n]+)\n\s*\n\s*(try|const|async|class)/gm,
      '$1\n$2'
    );
    // Ensure proper line breaks and semicolons
    content = content.replace(
      /(\s*config\.[^\n]+)\n\s*try\s*{/gm,
      '$1;\n  try {'
    );
    content = content.replace(
      /(\s*config\.[^\n]+)\n\s*const\s+/gm,
      '$1;\n  const '
    );
    content = content.replace(
      /(\s*config\.[^\n]+)\n\s*async\s+function/gm,
      '$1;\n  async function'
    );
    content = content.replace(
      /(\s*config\.[^\n]+)\n\s*class/gm,
      '$1;\n  class'
    );
    // Remove trailing commas in function calls
    content = content.replace(/,\s*\)/g, ')');
    fs.writeFileSync(filePath, content, 'utf8');
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}
function traverseDirectory(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (
      stat.isDirectory() &&
      !fullPath.includes('node_modules') &&
      !fullPath.includes('.git')
    ) {
      traverseDirectory(fullPath);
    } else if (file.endsWith('.js') && !file.includes('fix-syntax-errors.js')) {
      fixSyntaxErrors(fullPath);
    }
  });
}
// Start from the current directory
traverseDirectory(process.cwd());
