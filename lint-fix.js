function findJSFiles(dir, excludeDirs = ['node_modules', '.git', 'dist', 'build']) {
  const jsFiles = [];
  
  function traverse(currentPath) {
    const items = fs.readdirSync(currentPath);
    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        // Skip excluded directories
        if (excludeDirs.includes(item)) continue;
        
        // Recursively search subdirectories
        traverse(fullPath);
      } else if (item.endsWith('.js') || item.endsWith('.jsx')) {
        jsFiles.push(fullPath);
      }
    }
  }
  traverse(dir);
  return jsFiles;
}
function runESLint(files) {
  return new Promise((resolve, reject) => {
    const eslintProcess = spawn('npx', [
      'eslint', 
      ...files, 
      '--fix', 
      '--max-warnings', '0', 
      '--ext', '.js,.jsx'
    ], {
      stdio: 'inherit',
      shell: true
    });
    eslintProcess.on('close', (code) => {
      if (code === 0) {
        resolve(0);
      } else {
        console.error(`❌ Linting found ${code} issue(s)`);
        reject(code);
      }
    });
    eslintProcess.on('error', (err) => {
      console.error('Failed to run ESLint:', err);
      reject(err);
    });
  });
}
async function main() {
  try {
    const baseDir = process.cwd();
    const jsFiles = findJSFiles(baseDir);
    
    if (jsFiles.length === 0) {
      return 0;
    }
    
    // Chunk files to avoid command line length limits
    const chunkSize = 50;
    for (let i = 0; i < jsFiles.length; i += chunkSize) {
      const chunk = jsFiles.slice(i, i + chunkSize);
      await runESLint(chunk);
    }
    return 0;
  } catch (error) {
    console.error('Unexpected error:', error);
    return 1;
  }
}
main().then(process.exit).catch(process.exit); 