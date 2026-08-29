export async function collectChunkedRows<TValue, TRow>(
  values: readonly TValue[],
  fetchChunk: (chunk: readonly TValue[]) => Promise<readonly TRow[]>,
  chunkSize = 100,
): Promise<TRow[]> {
  if (!Number.isSafeInteger(chunkSize) || chunkSize < 1) {
    throw new Error('Chunk size must be a positive safe integer.');
  }

  const rows: TRow[] = [];
  for (let index = 0; index < values.length; index += chunkSize) {
    rows.push(...await fetchChunk(values.slice(index, index + chunkSize)));
  }
  return rows;
}
