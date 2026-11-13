import assert from 'node:assert/strict';
import {formatColumnDate} from '../scripts/columns/column-date.mjs';
const cases=[['2026-11-10T15:00:00+00:00','2026-11-11'],['2026-11-09T15:00:00Z','2026-11-10'],['2026-11-11','2026-11-11'],['2026-11-11T00:00:00+09:00','2026-11-11'],['2026-12-31T15:00:00Z','2027-01-01'],['',''],[null,''],['invalid','']];
for(const [input,expected] of cases)assert.equal(formatColumnDate(input),expected);
console.log('Date tests passed:',cases.length,'timezone',process.env.TZ);
