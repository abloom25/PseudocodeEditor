import assert from 'node:assert/strict';
import test from 'node:test';

import { ALevelParser } from '../../src/lib/pseudocode/alevel-parser';

async function expectRunError(source: string, pattern: RegExp, inputs: unknown[] = []): Promise<void> {
  const parser = new ALevelParser();
  let inputIndex = 0;
  await assert.rejects(
    parser.run(source, async () => inputs[inputIndex++]),
    pattern,
  );
}

test('lexer rejects unterminated strings, chars and unknown symbols', async () => {
  await expectRunError('OUTPUT "unterminated', /unterminated string/i);
  await expectRunError("OUTPUT 'AB'", /character literal/i);
  await expectRunError('DECLARE A : INTEGER\nA <- 1 @ 2', /unexpected character/i);
});

test('syntax checker reports multiple independent malformed statements', () => {
  const parser = new ALevelParser();
  const errors = parser.checkSyntax(`
DECLARE : INTEGER
OUTPUT
IF TRUE
  OUTPUT "missing THEN"
ENDIF
`);
  assert.ok(errors.length >= 3, `expected at least 3 errors, got ${JSON.stringify(errors)}`);
});

test('declarations reject duplicates, unknown types and invalid array bounds', async () => {
  await expectRunError(`
DECLARE Value : INTEGER
DECLARE value : REAL
`, /already declared/i);
  await expectRunError('DECLARE Item : MissingType', /undefined data type/i);
  await expectRunError('DECLARE Bad : ARRAY[5:1] OF INTEGER', /lower bound/i);
  await expectRunError('DECLARE Bad : ARRAY[1:Missing] OF INTEGER', /previously declared INTEGER constant/i);
  await expectRunError(`
DECLARE Size : INTEGER
Size <- 3
DECLARE Bad : ARRAY[1:Size] OF INTEGER
`, /previously declared INTEGER constant/i);
  await expectRunError(`
CONSTANT Size = 2.5
DECLARE Bad : ARRAY[1:Size] OF INTEGER
`, /must contain an INTEGER/i);
  await expectRunError(`
DECLARE Bad : ARRAY[1:Size] OF INTEGER
CONSTANT Size = 3
`, /previously declared INTEGER constant/i);
  await expectRunError('DECLARE Bad : ARRAY[1:2,1:2,1:2] OF INTEGER', /two-dimensional|expected/i);
});

test('array parameters reject element type and bounds mismatches', async () => {
  await expectRunError(`
CONSTANT Size = 2
DECLARE Values : ARRAY[1:3] OF INTEGER
PROCEDURE ReadValues(Items : ARRAY[1:Size] OF INTEGER)
ENDPROCEDURE
CALL ReadValues(Values)
`, /bounds mismatch/i);
  await expectRunError(`
CONSTANT Size = 2
DECLARE Values : ARRAY[1:Size] OF STRING
PROCEDURE ReadValues(Items : ARRAY[1:Size] OF INTEGER)
ENDPROCEDURE
CALL ReadValues(Values)
`, /expected elements of INTEGER/i);
});

test('constants only accept literals and cannot be reassigned case-insensitively', async () => {
  await expectRunError(`
CONSTANT Base = 2
CONSTANT Derived = Base + 1
`, /literal/i);
  await expectRunError(`
CONSTANT Limit = 10
limit <- 11
`, /constant/i);
});

test('dates and character literals must be valid', async () => {
  await expectRunError(`
DECLARE DateValue : DATE
DateValue <- 31/02/2027
`, /invalid date/i);
  await expectRunError(`
DECLARE Letter : CHAR
Letter <- "AB"
`, /type mismatch/i);
});

test('array access validates dimension count, integer indices and bounds', async () => {
  await expectRunError(`
DECLARE Grid : ARRAY[1:2,1:2] OF INTEGER
OUTPUT Grid[1]
`, /dimension/i);
  await expectRunError(`
DECLARE Values : ARRAY[1:3] OF INTEGER
OUTPUT Values[1.5]
`, /integer/i);
  await expectRunError(`
DECLARE Values : ARRAY[1:3] OF INTEGER
Values[0] <- 1
`, /out of bounds/i);
  await expectRunError(`
DECLARE Left : ARRAY[1:2] OF INTEGER
DECLARE Right : ARRAY[1:3] OF INTEGER
Left <- Right
`, /dimensions do not match/i);
});

test('record array fields enforce element types and bounds', async () => {
  await expectRunError(`
TYPE Student
  DECLARE Scores : ARRAY[1:5] OF INTEGER
ENDTYPE
DECLARE Item : Student
Item.Scores[1] <- "invalid"
`, /type mismatch/i);

  await expectRunError(`
TYPE Student
  DECLARE Scores : ARRAY[1:5] OF INTEGER
ENDTYPE
DECLARE Item : Student
Item.Scores[6] <- 10
`, /bounds|index/i);
});

