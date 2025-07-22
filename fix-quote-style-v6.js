#!/usr/bin/env node

import fs from "fs";
import path from "path";

const files = [
  "debug-invitation.js",
  "scripts/check-database-connection.js",
  "scripts/debug-dashboard-issue.js",
  "scripts/fix-storage-policies-final.js",
  "scripts/fix-syntax-errors.js",
  "scripts/test-edge-function-env.js"
];

function replaceQuotes(content) {
  // Replace double quotes with single quotes, but be careful with template literals and escaped quotes
  return content.replace(/(?<!`|\\)("(?:[^"\\]|\\.)*")/g, (match) => {
    // Avoid replacing quotes in import/require statements or template literals
    if (match.startsWith('"import ') || match.startsWith('"require(')) {
      return match;
    }
    
    // Remove outer quotes and escape any inner single quotes
    const inner = match.slice(1, -1).replace(/'/g, "\\'");
    return `'${inner}'`;
  });
}

files.forEach(file => {
  const fullPath = path.resolve(process.cwd(), file);
  
  try {
    let content = fs.readFileSync(fullPath, "utf8");
    const newContent = replaceQuotes(content);
    
    if (content !== newContent) {
      fs.writeFileSync(fullPath, newContent, "utf8");
      console.log(`Updated quote style in ${file}`);
    }
  } catch (error) {
    console.error(`Error processing ${file}:`, error);
  }
});

console.log("Quote style fixes completed."); 