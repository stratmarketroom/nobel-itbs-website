import assert from 'node:assert/strict';
import { collectChunkedRows } from '../lib/credentials/chunking.ts';

for (const size of [540, 1000]) {
  const source = Array.from({ length: size }, (_value, index) => `id-${index + 1}`);
  const observedChunks = [];
  const rows = await collectChunkedRows(source, async (chunk) => {
    observedChunks.push([...chunk]);
    return chunk.map((id) => ({ id }));
  });

  assert.equal(rows.length, size);
  assert.deepEqual(rows.map((row) => row.id), source);
  assert.ok(observedChunks.every((chunk) => chunk.length <= 100));
  assert.equal(observedChunks.length, Math.ceil(size / 100));
}

let emptyCalls = 0;
assert.deepEqual(await collectChunkedRows([], async () => { emptyCalls += 1; return []; }), []);
assert.equal(emptyCalls, 0);
await assert.rejects(() => collectChunkedRows(['id'], async () => [], 0), /positive safe integer/);

console.log('PDFGEN-008 batch detail chunking test passed for 540 and 1000 IDs.');