test('constructors require NEW assignment rather than direct CALL', async () => {
  await expectRunError(`
CLASS Person
  PUBLIC PROCEDURE NEW()
  ENDPROCEDURE
ENDCLASS
DECLARE Item : Person
CALL Item.NEW()
`, /cannot be called directly|NEW ClassName/i);
});

test('nested record fields preserve types and reject missing fields', async () => {
  const parser = new ALevelParser();
  const output = await parser.run(`
TYPE Address
  DECLARE City : STRING
ENDTYPE
TYPE Person
  DECLARE Home : Address
ENDTYPE
DECLARE User : Person
User.Home.City <- "Cambridge"
OUTPUT User.Home.City
`);
  assert.deepEqual(output, ['Cambridge']);

  await expectRunError(`
TYPE Person
  DECLARE Name : STRING
ENDTYPE
DECLARE User : Person
User.Age <- 17
`, /no field/i);
});

test('operators reject invalid operands and division by zero', async () => {
  await expectRunError('OUTPUT 1 / 0', /division by zero/i);
  await expectRunError('OUTPUT 1 DIV 0', /division by zero/i);
  await expectRunError('OUTPUT TRUE + 1', /type mismatch/i);
  await expectRunError('OUTPUT 1 AND TRUE', /non-boolean|type mismatch/i);
  await expectRunError('OUTPUT "A" < "B"', /non-numeric|type mismatch/i);
});

test('loop guards reject STEP zero and stop non-terminating loops', async () => {
  await expectRunError(`
DECLARE I : INTEGER
FOR I <- 1 TO 3 STEP 0
  OUTPUT I
NEXT I
`, /step.*zero/i);
  await expectRunError(`
WHILE TRUE
ENDWHILE
`, /maximum iterations/i);
});

test('procedure calls validate arity, types and BYREF variables', async () => {
  await expectRunError(`
PROCEDURE Show(Value : INTEGER)
ENDPROCEDURE
CALL Show()
`, /expects 1 argument/i);
  await expectRunError(`
PROCEDURE Show(Value : INTEGER)
ENDPROCEDURE
CALL Show("wrong")
`, /type mismatch/i);
  await expectRunError(`
PROCEDURE Increment(BYREF Value : INTEGER)
  Value <- Value + 1
ENDPROCEDURE
CALL Increment(1)
`, /BYREF.*variable/i);
});

test('functions validate arity, return presence and return type', async () => {
  await expectRunError(`
FUNCTION Add(A : INTEGER, B : INTEGER) RETURNS INTEGER
  RETURN A + B
ENDFUNCTION
OUTPUT Add(1)
`, /expects 2 arguments/i);
  await expectRunError(`
FUNCTION Empty() RETURNS INTEGER
  OUTPUT "no return"
ENDFUNCTION
OUTPUT Empty()
`, /did not return/i);
  await expectRunError(`
FUNCTION Wrong() RETURNS INTEGER
  RETURN "text"
ENDFUNCTION
OUTPUT Wrong()
`, /return type mismatch/i);
});

test('pointer operations validate declaration type and pointee type', async () => {
  await expectRunError(`
DECLARE Value : INTEGER
DECLARE NotPointer : INTEGER
NotPointer <- ^Value
`, /not a pointer/i);
  await expectRunError(`
TYPE TIntPointer = ^INTEGER
DECLARE Text : STRING
DECLARE Pointer : TIntPointer
Pointer <- ^Text
`, /pointer type mismatch/i);
  await expectRunError(`
TYPE TIntPointer = ^INTEGER
DECLARE Pointer : TIntPointer
OUTPUT Pointer^
`, /does not point/i);
});

test('text file state machine rejects invalid modes and targets', async () => {
  await expectRunError(`
DECLARE Line : STRING
READFILE "missing.txt", Line
`, /READFILE.*READ mode|not open for reading/i);
  await expectRunError(`
OPENFILE "data.txt" FOR WRITE
OPENFILE "DATA.TXT" FOR APPEND
`, /already open/i);
  await expectRunError(`
DECLARE Number : INTEGER
OPENFILE "data.txt" FOR WRITE
WRITEFILE "data.txt", "1"
CLOSEFILE "data.txt"
OPENFILE "data.txt" FOR READ
READFILE "data.txt", Number
`, /STRING/i);
  await expectRunError('OUTPUT EOF("closed.txt")', /not open for reading/i);
  await expectRunError('CLOSEFILE "closed.txt"', /not open/i);
});

test('random file operations reject invalid positions and absent records', async () => {
  await expectRunError(`
OPENFILE "data.dat" FOR RANDOM
SEEK "data.dat", 0
`, /positive integer/i);
  await expectRunError(`
DECLARE Value : STRING
OPENFILE "data.dat" FOR RANDOM
SEEK "data.dat", 1
GETRECORD "data.dat", Value
`, /no record/i);
});

