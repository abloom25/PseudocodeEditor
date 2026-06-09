import {
  errorMessagesEn,
  tokenNamesEn,
  type PseudocodeErrorCode,
} from '@/locales/errors/en';
import {
  diagnosticTermsZh,
  errorMessagesZh,
  tokenNamesZh,
} from '@/locales/errors/zh';
import type { Locale } from '@/lib/i18n';
import { diagnosticExplanationsEn } from '@/locales/errors/explanations-en';
import { diagnosticExplanationsZh } from '@/locales/errors/explanations-zh';

export type DiagnosticValue = string | number;

export type PseudocodeDiagnostic = {
  code: PseudocodeErrorCode;
  params: Record<string, DiagnosticValue>;
  line?: number;
  column?: number;
  sourceMessage: string;
};

export class PseudocodeDiagnosticError extends Error {
  readonly diagnostic: PseudocodeDiagnostic;

  constructor(diagnostic: PseudocodeDiagnostic) {
    super(diagnostic.sourceMessage);
    this.name = 'PseudocodeDiagnosticError';
    this.diagnostic = diagnostic;
  }
}

function location(message: string, lineHint?: number) {
  const line = Number(message.match(/\bat line (\d+)/i)?.[1] ?? lineHint ?? 1);
  const columnMatch = message.match(/\bcolumn (\d+)/i);
  return {
    line: Number.isFinite(line) ? line : 1,
    column: columnMatch ? Number(columnMatch[1]) : undefined,
  };
}

function detailWithoutLocation(message: string): string {
  return message
    .replace(/\s+at line \d+(?:,\s*column \d+)?/gi, '')
    .replace(/\s+on line \d+/gi, '')
    .trim();
}

function create(
  code: PseudocodeErrorCode,
  sourceMessage: string,
  params: Record<string, DiagnosticValue> = {},
  lineHint?: number,
): PseudocodeDiagnostic {
  const loc = location(sourceMessage, lineHint);
  return {
    code,
    sourceMessage,
    line: loc.line,
    column: loc.column,
    params: {
      line: loc.line,
      ...(loc.column ? { column: loc.column } : {}),
      ...params,
    },
  };
}

