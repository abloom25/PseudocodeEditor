import assert from 'node:assert/strict';
import test from 'node:test';

import { ALevelParser } from '../../src/lib/pseudocode/alevel-parser';
import { PseudocodeParser } from '../../src/lib/pseudocode/parser';

const aLevelProgram = `
FUNCTION CalculateGrade(Score : INTEGER) RETURNS CHAR
  IF Score >= 80 THEN
    RETURN 'A'
  ELSE
    RETURN 'F'
  ENDIF
ENDFUNCTION

PROCEDURE ShowGrade(Score : INTEGER)
  OUTPUT CalculateGrade(Score)
ENDPROCEDURE

CALL ShowGrade(80)
`;

test('A-Level parser can run the same functions and procedures repeatedly', async () => {
  const parser = new ALevelParser();

  assert.deepEqual(await parser.run(aLevelProgram), ['A']);
  assert.deepEqual(await parser.run(aLevelProgram), ['A']);
});

test('A-Level parser discards declarations left by a failed run', async () => {
  const parser = new ALevelParser();
  const failingProgram = `
FUNCTION Value() RETURNS INTEGER
  RETURN 1
ENDFUNCTION
OUTPUT MissingName
`;
  const validProgram = `
FUNCTION Value() RETURNS INTEGER
  RETURN 2
ENDFUNCTION
OUTPUT Value()
`;

  await assert.rejects(parser.run(failingProgram), /not declared|undefined/i);
  assert.deepEqual(await parser.run(validProgram), ['2']);
});

test('runtime reset preserves virtual files while resetting open-file state', async () => {
  const parser = new ALevelParser();
  parser.setFileContent('Students.txt', ['S001', 'Alice', '80']);

  const readProgram = `
DECLARE StudentID : STRING
OPENFILE "Students.txt" FOR READ
READFILE "Students.txt", StudentID
CLOSEFILE "Students.txt"
OUTPUT StudentID
`;

  assert.deepEqual(await parser.run(readProgram), ['S001']);
  assert.deepEqual(await parser.run(readProgram), ['S001']);
  assert.deepEqual(parser.getFileContent('Students.txt'), ['S001', 'Alice', '80']);
});

test('IGCSE parser does not expose callables from a previous run', async () => {
  const parser = new PseudocodeParser();
  const firstProgram = `
FUNCTION OldValue() RETURNS INTEGER
  RETURN 7
ENDFUNCTION
OUTPUT OldValue()
`;

  assert.deepEqual(await parser.run(firstProgram), ['7']);
  await assert.rejects(parser.run('OUTPUT OldValue()'), /undefined function/i);
});
