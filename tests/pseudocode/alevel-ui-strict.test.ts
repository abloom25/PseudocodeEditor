import assert from 'node:assert/strict';
import test from 'node:test';

import completions from '../../src/features/pseudocode-ide/config/completions.json';
import hoverDocs from '../../src/features/pseudocode-ide/config/hover-docs.json';
import reference from '../../src/features/pseudocode-ide/config/reference.json';
import syntaxHighlighting from '../../src/features/pseudocode-ide/config/syntax-highlighting.json';

const alevelCompletions = completions['alevel-9618'];
const alevelKeywords = new Set([
  ...completions.common.keywords,
  ...alevelCompletions.extraKeywords,
]);
const alevelFunctions = new Set([
  ...completions.common.functions,
  ...alevelCompletions.extraFunctions,
]);

test('A-Level completion lists contain only strict control-flow spellings', () => {
  for (const invalid of ['DO', 'ELSEIF', 'ENDFOR']) {
    assert.equal(alevelKeywords.has(invalid), false, `${invalid} must not be suggested`);
  }
  for (const valid of ['NEXT', 'ENDWHILE', 'CALL']) {
    assert.equal(alevelKeywords.has(valid), true, `${valid} must be suggested`);
  }
});

test('A-Level completion lists exclude legacy functions and function-style DIV/MOD', () => {
  for (const invalid of [
    'SUBSTRING',
    'ROUND',
    'RANDOM',
    'RND',
    'NUM_TO_STRING',
    'STRING_TO_NUM',
    'DIV',
    'MOD',
  ]) {
    assert.equal(alevelFunctions.has(invalid), false, `${invalid} must not be a function completion`);
  }
  assert.deepEqual(
    [...alevelFunctions].sort(),
    ['EOF', 'INT', 'LCASE', 'LENGTH', 'MID', 'RAND', 'RIGHT', 'UCASE'].sort(),
  );
});

test('single-line A-Level type and set snippets do not append ENDTYPE', () => {
  for (const name of ['TYPE-ENUM', 'TYPE-POINTER', 'DEFINE-SET'] as const) {
    const body = alevelCompletions.extraSnippets[name].body.join('\n');
    assert.doesNotMatch(body, /\bENDTYPE\b/);
  }
  assert.match(alevelCompletions.extraSnippets['TYPE-RECORD'].body.join('\n'), /\bENDTYPE\b/);
});

test('A-Level hover documentation uses strict operator and conversion semantics', () => {
  const builtins = hoverDocs['alevel-9618'].builtins;
  assert.match(builtins.DIV, /integer1 DIV integer2/);
  assert.doesNotMatch(builtins.DIV, /DIV\s*\(/);
  assert.match(builtins.MOD, /integer1 MOD integer2/);
  assert.match(builtins.INT, /INT\(-2\.3\)[\s\S]*?-2/);
  assert.match(builtins.LCASE, /CHAR/);
  assert.match(builtins.UCASE, /CHAR/);
  assert.doesNotMatch(hoverDocs['alevel-9618'].keywords.DEFINE, /\nENDTYPE/);
});

test('A-Level reference data does not advertise rejected aliases or legacy calls', () => {
  const alevelReference = reference['alevel-9618'];
  const effectiveFunctions = [
    ...reference.common.functions,
    ...alevelReference.extraFunctions,
  ];
  const text = JSON.stringify({ ...alevelReference, effectiveFunctions });
  assert.doesNotMatch(text, /\bELSEIF\b|\bENDFOR\b/);
  assert.doesNotMatch(text, /DIV\(a, b\)|MOD\(a, b\)|ROUND\(/);
  assert.doesNotMatch(text, /LCASE\(string\)|UCASE\(string\)/);
  assert.match(text, /LCASE\(character\)/);
  assert.match(text, /UCASE\(character\)/);
  assert.match(text, /a DIV b/);
  assert.match(text, /a MOD b/);
  assert.match(text, /DECLARE DateOfBirth : DATE/);
});

test('syntax highlighting separates syllabus-only words', () => {
  assert.deepEqual(syntaxHighlighting['igcse-specific'].keywords, ['DO']);
  assert.equal(syntaxHighlighting['alevel-specific'].keywords.includes('ELSEIF'), false);
  assert.equal(syntaxHighlighting['alevel-specific'].keywords.includes('ENDFOR'), false);
  assert.equal(syntaxHighlighting['alevel-specific'].builtins.includes('DIV'), true);
  assert.equal(syntaxHighlighting['alevel-specific'].builtins.includes('MOD'), true);
});
