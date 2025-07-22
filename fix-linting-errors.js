/* eslint-disable no-console, no-undef */
import fs from 'fs';
import path from 'path';

const regex = /\s*\/\/.*$/gm;

function findJSFiles(dir) {
  const files = fs.readdirSync(dir);
  const jsFiles = [];

  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      jsFiles.push(...findJSFiles(fullPath));
    } else if (file.endsWith('.js')) {
      jsFiles.push(fullPath);
    }
  });

  return jsFiles;
}

function fixLintingErrors(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Remove trailing comments
    const cleanedContent = content.replace(regex, '');

    fs.writeFileSync(filePath, cleanedContent);
    console.log(`Fixed linting errors in ${filePath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

function main() {
  const startDir = process.cwd();
  const jsFiles = findJSFiles(startDir);

  jsFiles.forEach(fixLintingErrors);
}

main();
