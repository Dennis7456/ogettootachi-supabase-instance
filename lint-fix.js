/* eslint-disable no-console, no-undef, no-unused-vars */
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

function findJSFiles(
  _dir,
  _excludeDirs = ['node_modules', '.git', 'dist', 'build']
) {
  const _jsFiles = [];

  function traverse(_currentPath) {
    const _items = fs.readdirSync(_currentPath);

    for (const _item of _items) {
      const _fullPath = path.join(_currentPath, _item);
      const _stat = fs.statSync(_fullPath);

      if (_stat.isDirectory()) {
        // Skip excluded directories
        if (_excludeDirs.includes(_item)) continue;

        // Recursively search subdirectories
        traverse(_fullPath);
      } else if (_item.endsWith('.js') || _item.endsWith('.jsx')) {
        _jsFiles.push(_fullPath);
      }
    }
  }

  traverse(_dir);
  return _jsFiles;
}

function runESLint(_files) {
  return new Promise((_resolve, _reject) => {
    const _eslintProcess = spawn(
      'npx',
      [
        'eslint',
        ..._files,
        '--fix',
        '--max-warnings',
        '0',
        '--ext',
        '.js,.jsx',
      ],
      {
        stdio: 'inherit',
        shell: true,
      }
    );

    _eslintProcess.on('close', _code => {
      if (_code === 0) {
        _resolve(0);
      } else {
        _reject(_code);
      }
    });

    _eslintProcess.on('error', _err => {
      console.error('Failed to run ESLint:', _err);
      _reject(_err);
    });
  });
}

async function main() {
  try {
    const _baseDir = process.cwd();
    const _jsFiles = findJSFiles(_baseDir);

    if (_jsFiles.length === 0) {
      console.log('No JavaScript files found to lint.');
      return 0;
    }

    // Chunk files to avoid command line length limits
    const _chunkSize = 50;

    for (let _i = 0; _i < _jsFiles.length; _i += _chunkSize) {
      const _chunk = _jsFiles.slice(_i, _i + _chunkSize);
      await runESLint(_chunk);
    }

    console.log('ESLint auto-fix completed successfully.');
    return 0;
  } catch (_error) {
    console.error('Unexpected error during ESLint auto-fix:', _error);
    return 1;
  }
}

main().then(process.exit).catch(process.exit);