export function normalizePseudocodeError(
  error: unknown,
  lineHint?: number,
): PseudocodeDiagnosticError {
  if (error instanceof PseudocodeDiagnosticError) return error;
  const message = error instanceof Error ? error.message : String(error);

  let match = message.match(/Expected (\w+) but got (\w+)\s*\('?(.*?)'?\)\s*at line (\d+)/i);
  if (match) {
    return new PseudocodeDiagnosticError(create('syntax.expected', message, {
      expectedToken: match[1],
      actualToken: match[2],
      actualValue: match[3],
      expected: tokenNamesEn[match[1]] ?? match[1],
      actual: tokenNamesEn[match[2]] ?? `'${match[3]}'`,
    }, Number(match[4])));
  }

  if (/Unexpected assignment operator/i.test(message)) {
    return new PseudocodeDiagnosticError(create('syntax.unexpectedAssignment', message, {}, lineHint));
  }
  if (/Unexpected end of (?:code|input)/i.test(message)) {
    return new PseudocodeDiagnosticError(create('syntax.unexpectedEnd', message, {}, lineHint));
  }

  match = message.match(/Unexpected token '([^']*)'/i);
  if (match) {
    return new PseudocodeDiagnosticError(create('syntax.unexpectedToken', message, { token: match[1] }, lineHint));
  }
  match = message.match(/Unexpected character '([^']*)'/i);
  if (match) {
    return new PseudocodeDiagnosticError(create('syntax.unexpectedCharacter', message, { character: match[1] }, lineHint));
  }
  match = message.match(/Invalid (numeric|real|date|string|character) literal(?: '([^']*)')?/i);
  if (match) {
    return new PseudocodeDiagnosticError(create('syntax.invalidLiteral', message, {
      kind: match[1],
      value: match[2] ? `'${match[2]}'` : '',
    }, lineHint));
  }
  match = message.match(/Invalid data type '([^']+)' for (.+?) at line/i);
  if (match) {
    return new PseudocodeDiagnosticError(create('syntax.invalidType', message, {
      type: match[1],
      context: match[2],
    }, lineHint));
  }
  match = message.match(/^(.+?) is not part of (Cambridge .+? pseudocode)(?: at line \d+)?(?:;\s*(.+))?$/i);
  if (match) {
    return new PseudocodeDiagnosticError(create('syntax.unsupported', message, {
      feature: match[1],
      syllabus: match[2],
      hint: match[3] ?? '',
    }, lineHint));
  }
  if (/OUTPUT requires at least one expression/i.test(message)) {
    return new PseudocodeDiagnosticError(create('syntax.outputExpression', message, {}, lineHint));
  }
  if (/RETURN may only be used inside a function/i.test(message)) {
    return new PseudocodeDiagnosticError(create('syntax.returnOutsideFunction', message, {}, lineHint));
  }
  match = message.match(/RETURN cannot be followed by '([^']+)'/i);
  if (match) {
    return new PseudocodeDiagnosticError(create('syntax.returnFollower', message, { token: match[1] }, lineHint));
  }
  if (/array (?:lower bound|bound)/i.test(message)) {
    return new PseudocodeDiagnosticError(create('syntax.arrayBound', message, {
      detail: detailWithoutLocation(message),
    }, lineHint));
  }
  if (/NEXT variable|FOR variable|WHILE syntax|requires parentheses/i.test(message)) {
    return new PseudocodeDiagnosticError(create('syntax.structure', message, {
      detail: detailWithoutLocation(message),
    }, lineHint));
  }

  if (/Execution aborted by user/i.test(message)) {
    return new PseudocodeDiagnosticError(create('runtime.aborted', message, {}, lineHint));
  }
  if (/Division by zero/i.test(message)) {
    return new PseudocodeDiagnosticError(create('runtime.divisionByZero', message, {}, lineHint));
  }
  if (/Maximum iterations exceeded/i.test(message)) {
    return new PseudocodeDiagnosticError(create('runtime.iterationLimit', message, {}, lineHint));
  }
  if (/Maximum call depth exceeded/i.test(message)) {
    return new PseudocodeDiagnosticError(create('runtime.callDepth', message, {}, lineHint));
  }
  match = message.match(/Undefined (variable|array|function|procedure|class|type|data type|set type|file identifier) '([^']+)'/i);
  if (match) {
    return new PseudocodeDiagnosticError(create('runtime.undefined', message, {
      kind: match[1],
      name: match[2],
    }, lineHint));
  }
  match = message.match(/Identifier '([^']+)' is already declared/i);
  if (match) {
    return new PseudocodeDiagnosticError(create('runtime.alreadyDeclared', message, { name: match[1] }, lineHint));
  }
  match = message.match(/Cannot reassign constant '([^']+)'/i);
  if (match) {
    return new PseudocodeDiagnosticError(create('runtime.constantReassignment', message, { name: match[1] }, lineHint));
  }
  match = message.match(/Type mismatch: cannot assign (\w+) value to (\w+) (variable|array) '([^']+)'/i);
  if (match) {
    return new PseudocodeDiagnosticError(create('runtime.assignmentTypeMismatch', message, {
      actual: match[1],
      expected: match[2],
      targetKind: match[3],
      name: match[4],
    }, lineHint));
  }

  const detail = detailWithoutLocation(message);
  if (/Type mismatch|must be (?:STRING|INTEGER|BOOLEAN|REAL|CHAR)|type do not match|type mismatch/i.test(message)) {
    return new PseudocodeDiagnosticError(create('runtime.typeMismatch', message, { detail }, lineHint));
  }
  if (/Cannot convert|Type error:|invalid DATE value|Invalid date literal/i.test(message)) {
    return new PseudocodeDiagnosticError(create('runtime.conversion', message, { detail }, lineHint));
  }
  if (/Array |array '/i.test(message)) {
    return new PseudocodeDiagnosticError(create('runtime.array', message, { detail }, lineHint));
  }
  if (/File |READFILE|WRITEFILE|End of file|SEEK |record at position/i.test(message)) {
    return new PseudocodeDiagnosticError(create('runtime.file', message, { detail }, lineHint));
  }
  if (/Function |Procedure |subroutine|standalone statement|must be called with CALL/i.test(message)) {
    return new PseudocodeDiagnosticError(create('runtime.callable', message, { detail }, lineHint));
  }
  if (/argument|parameter/i.test(message)) {
    return new PseudocodeDiagnosticError(create('runtime.argument', message, { detail }, lineHint));
  }
  if (/Pointer |pointer |dereferenc/i.test(message)) {
    return new PseudocodeDiagnosticError(create('runtime.pointer', message, { detail }, lineHint));
  }
  if (/Record |record |field /i.test(message)) {
    return new PseudocodeDiagnosticError(create('runtime.record', message, { detail }, lineHint));
  }
  if (/Class |class |SUPER|superclass|constructor/i.test(message)) {
    return new PseudocodeDiagnosticError(create('runtime.class', message, { detail }, lineHint));
  }
  if (/(?:IF|WHILE|UNTIL|CASE) condition|CASE value|CASE ranges/i.test(message)) {
    return new PseudocodeDiagnosticError(create('runtime.condition', message, { detail }, lineHint));
  }
  if (/FOR |loop STEP/i.test(message)) {
    return new PseudocodeDiagnosticError(create('runtime.loop', message, { detail }, lineHint));
  }

  const phase = /\b(?:Expected|Unexpected|Invalid|Syntax error)\b/i.test(message)
    ? 'syntax.generic'
    : 'runtime.generic';
  return new PseudocodeDiagnosticError(create(phase, message, { detail }, lineHint));
}

function localizedDetail(value: DiagnosticValue, locale: Locale): string {
  let result = String(value);
  if (locale === 'zh') {
    for (const [pattern, replacement] of diagnosticTermsZh) {
      result = result.replace(pattern, replacement);
    }
  }
  return result;
}

export function formatDiagnostic(
  diagnostic: PseudocodeDiagnostic,
  locale: Locale,
): string {
  const messages = locale === 'zh' ? errorMessagesZh : errorMessagesEn;
  const tokenNames = locale === 'zh' ? tokenNamesZh : tokenNamesEn;
  const params: Record<string, DiagnosticValue> = { ...diagnostic.params };

  if (params.expectedToken) {
    params.expected = tokenNames[String(params.expectedToken)] ?? String(params.expectedToken);
  }
  if (params.actualToken) {
    params.actual = tokenNames[String(params.actualToken)] ?? `'${params.actualValue ?? params.actualToken}'`;
  }

  let message = messages[diagnostic.code] ?? messages['runtime.generic'];
  for (const [name, value] of Object.entries(params)) {
    message = message.replaceAll(`{${name}}`, localizedDetail(value, locale));
  }
  return message.replace(/\s+\.$/, '.').trim();
}

export function getDiagnosticExplanation(
  diagnostic: PseudocodeDiagnostic,
  locale: Locale,
) {
  const explanations =
    locale === 'zh' ? diagnosticExplanationsZh : diagnosticExplanationsEn;
  return explanations[diagnostic.code];
}
