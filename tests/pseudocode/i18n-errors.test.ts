import assert from 'node:assert/strict';
import test from 'node:test';

import { ALevelParser } from '../../src/lib/pseudocode/alevel-parser';
import {
  PseudocodeDiagnosticError,
  formatDiagnostic,
} from '../../src/lib/pseudocode/diagnostics';
import { PseudocodeParser } from '../../src/lib/pseudocode/parser';
import { en } from '../../src/locales/en';
import { zh } from '../../src/locales/zh';
import { errorMessagesEn } from '../../src/locales/errors/en';
import { errorMessagesZh } from '../../src/locales/errors/zh';

test('English and Chinese UI language packs expose exactly the same keys', () => {
  assert.deepEqual(Object.keys(zh).sort(), Object.keys(en).sort());
  assert.deepEqual(Object.keys(errorMessagesZh).sort(), Object.keys(errorMessagesEn).sort());
});

test('parser syntax errors leave the parser as structured diagnostics', () => {
  const parser = new ALevelParser();
  assert.throws(
    () => parser.parse('DECLARE Scores : ARRAY[1:] OF INTEGER'),
    (error: unknown) => {
      assert.ok(error instanceof PseudocodeDiagnosticError);
      assert.equal(typeof error.diagnostic.code, 'string');
      assert.equal(error.diagnostic.line, 1);
      assert.match(formatDiagnostic(error.diagnostic, 'en'), /^Line 1:/);
      assert.match(formatDiagnostic(error.diagnostic, 'zh'), /^第 1 行/);
      return true;
    },
  );
});

test('interpreter runtime errors are localized from one diagnostic object', async () => {
  const parser = new PseudocodeParser();
  await assert.rejects(
    parser.run('DECLARE Value : INTEGER\nValue <- 1 / 0'),
    (error: unknown) => {
      assert.ok(error instanceof PseudocodeDiagnosticError);
      assert.equal(error.diagnostic.code, 'runtime.divisionByZero');
      assert.equal(formatDiagnostic(error.diagnostic, 'en'), 'Line 2: division by zero');
      assert.equal(formatDiagnostic(error.diagnostic, 'zh'), '第 2 行：除以零');
      return true;
    },
  );
});

test('strict A-Level errors keep stable codes and localized messages', async () => {
  const parser = new ALevelParser();
  await assert.rejects(
    parser.run('DECLARE Flag : BOOLEAN\nFlag <- 1'),
    (error: unknown) => {
      assert.ok(error instanceof PseudocodeDiagnosticError);
      assert.equal(error.diagnostic.code, 'runtime.assignmentTypeMismatch');
      assert.equal(
        formatDiagnostic(error.diagnostic, 'en'),
        "Line 2: cannot assign INTEGER value to BOOLEAN variable 'Flag'",
      );
      assert.equal(
        formatDiagnostic(error.diagnostic, 'zh'),
        "第 2 行：无法将 整数 值赋给 布尔值 变量 'Flag'",
      );
      return true;
    },
  );
});
