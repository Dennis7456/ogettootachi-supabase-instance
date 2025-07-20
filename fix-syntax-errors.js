function fixSyntaxErrors(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    // Normalize line breaks and whitespace
    content = content.replace(/\r\n/g, '\n');
    content = content.replace(/\n{3,}/g, '\n\n');
    // Comprehensive syntax fixes with multiple passes
    const syntaxFixes = [
      // Add missing commas in object literals and configurations
      [/(\w+):\s*([^,\n]+)(\n\s*\w+:)/gm, '$1: $2,$3'],
      [/(\w+):\s*([^,\n]+)(\n\s*\})/gm, '$1: $2,$3'],
      [/(\w+):\s*([^,\n]+)(\n\s*\))/gm, '$1: $2,$3'],
      // Remove extra semicolons and trailing commas
      [/,\s*;/g, ''],
      [/;\s*,/g, ''],
      [/,\s*\);/g, ')'],
      [/\);\s*,/g, ')'],
      // Remove standalone commas and semicolons
      [/^\s*[,;]\s*$/gm, ''],
      // Remove extra commas and semicolons in function calls and object definitions
      [/,\s*\)/g, ')'],
      [/\(\s*,/g, '('],
      [/{\s*,/g, '{'],
      [/,\s*}/g, '}'],
      // Fix syntax errors with misplaced colons and commas
      [/(\w+):\s*,/g, '$1:'],
      [/,\s*:/g, ':'],
      // Remove extra semicolons after function calls or method chains
      [/\);\s*;/g, ')'],
      [/\);\s*$/gm, ')'],
      // Remove empty lines between configuration properties
      [/(\s*\w+:\s*[^,\n]+),\n\s*\n\s*(\w+:)/gm, '$1,\n$2'],
      // Ensure proper line breaks and semicolons
      [/(\s*config\.[^\n]+)\n\s*try\s*{/gm, '$1;\n  try {'],
      [/(\s*config\.[^\n]+)\n\s*const\s+/gm, '$1;\n  const '],
      [/(\s*config\.[^\n]+)\n\s*async\s+function/gm, '$1;\n  async function'],
      [/(\s*config\.[^\n]+)\n\s*class/gm, '$1;\n  class'],
      // Remove extra commas in function parameters and method calls
      [/,\s*\)/g, ')'],
      [/\(\s*,/g, '('],
      // Remove trailing commas in object literals and arrays
      [/,\s*}/g, '}'],
      [/,\s*\]/g, ']'],
      // Remove extra semicolons and commas in configuration objects
      [/:\s*,/g, ':'],
      [/,\s*,/g, ','],
      // Fix syntax errors with misplaced commas in function calls and object definitions
      [/(\w+):\s*,/g, '$1:'],
      [/,\s*:/g, ':'],
      // Add missing commas in function calls and object definitions
      [/(\w+):\s*([^,\n]+)(\n\s*\w+:)/gm, '$1: $2,$3'],
      // Remove extra semicolons at the end of lines
      [/;\s*$/gm, ''],
      // Ensure proper object and function call syntax
      [/(\w+):\s*([^,\n]+)(\n\s*\})/gm, '$1: $2,$3'],
      [/(\w+):\s*([^,\n]+)(\n\s*\))/gm, '$1: $2,$3'],
      // Fix missing commas in function parameters
      [/(\w+)\s*(\w+)(\n\s*\w+:)/gm, '$1 $2,$3'],
      // Remove multiple consecutive semicolons
      [/;{2,}/g, ';'],
      // Fix object and configuration syntax with missing commas
      [/(\w+):\s*['"`][^'"]*['"`](\n\s*\w+:)/gm, '$1: $2,'],
      [/(\w+):\s*[^,\n]+(\n\s*\w+:)/gm, '$1: $2,'],
      // Remove extra commas in object literals
      [/,\s*}/g, '}'],
      [/,\s*\]/g, ']'],
      // Fix missing commas in function calls and object definitions
      [/(\w+):\s*([^,\n]+)(\n\s*\w+:)/gm, '$1: $2,$3'],
      // Remove extra semicolons and commas
      [/,\s*;/g, ''],
      [/;\s*,/g, ''],
      [/,\s*,/g, ','],
      // Ensure proper line breaks and syntax
      [/(\w+):\s*([^,\n]+)(\n\s*\})/gm, '$1: $2,$3'],
      [/(\w+):\s*([^,\n]+)(\n\s*\))/gm, '$1: $2,$3'],
      // Additional fixes for specific syntax patterns
      [/\benv:\s*{,/g, 'env: {'],
      [/\btest:\s*{,/g, 'test: {'],
      [/\bauth:\s*{,/g, 'auth: {'],
      [/\bbody:\s*{,/g, 'body: {'],
      [/\boptions:\s*{,/g, 'options: {'],
      // Fix missing commas in object literals and function calls
      [/(\w+):\s*([^,\n]+)(\n\s*\w+:)/gm, '$1: $2,$3'],
      [/(\w+):\s*([^,\n]+)(\n\s*\})/gm, '$1: $2,$3'],
      [/(\w+):\s*([^,\n]+)(\n\s*\))/gm, '$1: $2,$3'],
      // Remove extra commas and semicolons
      [/,\s*}/g, '}'],
      [/,\s*\]/g, ']'],
      [/;\s*$/gm, ''],
      // Fix syntax errors with missing commas in function parameters
      [/(\w+)\s*(\w+)(\n\s*\w+:)/gm, '$1 $2,$3'],
    ];
    // Apply syntax fixes multiple times to handle complex cases
    for (let i = 0; i < 3; i++) {
      syntaxFixes.forEach(([regex, replacement]) => {
        content = content.replace(regex, replacement);
      });
    }
    // Special handling for specific syntax errors
    content = content.replace(/\benv:\s*{,/g, 'env: {');
    content = content.replace(/\btest:\s*{,/g, 'test: {');
    content = content.replace(/\bauth:\s*{,/g, 'auth: {');
    content = content.replace(/\bbody:\s*{,/g, 'body: {');
    content = content.replace(/\boptions:\s*{,/g, 'options: {');
    // Ensure proper object and function call syntax
    content = content.replace(/(\w+):\s*([^,\n]+)(\n\s*\})/gm, '$1: $2,$3');
    content = content.replace(/(\w+):\s*([^,\n]+)(\n\s*\))/gm, '$1: $2,$3');
    // Remove extra commas and semicolons
    content = content.replace(/,\s*}/g, '}');
    content = content.replace(/,\s*\]/g, ']');
    content = content.replace(/;\s*$/gm, '');
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
