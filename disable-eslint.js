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

function removeDisableComments(content) {
  // Remove ESLint disable comments
  return content
    .replace(/^\/\*\s*eslint-disable\s*\*\/\n/gm, '')
    .replace(/\/\*\s*eslint-disable\s*quotes\s*\*\/\n/gm, '');
}

files.forEach(file => {
  const fullPath = path.resolve(process.cwd(), file);
  
  try {
    let content = fs.readFileSync(fullPath, "utf8");
    const newContent = removeDisableComments(content);
    
    if (content !== newContent) {
      fs.writeFileSync(fullPath, newContent, "utf8");
      console.log(`Removed ESLint disable comments from ${file}`);
    }
  } catch (error) {
    console.error(`Error processing ${file}:`, error);
  }
});

console.log("ESLint disable comments removal completed."); 