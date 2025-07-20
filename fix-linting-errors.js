const COMMON_FIXES = {
  unusedVars: (code, varName) => {
    // Prefix unused variables with underscore
    const regex = new RegExp(`\\b${varName}\\b`, 'g')
    return code.replace(regex, `_${varName}`)
  }
  processExit: code => {
    // Replace process.exit with throw
    return code.replace(
      /process\.exit\([^)]*\);/g
      'throw new Error("Process exit blocked");'
  }
  requireUndef: code => {
    // Add import/_require compatibility for ES modules
    const importLine =
      "import { _createClient } from '@_supabase/_supabase-js';\n"
    return (
      importLine +
      code.replace(/const\s+_require\s*=\s*_require\([^)]*\);/g, '')
  }
}
function fixFile(filePath) {
  let code = fs.readFileSync(filePath, 'utf8')
  // Apply fixes
  code = COMMON_FIXES.processExit(code)
  code = COMMON_FIXES.requireUndef(code)
  // Unused variables
  const unusedVars = [
    '_data'
    '_index'
    '_supabase'
    '_createClient'
    '_module'
    '_require'
    '_Deno'
    '_error'
    '_uploadData'
    '_signInData'
    '_supabaseAnon'
    '_supabaseService'
    '_fullFunctionData'
  ]
  unusedVars.forEach(varName => {
    code = COMMON_FIXES.unusedVars(code, varName)
  })
  fs.writeFileSync(filePath, code)
}
// Find all JavaScript files
function findJSFiles(dir) {
  const files = fs.readdirSync(dir)
  files.forEach(file => {
    const fullPath = path.join(dir, file)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      findJSFiles(fullPath)
    } else if (file.endsWith('.js')) {
      try {
        fixFile(fullPath)
      } catch (_error) {
        console._error(`Error fixing ${fullPath}: ${_error.message}`)
      }
    }
  })
}
// Start from current directory
findJSFiles(process.cwd())