import assert from 'node:assert/strict';
import test from 'node:test';

import { ALevelParser } from '../../src/lib/pseudocode/alevel-parser';

async function expectError(source: string, pattern: RegExp): Promise<void> {
  await assert.rejects(new ALevelParser().run(source), pattern);
}

test('strict procedure and function declarations require parentheses', async () => {
  await expectError(`
PROCEDURE Work
ENDPROCEDURE
`, /requires '\(\)'|parentheses/i);
  await expectError(`
FUNCTION Value RETURNS INTEGER
  RETURN 1
ENDFUNCTION
`, /requires '\(\)'|parentheses/i);
});

test('strict procedure calls require CALL and parentheses', async () => {
  await expectError(`
PROCEDURE Work()
ENDPROCEDURE
CALL Work
`, /requires parentheses/i);
});

test('strict A-Level mode rejects non-syllabus control-flow aliases', async () => {
  await expectError(`
IF TRUE THEN
  OUTPUT "a"
ELSEIF FALSE THEN
  OUTPUT "b"
ENDIF
`, /ELSEIF.*not part/i);
  await expectError(`
DECLARE I : INTEGER
FOR I <- 1 TO 2
ENDFOR
`, /ENDFOR.*not part/i);
  await expectError(`
WHILE FALSE DO
ENDWHILE
`, /DO.*not part/i);
});

test('strict A-Level mode rejects legacy built-ins and function-style DIV/MOD', async () => {
  for (const source of [
    'OUTPUT SUBSTRING("ABC", 1, 1)',
    'OUTPUT ROUND(1.2, 0)',
    'OUTPUT RANDOM()',
    'OUTPUT RND()',
    'OUTPUT NUM_TO_STRING(1)',
    'OUTPUT STRING_TO_NUM("1")',
    'OUTPUT DIV(7, 2)',
    'OUTPUT MOD(7, 2)',
  ]) {
    await expectError(source, /not part of.*9618|use the infix operator/i);
  }
});

test('strict declarations reject keyword identifiers and malformed numeric literals', async () => {
  await expectError('DECLARE IF : INTEGER', /identifier|keyword/i);
  await expectError('DECLARE Value : INTEGER\nValue <- 1.2.3', /unexpected character|numeric literal/i);
  await expectError('DECLARE Value : REAL\nValue <- .5', /unexpected character|real literal/i);
  await expectError('DECLARE Value : REAL\nValue <- 5.', /numeric literal|real literal/i);
});

test('strict execution requires BOOLEAN conditions', async () => {
  await expectError(`
IF 1 THEN
  OUTPUT "wrong"
ENDIF
`, /IF condition must be BOOLEAN/i);
  await expectError(`
WHILE "yes"
ENDWHILE
`, /WHILE condition must be BOOLEAN/i);
  await expectError(`
REPEAT
UNTIL 1
`, /UNTIL condition must be BOOLEAN/i);
});

test('strict FOR loops require a declared INTEGER control variable and integer expressions', async () => {
  await expectError(`
FOR I <- 1 TO 2
NEXT I
`, /control variable.*declared/i);
  await expectError(`
DECLARE I : REAL
FOR I <- 1 TO 2
NEXT I
`, /control variable.*INTEGER/i);
  await expectError(`
DECLARE I : INTEGER
FOR I <- 1.5 TO 2
NEXT I
`, /start.*INTEGER/i);
  await expectError(`
DECLARE I : INTEGER
FOR I <- 1 TO 2 STEP 0.5
NEXT I
`, /STEP.*INTEGER/i);
});

test('strict RETURN placement is enforced', async () => {
  await expectError('RETURN 1', /RETURN.*inside a function/i);
  await expectError(`
PROCEDURE Work()
  RETURN 1
ENDPROCEDURE
CALL Work()
`, /RETURN.*function/i);
});

test('strict CASE selector and branch values must be type-compatible', async () => {
  await expectError(`
DECLARE Choice : INTEGER
Choice <- 1
CASE OF Choice
  "1" : OUTPUT "wrong"
ENDCASE
`, /CASE value type mismatch/i);
});

