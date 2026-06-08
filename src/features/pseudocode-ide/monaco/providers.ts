import type { languages as MonacoLanguages } from 'monaco-editor';
import type { Locale } from '@/lib/i18n';
import { monacoLanguagePacks } from '@/locales/monaco';
import type { Syllabus, DeclaredSymbols } from '../types';
import { completions, hoverDocs } from '../config';
import { extractDeclaredSymbols } from '../utils/declared-symbols';

type MonacoType = unknown;

export function registerPseudocodeProviders(monaco: MonacoType, syllabus: Syllabus, locale: Locale = 'en') {
  const text = monacoLanguagePacks[locale];
  const m = monaco as {
    languages: {
      registerCompletionItemProvider: (selector: string, provider: object) => { dispose: () => void };
      registerHoverProvider: (selector: string, provider: object) => { dispose: () => void };
      CompletionItemKind: Record<string, number>;
      CompletionItemInsertTextRule: Record<string, number>;
    };
  };

  const disposables: { dispose: () => void }[] = [];

  const common = completions.common;
  const syllabusConfig = completions[syllabus] as {
    extraKeywords?: string[];
    extraTypes?: string[];
    extraFunctions?: string[];
    extraSnippets?: Record<string, { body: string[]; description: string }>;
  };

  const igcseDoc = hoverDocs['igcse-0478'] as { keywords?: Record<string, string>; builtins?: Record<string, string> } | undefined;
  const alevelDoc = hoverDocs['alevel-9618'] as { keywords?: Record<string, string>; builtins?: Record<string, string> } | undefined;
  const commonKeywordDocs = (hoverDocs.common as { keywords: Record<string, string> }).keywords;
  const commonTypeDocs = (hoverDocs.common as { types: Record<string, string> }).types;
  const commonBuiltinDocs = (hoverDocs.common as { builtins: Record<string, string> }).builtins;
  const effectiveKeywords = new Set([
    ...common.keywords,
    ...(syllabusConfig.extraKeywords || []),
    ...(syllabus === 'igcse-0478' ? ['DO'] : []),
  ]);
  const effectiveTypes = new Set([
    ...common.typeKeywords,
    ...(syllabusConfig.extraTypes || []),
  ]);
  const effectiveFunctions = new Set([
    ...common.functions,
    ...(syllabusConfig.extraFunctions || []),
  ]);
  const alevelOperators = new Set(['DIV', 'MOD']);

  disposables.push(m.languages.registerCompletionItemProvider('pseudocode', {
    provideCompletionItems: (model: { getWordUntilPosition: (pos: unknown) => { startColumn: number; endColumn: number }; getValue: () => string }, position: { lineNumber: number }) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const code = model.getValue();
      const declaredSymbols: DeclaredSymbols = extractDeclaredSymbols(code);
      const suggestions: MonacoLanguages.CompletionItem[] = [];

      for (const kw of effectiveKeywords) {
        suggestions.push({ label: kw, kind: m.languages.CompletionItemKind.Keyword, insertText: kw, range });
      }

      for (const dt of effectiveTypes) {
        suggestions.push({ label: dt, kind: m.languages.CompletionItemKind.TypeParameter, insertText: dt, range });
      }

      for (const fn of effectiveFunctions) {
        suggestions.push({
          label: fn,
          kind: m.languages.CompletionItemKind.Function,
          insertText: `${fn}($1)`,
          insertTextRules: m.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
        });
      }

      for (const v of declaredSymbols.variables) {
        suggestions.push({
          label: v.name,
          kind: m.languages.CompletionItemKind.Variable,
          insertText: v.name,
          detail: text.variableDetail(v.type),
          documentation: text.declaredAs(v.type, v.line),
          range,
        });
      }
      for (const c of declaredSymbols.constants) {
        suggestions.push({
          label: c.name,
          kind: m.languages.CompletionItemKind.Constant,
          insertText: c.name,
          detail: text.constantDetail(c.type),
          documentation: text.value(c.value),
          range,
        });
      }
      for (const f of declaredSymbols.functions) {
        suggestions.push({
          label: f.name,
          kind: m.languages.CompletionItemKind.Function,
          insertText: f.params.length > 0 ? `${f.name}(${f.params.map((_, i) => `\${${i + 1}:${f.params[i]}}`).join(', ')})` : `${f.name}()`,
          insertTextRules: m.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: text.functionDetail(f.returnType),
          documentation: text.signature(`${f.name}(${f.params.join(', ')}) RETURNS ${f.returnType || '?'}`),
          range,
        });
      }
      for (const p of declaredSymbols.procedures) {
        const args = p.params.map((_, i) => `\${${i + 1}:${p.params[i]}}`).join(', ');
        const call = `${p.name}(${args})`;
        suggestions.push({
          label: p.name,
          kind: m.languages.CompletionItemKind.Method,
          insertText: syllabus === 'alevel-9618' ? `CALL ${call}` : call,
          insertTextRules: m.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: text.procedureDetail,
          documentation: text.signature(`${p.name}(${p.params.join(', ')})`),
          range,
        });
      }
      for (const a of declaredSymbols.arrays) {
        suggestions.push({
          label: a.name,
          kind: m.languages.CompletionItemKind.Variable,
          insertText: a.name,
          detail: `ARRAY${a.dimensions} - ${a.elementType}`,
          documentation: text.arrayDeclaredAs(a.dimensions, a.elementType, a.line),
          range,
        });
      }
      for (const t of declaredSymbols.types) {
        suggestions.push({
          label: t.name,
          kind: m.languages.CompletionItemKind.TypeParameter,
          insertText: t.name,
          detail: text.typeDetail(t.kind),
          documentation: text.typeDeclared(t.name, t.kind, t.line),
          range,
        });
      }

      const allSnippets: Record<string, { body: string[]; description: string }> = {
        ...common.snippets,
        ...(syllabusConfig.extraSnippets || {}),
      };
      if (syllabus === 'igcse-0478') {
        allSnippets['WHILE-DO-ENDWHILE'] = {
          body: ['WHILE ${1:condition} DO', '\t${2:// body}', 'ENDWHILE'],
          description: 'WHILE-DO-ENDWHILE loop',
        };
        allSnippets['WHILE-EOF'] = {
          body: ['WHILE NOT EOF(${1:"filename.txt"}) DO', '\t${2:// read and process file}', 'ENDWHILE'],
          description: 'Read file until EOF',
        };
      } else {
        allSnippets['WHILE-ENDWHILE'] = {
          body: ['WHILE ${1:condition}', '\t${2:// body}', 'ENDWHILE'],
          description: 'WHILE-ENDWHILE loop (no DO)',
        };
        allSnippets['WHILE-EOF'] = {
          body: ['WHILE NOT EOF(${1:"filename.txt"})', '\t${2:// read and process file}', 'ENDWHILE'],
          description: 'Read file until EOF',
        };
      }

      for (const [name, snippet] of Object.entries(allSnippets)) {
        suggestions.push({
          label: name,
          kind: m.languages.CompletionItemKind.Snippet,
          insertText: snippet.body.join('\n'),
          insertTextRules: m.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: text.snippet(name, snippet.description),
          range,
        });
      }

      return { suggestions };
    },
  }));

  disposables.push(m.languages.registerHoverProvider('pseudocode', {
    provideHover: (model: { getWordAtPosition: (pos: unknown) => { word: string; startColumn: number; endColumn: number } | null; getValue: () => string }, position: { lineNumber: number }) => {
      const word = model.getWordAtPosition(position);
      if (!word) return null;

      const code = model.getValue();
      const declaredSymbols: DeclaredSymbols = extractDeclaredSymbols(code);

      const varMatch = declaredSymbols.variables.find(v => v.name === word.word);
      if (varMatch) {
        return {
          range: { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn },
          contents: [{ value: text.variableHover(varMatch.name, varMatch.type, varMatch.line) }],
        };
      }

      const constMatch = declaredSymbols.constants.find(c => c.name === word.word);
      if (constMatch) {
        return {
          range: { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn },
          contents: [{ value: text.constantHover(constMatch.name, constMatch.type, constMatch.value) }],
        };
      }

      const funcMatch = declaredSymbols.functions.find(f => f.name === word.word);
      if (funcMatch) {
        return {
          range: { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn },
          contents: [{ value: text.functionHover(funcMatch.name, funcMatch.params, funcMatch.returnType, funcMatch.line) }],
        };
      }

      const procMatch = declaredSymbols.procedures.find(p => p.name === word.word);
      if (procMatch) {
        return {
          range: { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn },
          contents: [{ value: text.procedureHover(procMatch.name, procMatch.params, procMatch.line) }],
        };
      }

      const arrMatch = declaredSymbols.arrays.find(a => a.name === word.word);
      if (arrMatch) {
        return {
          range: { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn },
          contents: [{ value: text.arrayHover(arrMatch.name, arrMatch.dimensions, arrMatch.elementType, arrMatch.line) }],
        };
      }

      const typeMatch = declaredSymbols.types.find(t => t.name === word.word);
      if (typeMatch) {
        return {
          range: { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn },
          contents: [{ value: text.typeHover(typeMatch.name, typeMatch.kind, typeMatch.line) }],
        };
      }

      let description: string | undefined;
      const isAllowedHover =
        effectiveKeywords.has(word.word) ||
        effectiveTypes.has(word.word) ||
        effectiveFunctions.has(word.word) ||
        (syllabus === 'alevel-9618' && alevelOperators.has(word.word));
      if (!isAllowedHover) return null;

      if (syllabus === 'igcse-0478' && igcseDoc) {
        if ((igcseDoc.keywords as Record<string, string>)?.[word.word]) description = (igcseDoc.keywords as Record<string, string>)[word.word];
        else if ((igcseDoc.builtins as Record<string, string>)?.[word.word]) description = (igcseDoc.builtins as Record<string, string>)[word.word];
      }
      if (syllabus === 'alevel-9618' && alevelDoc) {
        if ((alevelDoc.keywords as Record<string, string>)?.[word.word]) description = (alevelDoc.keywords as Record<string, string>)[word.word];
        else if ((alevelDoc.builtins as Record<string, string>)?.[word.word]) description = (alevelDoc.builtins as Record<string, string>)[word.word];
      }
      if (!description && commonKeywordDocs[word.word]) description = commonKeywordDocs[word.word];
      else if (!description && commonTypeDocs[word.word]) description = commonTypeDocs[word.word];
      else if (!description && commonBuiltinDocs[word.word]) description = commonBuiltinDocs[word.word];

      if (description) {
        const category = effectiveTypes.has(word.word)
          ? 'data type'
          : effectiveFunctions.has(word.word) || alevelOperators.has(word.word)
            ? 'built-in operation'
            : 'keyword';
        return {
          range: { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn },
          contents: [{ value: text.syllabusHover(word.word, syllabus, category, description) }],
        };
      }

      return null;
    },
  }));

  return { dispose: () => disposables.forEach(d => d.dispose()) };
}
