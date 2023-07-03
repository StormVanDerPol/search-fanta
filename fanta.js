import fs from 'node:fs';
import path from 'node:path';

import { FuzzySearcher } from './parseFanta.js';

const input = process.argv[2] || 'Zelda twilight princess';

function sanitize(word) {
  return word
    .trim()
    .toLowerCase()
    .replace('the ', '')
    .replace(/[*"!.:?/-]/g, '');
}

const fuz = new FuzzySearcher(...fs.readFileSync(path.resolve(process.cwd(), 'sample.txt')).toString().split('\n').map(sanitize));

const result = fuz.compare(sanitize(input), 0);

console.log(input);
console.table(fuz.vocabulary);
console.table(result);
