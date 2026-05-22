import type { languages as MonacoLanguages } from 'monaco-editor';
import type { Syllabus, DeclaredSymbols } from '../types';
import { completions, hoverDocs } from '../config';
import { extractDeclaredSymbols } from '../utils/declared-symbols';

type MonacoType = unknown;

export function registerPseudocodeProviders(monaco: MonacoType, syllabus: Syllabus) {
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
    extraFunctions?: string[];
    extraSnippets?: Record<string, { body: string[]; description: string }>;
  };

  const igcseDoc = hoverDocs['igcse-0478'] as { keywords?: Record<string, string>; builtins?: Record<string, string> } | undefined;
  const alevelDoc = hoverDocs['alevel-9618'] as { keywords?: Record<string, string>; builtins?: Record<string, string> } | undefined;
  const commonKeywordDocs = (hoverDocs.common as { keywords: Record<string, string> }).keywords;
  const commonTypeDocs = (hoverDocs.common as { types: Record<string, string> }).types;
  const commonBuiltinDocs = (hoverDocs.common as { builtins: Record<string, string> }).builtins;

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

      const allKeywords = [
        ...common.keywords,
        ...(syllabusConfig.extraKeywords || []),
        ...(syllabus === 'igcse-0478' ? ['DO'] : []),
      ];
      for (const kw of allKeywords) {
        suggestions.push({ label: kw, kind: m.languages.CompletionItemKind.Keyword, insertText: kw, range });
      }

      for (const dt of common.typeKeywords) {
        suggestions.push({ label: dt, kind: m.languages.CompletionItemKind.TypeParameter, insertText: dt, range });
      }

      const allFunctions = [
        ...common.functions,
        ...(syllabusConfig.extraFunctions || []),
      ];
      for (const fn of allFunctions) {
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
          detail: `${v.type} - Variable`,
          documentation: `Declared as \`${v.type}\` on line ${v.line}`,
          range,
        });
      }
      for (const c of declaredSymbols.constants) {
        suggestions.push({
          label: c.name,
          kind: m.languages.CompletionItemKind.Constant,
          insertText: c.name,
          detail: `${c.type} - Constant`,
          documentation: `Value: \`${c.value}\``,
          range,
        });
      }
      for (const f of declaredSymbols.functions) {
        suggestions.push({
          label: f.name,
          kind: m.languages.CompletionItemKind.Function,
          insertText: f.params.length > 0 ? `${f.name}(${f.params.map((_, i) => `\${${i + 1}:${f.params[i]}}`).join(', ')})` : `${f.name}()`,
          insertTextRules: m.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: `FUNCTION - Returns ${f.returnType || 'unknown'}`,
          documentation: `**Signature**: \`${f.name}(${f.params.join(', ')}) RETURNS ${f.returnType || '?'}\``,
          range,
        });
      }
      for (const p of declaredSymbols.procedures) {
        suggestions.push({
          label: p.name,
          kind: m.languages.CompletionItemKind.Method,
          insertText: p.params.length > 0 ? `${p.name}(${p.params.map((_, i) => `\${${i + 1}:${p.params[i]}}`).join(', ')})` : `${p.name}`,
          insertTextRules: m.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: 'PROCEDURE',
          documentation: `**Signature**: \`${p.name}(${p.params.join(', ')})\``,
          range,
        });
      }
      for (const a of declaredSymbols.arrays) {
        suggestions.push({
          label: a.name,
          kind: m.languages.CompletionItemKind.Variable,
          insertText: a.name,
          detail: `ARRAY${a.dimensions} - ${a.elementType}`,
          documentation: `Declared as \`${a.dimensions} OF ${a.elementType}\` on line ${a.line}`,
          range,
        });
      }
      for (const t of declaredSymbols.types) {
        suggestions.push({
          label: t.name,
          kind: m.languages.CompletionItemKind.TypeParameter,
          insertText: t.name,
          detail: `TYPE (${t.kind})`,
          documentation: `User-defined type \`${t.name}\` (${t.kind}) declared on line ${t.line}`,
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
          documentation: snippet.description,
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
          contents: [{ value: `### 📦 Variable: \`${varMatch.name}\`\n\n**Type**: \`${varMatch.type}\`\n**Declared on line**: ${varMatch.line}\n\nDeclared with \`DECLARE ${varMatch.name} : ${varMatch.type}\`` }],
        };
      }

      const constMatch = declaredSymbols.constants.find(c => c.name === word.word);
      if (constMatch) {
        return {
          range: { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn },
          contents: [{ value: `### 🔒 Constant: \`${constMatch.name}\`\n\n**Type**: \`${constMatch.type}\`\n**Value**: \`${constMatch.value}\`\n\nDeclared with \`CONSTANT ${constMatch.name} <- ${constMatch.value}\`` }],
        };
      }

      const funcMatch = declaredSymbols.functions.find(f => f.name === word.word);
      if (funcMatch) {
        return {
          range: { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn },
          contents: [{ value: `### ƒ Function: \`${funcMatch.name}\`\n\n**Signature**: \`${funcMatch.name}(${funcMatch.params.join(', ')})\`\n**Returns**: \`${funcMatch.returnType || 'unknown'}\`\n**Declared on line**: ${funcMatch.line}` }],
        };
      }

      const procMatch = declaredSymbols.procedures.find(p => p.name === word.word);
      if (procMatch) {
        return {
          range: { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn },
          contents: [{ value: `### ◯ Procedure: \`${procMatch.name}\`\n\n**Signature**: \`${procMatch.name}(${procMatch.params.join(', ')})\`\n**Declared on line**: ${procMatch.line}` }],
        };
      }

      const arrMatch = declaredSymbols.arrays.find(a => a.name === word.word);
      if (arrMatch) {
        return {
          range: { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn },
          contents: [{ value: `### 📋 Array: \`${arrMatch.name}\`\n\n**Dimensions**: \`${arrMatch.dimensions}\`\n**Element Type**: \`${arrMatch.elementType}\`\n**Declared on line**: ${arrMatch.line}\n\nDeclared with \`DECLARE ${arrMatch.name} : ARRAY${arrMatch.dimensions} OF ${arrMatch.elementType}\`` }],
        };
      }

      const typeMatch = declaredSymbols.types.find(t => t.name === word.word);
      if (typeMatch) {
        return {
          range: { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn },
          contents: [{ value: `### 🏷️ User-defined Type: \`${typeMatch.name}\`\n\n**Kind**: \`${typeMatch.kind}\`\n**Declared on line**: ${typeMatch.line}` }],
        };
      }

      let description: string | undefined;

      if (commonKeywordDocs[word.word]) description = commonKeywordDocs[word.word];
      else if (commonTypeDocs[word.word]) description = commonTypeDocs[word.word];
      else if (commonBuiltinDocs[word.word]) description = commonBuiltinDocs[word.word];

      if (!description && syllabus === 'igcse-0478' && igcseDoc) {
        if ((igcseDoc.keywords as Record<string, string>)?.[word.word]) description = (igcseDoc.keywords as Record<string, string>)[word.word];
        else if ((igcseDoc.builtins as Record<string, string>)?.[word.word]) description = (igcseDoc.builtins as Record<string, string>)[word.word];
      }
      if (!description && syllabus === 'alevel-9618' && alevelDoc) {
        if ((alevelDoc.keywords as Record<string, string>)?.[word.word]) description = (alevelDoc.keywords as Record<string, string>)[word.word];
        else if ((alevelDoc.builtins as Record<string, string>)?.[word.word]) description = (alevelDoc.builtins as Record<string, string>)[word.word];
      }

      if (description) {
        let finalDesc = description;
        if (description.includes('CONSTANT name') && !description.includes('CONSTANT name =')) {
          const constSyntax = syllabus === 'igcse-0478' ? '<-' : '=';
          finalDesc = description.replace('CONSTANT name <-', `CONSTANT name ${constSyntax}`).replace('CONSTANT name <-', `CONSTANT name ${constSyntax}`);
        }
        if (description.includes('WHILE condition') && !description.includes('condition DO') && !description.includes('condition\\n')) {
          finalDesc = syllabus === 'igcse-0478'
            ? description.replace('WHILE condition', 'WHILE condition DO')
            : description.replace('WHILE condition DO', 'WHILE condition').replace('condition DO', 'condition');
        }

        return {
          range: { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn },
          contents: [{ value: finalDesc }],
        };
      }

      return null;
    },
  }));

  return { dispose: () => disposables.forEach(d => d.dispose()) };
}
