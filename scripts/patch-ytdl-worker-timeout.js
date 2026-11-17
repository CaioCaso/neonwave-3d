import fs from 'node:fs';
import path from 'node:path';

const solverPath = path.resolve('node_modules/@distube/ytdl-core/dist/solver/index.js');
const source = fs.readFileSync(solverPath, 'utf8');
const defaultTimeout = 'const CALL_DEADLINE_MS = 10_000;';
const extendedTimeout = 'const CALL_DEADLINE_MS = 60_000;';

if (source.includes(extendedTimeout)) {
  console.log('YouTube player solver timeout is already 60 seconds.');
} else if (source.includes(defaultTimeout)) {
  fs.writeFileSync(solverPath, source.replace(defaultTimeout, extendedTimeout));
  console.log('Extended the YouTube player solver timeout to 60 seconds.');
} else {
  throw new Error('Unexpected @distube/ytdl-core solver source; timeout patch was not applied.');
}
