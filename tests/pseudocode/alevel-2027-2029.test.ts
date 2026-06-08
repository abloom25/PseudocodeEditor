import assert from 'node:assert/strict';
import test from 'node:test';

import { ALevelParser } from '../../src/lib/pseudocode/alevel-parser';

async function run(source: string, inputs: unknown[] = []): Promise<{
  output: string[];
  parser: ALevelParser;
}> {
  const parser = new ALevelParser();
  let inputIndex = 0;
  const output = await parser.run(source, async () => inputs[inputIndex++]);
  return { output, parser };
}

test('variables, constants, literals, assignment and comments', async () => {
  const { output } = await run(`
// all six built-in data types
DECLARE Count : INTEGER
DECLARE Price : REAL
DECLARE Initial : CHAR
DECLARE Message : STRING
DECLARE Ready : BOOLEAN
DECLARE Today : DATE
CONSTANT Tax = 2.5
Count <- 3
Price <- Count + Tax
Initial <- 'A'
Message <- "ready"
Ready <- TRUE
Today <- 02/01/2027
OUTPUT Count, Price, Initial, Message, Ready, Today
`);
  assert.deepEqual(output, ['3 5.5 A ready TRUE 02/01/2027']);
});

test('identifiers are case-insensitive', async () => {
  const { output } = await run(`
DECLARE Countdown : INTEGER
countDOWN <- 4
OUTPUT COUNTDOWN
`);
  assert.deepEqual(output, ['4']);
});

test('one and two dimensional arrays support expression indices and whole-array assignment', async () => {
  const { output } = await run(`
DECLARE Index : INTEGER
DECLARE Names : ARRAY[1:3] OF STRING
DECLARE Board : ARRAY[1:2,1:2] OF CHAR
DECLARE Saved : ARRAY[1:2,1:2] OF CHAR
Index <- 1
Names[Index + 1] <- "Ali"
Board[2,1] <- 'X'
Saved <- Board
OUTPUT Names[2], Saved[2,1]
`);
  assert.deepEqual(output, ['Ali X']);
});

test('array bounds accept previously declared INTEGER constants', async () => {
  const { output } = await run(`
TYPE StudentRecord
  DECLARE StudentID : STRING
  DECLARE Score : INTEGER
ENDTYPE
CONSTANT MaxStudents = 3
CONSTANT FirstIndex = 1
DECLARE Students : ARRAY[FirstIndex:MaxStudents] OF StudentRecord
Students[MaxStudents].StudentID <- "S003"
Students[MaxStudents].Score <- 80
OUTPUT Students[3].StudentID, Students[3].Score
`);
  assert.deepEqual(output, ['S003 80']);
});

test('array parameters support constant bounds, BYREF mutation and BYVAL function reads', async () => {
  const { output } = await run(`
TYPE StudentRecord
  DECLARE Score : INTEGER
ENDTYPE
CONSTANT MaxStudents = 2
DECLARE Students : ARRAY[1:MaxStudents] OF StudentRecord

PROCEDURE SetScore(BYREF Items : ARRAY[1:MaxStudents] OF StudentRecord,
                   BYVAL Index : INTEGER,
                   Score : INTEGER)
  Items[Index].Score <- Score
ENDPROCEDURE

FUNCTION GetScore(Items : ARRAY[1:MaxStudents] OF StudentRecord,
                  Index : INTEGER) RETURNS INTEGER
  RETURN Items[Index].Score
ENDFUNCTION

CALL SetScore(Students, 2, 91)
OUTPUT GetScore(Students, 2)
`);
  assert.deepEqual(output, ['91']);
});

test('enumerated types use the guide syntax without ENDTYPE', async () => {
  const { output } = await run(`
TYPE Season = (Spring, Summer, Autumn, Winter)
DECLARE ThisSeason : Season
ThisSeason <- Spring
OUTPUT ThisSeason
`);
  assert.deepEqual(output, ['Spring']);
});

test('pointer types, address-of and dereference use the guide syntax', async () => {
  const { output } = await run(`
TYPE TIntPointer = ^INTEGER
DECLARE Value : INTEGER
DECLARE MyPointer : TIntPointer
Value <- 10
MyPointer <- ^Value
MyPointer^ <- 12
OUTPUT MyPointer^, Value
`);
  assert.deepEqual(output, ['12 12']);
});

test('record types, field access, record arrays and record assignment', async () => {
  const { output } = await run(`
TYPE StudentRecord
  DECLARE LastName : STRING
  DECLARE YearGroup : INTEGER
ENDTYPE
DECLARE Pupil1 : StudentRecord
DECLARE Pupil2 : StudentRecord
DECLARE Form : ARRAY[1:2] OF StudentRecord
Pupil1.LastName <- "Johnson"
Pupil1.YearGroup <- 6
Pupil2 <- Pupil1
Form[1] <- Pupil2
Form[1].YearGroup <- Form[1].YearGroup + 1
OUTPUT Pupil2.LastName, Form[1].YearGroup
`);
  assert.deepEqual(output, ['Johnson 7']);
});

test('set type and DEFINE use the guide syntax', async () => {
  const { parser } = await run(`
TYPE LetterSet = SET OF CHAR
DEFINE Vowels ('A','E','I','O','U') : LetterSet
`);
  assert.deepEqual(parser.getSetDefinitions().Vowels, {
    values: ['A', 'E', 'I', 'O', 'U'],
    setType: 'LetterSet',
  });
});

