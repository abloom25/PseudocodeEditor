import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createExerciseHash,
  createShareHash,
  readExerciseHash,
  readShareHash,
} from '../../src/lib/share-code';

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

test('exercise links preserve teacher instructions and starter settings', async () => {
  const exercise = {
    title: 'Calculate an average',
    description: 'Read five values and output their mean.',
    syllabus: 'igcse-0478' as const,
    starterCode: 'DECLARE Total : INTEGER',
    initialFiles: {
      'scores.txt': ['10', '20', '30'],
    },
    lockSyllabus: true,
  };

  const hash = await createExerciseHash(exercise);
  assert.deepEqual(await readExerciseHash(hash), exercise);
  assert.match(hash, /^#exercise=v1\.[gu]\./);
  assert.equal(await readExerciseHash('#share=v1.i.u.invalid'), null);
});

test('exercise links require a valid title and payload', async () => {
  await assert.rejects(() =>
    createExerciseHash({
      title: '   ',
      description: '',
      syllabus: 'igcse-0478',
      starterCode: '',
      initialFiles: {},
      lockSyllabus: false,
    }),
  );
  await assert.rejects(() => readExerciseHash('#exercise=v1.u.invalid'));
});

test('exercise payload treats HTML as text and rejects dangerous file keys', async () => {
  const maliciousText = '<img src=x onerror="globalThis.pwned=true"><script>alert(1)</script>';
  const hash = await createExerciseHash({
    title: maliciousText,
    description: maliciousText,
    syllabus: 'alevel-9618',
    starterCode: `OUTPUT "${maliciousText}"`,
    initialFiles: { 'safe.txt': [maliciousText] },
    lockSyllabus: true,
  });
  const decoded = await readExerciseHash(hash);
  assert.equal(decoded?.title, maliciousText);
  assert.equal(decoded?.initialFiles['safe.txt'][0], maliciousText);
  assert.equal(({} as Record<string, unknown>).pwned, undefined);

  const dangerousFiles = Object.create(null) as Record<string, string[]>;
  dangerousFiles.__proto__ = ['polluted'];
  await assert.rejects(() =>
    createExerciseHash({
      title: 'Unsafe',
      description: '',
      syllabus: 'igcse-0478',
      starterCode: '',
      initialFiles: dangerousFiles,
      lockSyllabus: false,
    }),
  );
  await assert.rejects(() =>
    createExerciseHash({
      title: 'Traversal',
      description: '',
      syllabus: 'igcse-0478',
      starterCode: '',
      initialFiles: { '../secret.txt': ['x'] },
      lockSyllabus: false,
    }),
  );
});

test('exercise links reject compressed payloads that expand beyond the decode limit', async () => {
  const oversizedPayload = new TextEncoder().encode('A'.repeat(1_200_001));
  const compressedStream = new Blob([oversizedPayload])
    .stream()
    .pipeThrough(new CompressionStream('gzip'));
  const compressed = new Uint8Array(
    await new Response(compressedStream).arrayBuffer(),
  );
  const encoded = Buffer.from(compressed).toString('base64url');

  await assert.rejects(
    () => readExerciseHash(`#exercise=v1.g.${encoded}`),
    /too large/i,
  );
});
