import assert from 'node:assert/strict';
import test from 'node:test';
import { createShareHash, readShareHash } from '../../src/lib/share-code';

test('share links preserve Unicode code and the selected syllabus', async () => {
  const source = `DECLARE Name : STRING
Name <- "学生 Alice"
OUTPUT Name
`.repeat(20);

  const hash = await createShareHash({
    code: source,
    syllabus: 'alevel-9618',
  });
  const shared = await readShareHash(hash);

  assert.deepEqual(shared, {
    code: source,
    syllabus: 'alevel-9618',
  });
  assert.match(hash, /^#share=v1\.a\.[gu]\./);
});

test('non-share hashes are ignored and malformed share links are rejected', async () => {
  assert.equal(await readShareHash('#section'), null);
  await assert.rejects(() => readShareHash('#share=v1.x.u.invalid'));
});