test('class visibility, method arity and constructor types are enforced', async () => {
  await expectRunError(`
CLASS Secret
  PRIVATE Value : INTEGER
ENDCLASS
DECLARE Item : Secret
Item <- NEW Secret()
OUTPUT Item.Value
`, /private field/i);
  await expectRunError(`
CLASS Secret
  PRIVATE FUNCTION Reveal() RETURNS STRING
    RETURN "hidden"
  ENDFUNCTION
ENDCLASS
DECLARE Item : Secret
Item <- NEW Secret()
OUTPUT Item.Reveal()
`, /private method/i);
  await expectRunError(`
CLASS Box
  PUBLIC PROCEDURE NEW(Size : INTEGER)
  ENDPROCEDURE
ENDCLASS
DECLARE Item : Box
Item <- NEW Box("large")
`, /type mismatch/i);
});

test('case-insensitive names apply to functions, procedures, types and fields', async () => {
  const { output } = await (async () => {
    const parser = new ALevelParser();
    return {
      output: await parser.run(`
TYPE Profile
  DECLARE Name : STRING
ENDTYPE
PROCEDURE SetName(BYREF Item : Profile)
  Item.Name <- "Ada"
ENDPROCEDURE
FUNCTION ReadName(Item : Profile) RETURNS STRING
  RETURN Item.Name
ENDFUNCTION
DECLARE User : profile
CALL setname(User)
OUTPUT readname(User), user.name
`),
    };
  })();
  assert.deepEqual(output, ['Ada Ada']);
});

test('procedure and function local variables do not leak across repeated calls', async () => {
  const parser = new ALevelParser();
  const output = await parser.run(`
PROCEDURE Show(Value : INTEGER)
  DECLARE Local : INTEGER
  Local <- Value * 2
  OUTPUT Local
ENDPROCEDURE
FUNCTION Double(Value : INTEGER) RETURNS INTEGER
  DECLARE LocalResult : INTEGER
  LocalResult <- Value * 2
  RETURN LocalResult
ENDFUNCTION
CALL Show(2)
CALL Show(3)
OUTPUT Double(4)
OUTPUT Double(5)
`);
  assert.deepEqual(output, ['4', '6', '8', '10']);
  assert.equal('Local' in parser.getVariables(), false);
  assert.equal('LocalResult' in parser.getVariables(), false);
});

test('BYVAL records are copied while BYREF records are written back', async () => {
  const parser = new ALevelParser();
  const output = await parser.run(`
TYPE Box
  DECLARE Value : INTEGER
ENDTYPE
PROCEDURE ChangeCopy(Item : Box)
  Item.Value <- 2
ENDPROCEDURE
PROCEDURE ChangeOriginal(BYREF Item : Box)
  Item.Value <- 3
ENDPROCEDURE
DECLARE Original : Box
Original.Value <- 1
CALL ChangeCopy(Original)
OUTPUT Original.Value
CALL ChangeOriginal(Original)
OUTPUT Original.Value
`);
  assert.deepEqual(output, ['1', '3']);
});

test('argument expressions are evaluated exactly once', async () => {
  const parser = new ALevelParser();
  const output = await parser.run(`
DECLARE Calls : INTEGER
Calls <- 0
FUNCTION NextValue() RETURNS INTEGER
  Calls <- Calls + 1
  RETURN Calls
ENDFUNCTION
FUNCTION Identity(Value : INTEGER) RETURNS INTEGER
  RETURN Value
ENDFUNCTION
OUTPUT Identity(NextValue())
OUTPUT Calls
`);
  assert.deepEqual(output, ['1', '1']);
});

test('procedures require CALL and functions cannot be standalone statements', async () => {
  await expectRunError(`
PROCEDURE Work()
ENDPROCEDURE
Work()
`, /CALL|standalone statement/i);
  await expectRunError(`
FUNCTION Value() RETURNS INTEGER
  RETURN 1
ENDFUNCTION
Value()
`, /function call.*statement/i);
  await expectRunError(`
FUNCTION Value() RETURNS INTEGER
  RETURN 1
ENDFUNCTION
CALL Value()
`, /function.*CALL|undefined procedure/i);
});

test('recursive procedures have the same call-depth protection as functions', async () => {
  await expectRunError(`
PROCEDURE Recurse()
  CALL Recurse()
ENDPROCEDURE
CALL Recurse()
`, /maximum call depth/i);
});

test('built-in functions validate argument counts', async () => {
  await expectRunError('OUTPUT LENGTH()', /expects 1 argument/i);
  await expectRunError('OUTPUT MID("ABC", 1)', /expects 3 arguments/i);
  await expectRunError('OUTPUT RAND(1, 2)', /expects 1 argument/i);
  await expectRunError('OUTPUT INT("1")', /expected REAL|numeric|type mismatch/i);
});

test('duplicate callable and type names are rejected case-insensitively', async () => {
  await expectRunError(`
PROCEDURE Work()
ENDPROCEDURE
PROCEDURE work()
ENDPROCEDURE
`, /already declared/i);
  await expectRunError(`
TYPE Item
  DECLARE Value : INTEGER
ENDTYPE
TYPE item
  DECLARE Value : INTEGER
ENDTYPE
`, /already declared/i);
  await expectRunError(`
CLASS Box
ENDCLASS
CLASS box
ENDCLASS
`, /already declared/i);
});
