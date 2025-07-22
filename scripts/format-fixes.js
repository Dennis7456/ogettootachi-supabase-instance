/* eslint-disable no-console, no-undef */
import fs from 'fs';
import path from 'path';

function fixCommas(_content) {
  // Fix missing commas in object definitions
  _content = _content.replace(/(\w+):\s*([^,\n]+)(\n\s*\w+:)/g, '$1: $2,$3');

  // Fix missing commas in arrays
  _content = _content.replace(/(\w+)\s*(\n\s*\w+)/g, '$1,$2');

  // Fix _createClient calls
  _content = _content.replace(
    /(_createClient\(\s*\w+\.\w+)\s*(\w+\.\w+\s*\))/g,
    '$1, $2'
  );

  return _content;
}

function processDirectory(_dir) {
  const _files = fs.readdirSync(_dir);

  _files.forEach((_file) => {
    const _fullPath = path.join(_dir, _file);
    const _stat = fs.statSync(_fullPath);

    if (_stat.isDirectory()) {
      processDirectory(_fullPath);
    } else if (_file.endsWith('.js')) {
      try {
        let _content = fs.readFileSync(_fullPath, 'utf8');
        const _fixedContent = fixCommas(_content);

        if (_content !== _fixedContent) {
          fs.writeFileSync(_fullPath, _fixedContent);
          console.log(`Formatted: ${_fullPath}`);
        }
      } catch (_error) {
        console.error(`Error processing ${_fullPath}:`, _error);
      }
    }
  });
}

// Run the script on the current directory
processDirectory(process.cwd());