test('arithmetic, relational, logical, concatenation and numeric functions', async () => {
  const { output } = await run(`
DECLARE Result : REAL
Result <- 5 / 2
OUTPUT Result
OUTPUT 7 DIV 3, 7 MOD 3
OUTPUT (3 < 4) AND NOT FALSE
OUTPUT "Summer" & " " & "Pudding"
OUTPUT INT(27.5415)
`);
  assert.deepEqual(output, ['2.5', '2 1', 'TRUE', 'Summer Pudding', '27']);
});

test('A-Level string functions and RAND', async () => {
  const { output } = await run(`
OUTPUT RIGHT("ABCDEFGH", 3)
OUTPUT LENGTH("Happy Days")
OUTPUT MID("ABCDEFGH", 2, 3)
OUTPUT LCASE('W'), UCASE('h')
OUTPUT RAND(0)
`);
  assert.deepEqual(output, ['FGH', '10', 'BCD', 'w H', '0.0']);
});

test('IF, CASE ranges and OTHERWISE', async () => {
  const { output } = await run(`
DECLARE Score : INTEGER
Score <- 7
IF Score > 5 THEN
  OUTPUT "high"
ELSE
  OUTPUT "low"
ENDIF
CASE OF Score
  1 TO 5 : OUTPUT "small"
  6 TO 9 : OUTPUT "medium"
  OTHERWISE : OUTPUT "large"
ENDCASE
`);
  assert.deepEqual(output, ['high', 'medium']);
});

test('FOR with positive and negative STEP, REPEAT and WHILE', async () => {
  const { output } = await run(`
DECLARE I : INTEGER
DECLARE Total : INTEGER
Total <- 0
FOR I <- 1 TO 3
  Total <- Total + I
NEXT I
FOR I <- 3 TO 1 STEP -1
  Total <- Total + I
NEXT I
REPEAT
  Total <- Total - 1
UNTIL Total = 11
WHILE Total > 10
  Total <- Total - 1
ENDWHILE
OUTPUT Total
`);
  assert.deepEqual(output, ['10']);
});

test('procedures, functions, BYVAL and grouped BYREF parameters', async () => {
  const { output } = await run(`
PROCEDURE Swap(BYREF X : INTEGER, Y : INTEGER)
  DECLARE Temp : INTEGER
  Temp <- X
  X <- Y
  Y <- Temp
ENDPROCEDURE
FUNCTION Max(Number1 : INTEGER, Number2 : INTEGER) RETURNS INTEGER
  IF Number1 > Number2 THEN
    RETURN Number1
  ELSE
    RETURN Number2
  ENDIF
ENDFUNCTION
DECLARE A : INTEGER
DECLARE B : INTEGER
A <- 2
B <- 5
CALL Swap(A, B)
OUTPUT A, B, Max(A, B)
`);
  assert.deepEqual(output, ['5 2 5']);
});

test('INPUT accepts array elements and record fields', async () => {
  const { output } = await run(`
TYPE AnswerRecord
  DECLARE Text : STRING
ENDTYPE
DECLARE Answers : ARRAY[1:2] OF STRING
DECLARE Result : AnswerRecord
INPUT Answers[1]
INPUT Result.Text
OUTPUT Answers[1], Result.Text
`, ['yes', 'done']);
  assert.deepEqual(output, ['yes done']);
});

test('text files support READ, WRITE, APPEND, EOF and variable filenames', async () => {
  const parser = new ALevelParser();
  parser.setFileContent('input.txt', ['one', 'two']);
  const output = await parser.run(`
DECLARE InputName : STRING
DECLARE Line : STRING
InputName <- "input.txt"
OPENFILE InputName FOR READ
OPENFILE "output.txt" FOR WRITE
WHILE NOT EOF(InputName)
  READFILE InputName, Line
  WRITEFILE "output.txt", Line
ENDWHILE
CLOSEFILE InputName
CLOSEFILE "output.txt"
OPENFILE "output.txt" FOR APPEND
WRITEFILE "output.txt", "three"
CLOSEFILE "output.txt"
OUTPUT "done"
`);
  assert.deepEqual(output, ['done']);
  assert.deepEqual(parser.getFileContent('output.txt'), ['one', 'two', 'three']);
});

test('random files support SEEK, PUTRECORD and GETRECORD', async () => {
  const { output } = await run(`
TYPE Student
  DECLARE Name : STRING
ENDTYPE
DECLARE Written : Student
DECLARE ReadBack : Student
Written.Name <- "Leroy"
OPENFILE "students.dat" FOR RANDOM
SEEK "students.dat", 10
PUTRECORD "students.dat", Written
SEEK "students.dat", 10
GETRECORD "students.dat", ReadBack
CLOSEFILE "students.dat"
OUTPUT ReadBack.Name
`);
  assert.deepEqual(output, ['Leroy']);
});

test('classes support visibility, constructors, methods, inheritance and SUPER', async () => {
  const { output } = await run(`
CLASS Pet
  PRIVATE Name : STRING
  PUBLIC PROCEDURE NEW(GivenName : STRING)
    Name <- GivenName
  ENDPROCEDURE
  PUBLIC FUNCTION GetName() RETURNS STRING
    RETURN Name
  ENDFUNCTION
ENDCLASS
CLASS Cat INHERITS Pet
  PRIVATE Breed : STRING
  PUBLIC PROCEDURE NEW(GivenName : STRING, GivenBreed : STRING)
    SUPER.NEW(GivenName)
    Breed <- GivenBreed
  ENDPROCEDURE
  PUBLIC FUNCTION Describe() RETURNS STRING
    RETURN GetName() & ":" & Breed
  ENDFUNCTION
ENDCLASS
DECLARE MyCat : Cat
MyCat <- NEW Cat("Kitty", "Shorthaired")
OUTPUT MyCat.Describe()
`);
  assert.deepEqual(output, ['Kitty:Shorthaired']);
});
