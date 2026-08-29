import assert from 'node:assert/strict';
import { collectPaginatedRows } from '../lib/credentials/pagination.ts';

const source = Array.from({ length: 1740 }, (_value, index) => ({ id: index + 1 }));
const requestedRanges = [];
const rows = await collectPaginatedRows(async (from, to) => {
  requestedRanges.push([from, to]);
  return source.slice(from, to + 1);
});

assert.equal(rows.length, 1740);
assert.deepEqual(rows, source);
assert.deepEqual(requestedRanges, [[0, 999], [1000, 1999]]);

await assert.rejects(
  () => collectPaginatedRows(async () => [], 0),
  /positive safe integer/,
);

console.log('PDFGEN-008 cohort pagination test passed for 1740 rows across the 1000-row boundary.');