test('strict random and text file operations stay separated', async () => {
  await expectError(`
OPENFILE "data.dat" FOR RANDOM
WRITEFILE "data.dat", "wrong"
`, /WRITEFILE.*WRITE or APPEND|WRITEFILE.*RANDOM|not open for writing/i);
  await expectError(`
DECLARE Text : STRING
OPENFILE "data.dat" FOR RANDOM
READFILE "data.dat", Text
`, /READFILE.*READ mode|READFILE.*RANDOM|not open for reading/i);
});

test('strict expression types follow the syllabus rather than JavaScript runtime values', async () => {
  await expectError(`
DECLARE Whole : INTEGER
Whole <- 4 / 2
`, /REAL.*INTEGER|type mismatch/i);
  await expectError(`
DECLARE Whole : INTEGER
Whole <- RAND(1)
`, /REAL.*INTEGER|type mismatch/i);

  const output = await new ALevelParser().run(`
DECLARE Decimal : REAL
Decimal <- 4 / 2
OUTPUT Decimal
OUTPUT -7 DIV 3, -7 MOD 3
`);
  assert.deepEqual(output, ['2.0', '-2 -1']);
});

test('strict built-ins enforce the documented parameter types', async () => {
  await expectError('OUTPUT LCASE("AB")', /expected CHAR/i);
  await expectError('OUTPUT UCASE("ab")', /expected CHAR/i);
  await expectError('OUTPUT RIGHT(\'A\', 1)', /expected STRING/i);
  await expectError('OUTPUT MID("ABC", 1.0, 1)', /expected INTEGER/i);
});

test('strict callable signatures use known types and unique parameter names', async () => {
  await expectError(`
PROCEDURE Work(Value : MissingType)
ENDPROCEDURE
`, /undefined parameter type/i);
  await expectError(`
FUNCTION Work() RETURNS MissingType
  RETURN 1
ENDFUNCTION
`, /undefined return type/i);
  await expectError(`
PROCEDURE Work(Value : INTEGER, value : INTEGER)
ENDPROCEDURE
`, /duplicate parameter/i);
});

test('strict user-defined type declarations reject invalid definitions', async () => {
  await expectError(`
TYPE Choice = (Yes, yes)
`, /duplicate enum value/i);
  await expectError(`
TYPE Person
  DECLARE Name : STRING
  DECLARE name : STRING
ENDTYPE
`, /duplicate field/i);
  await expectError(`
TYPE Person
  DECLARE Child : MissingType
ENDTYPE
`, /undefined field type/i);
  await expectError(`
TYPE LetterSet = SET OF CHAR
DEFINE Letters (1, 2) : LetterSet
`, /set value type mismatch/i);
  await expectError(`
DEFINE Values (1, 2) : MissingSet
`, /undefined set type/i);
});

test('strict class declarations validate inheritance, members and method returns', async () => {
  await expectError(`
CLASS Child INHERITS MissingParent
ENDCLASS
`, /undefined parent class/i);
  await expectError(`
CLASS Box
  PRIVATE Value : INTEGER
  PUBLIC Value : INTEGER
ENDCLASS
`, /duplicate class member/i);
  await expectError(`
CLASS Box
  PUBLIC FUNCTION Value() RETURNS INTEGER
    OUTPUT "missing return"
  ENDFUNCTION
ENDCLASS
DECLARE Item : Box
Item <- NEW Box()
OUTPUT Item.Value()
`, /did not return/i);
});

test('strict DATE values and file identifiers retain their declared types', async () => {
  await expectError(`
DECLARE Today : DATE
Today <- "07/06/2026"
`, /type mismatch/i);
  await expectError(`
DECLARE Filename : INTEGER
Filename <- 1
OPENFILE Filename FOR READ
`, /file identifier.*STRING/i);
});

test('strict random files preserve one record type per file', async () => {
  await expectError(`
TYPE Student
  DECLARE Name : STRING
ENDTYPE
DECLARE Pupil : Student
DECLARE Number : INTEGER
OPENFILE "data.dat" FOR RANDOM
PUTRECORD "data.dat", Pupil
SEEK "data.dat", 1
GETRECORD "data.dat", Number
`, /record type mismatch/i);
});
