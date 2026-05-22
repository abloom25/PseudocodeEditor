import type { languages as MonacoLanguages } from 'monaco-editor';
import { syntaxHighlighting } from '../config';

type MonacoType = unknown;

export function registerPseudocodeLanguage(monaco: MonacoType) {
  const m = monaco as {
    languages: {
      getLanguages: () => MonacoLanguages.ILanguageExtensionPoint[];
      register: (lang: MonacoLanguages.ILanguageExtensionPoint) => void;
      setMonarchTokensProvider: (langId: string, tokensProvider: object) => void;
      setLanguageConfiguration: (langId: string, config: object) => void;
    };
  };

  const languageExists = m.languages.getLanguages().some((l: MonacoLanguages.ILanguageExtensionPoint) => l.id === 'pseudocode');
  if (!languageExists) {
    m.languages.register({ id: 'pseudocode' });
  }

  const { keywords, typeKeywords, builtins } = syntaxHighlighting;

  m.languages.setMonarchTokensProvider('pseudocode', {
    keywords,
    typeKeywords,
    builtins,
    tokenizer: {
      root: [
        [/\/\/.*$/, 'comment'],
        [/"([^"\\]|\\.)*$/, 'string.invalid'],
        [/"/, { token: 'string.quote', next: '@string' }],
        [/'[^']*'/, 'string'],
        [/<-/, 'keyword'],
        [/\d*\.\d+/, 'number.float'],
        [/\d+/, 'number'],
        [/[A-Za-z_]\w*/, {
          cases: {
            '@keywords': 'keyword',
            '@typeKeywords': 'type',
            '@builtins': 'keyword.builtin',
            '@default': 'identifier',
          },
        }],
        [/[<>]=?/, 'operator'],
        [/[+\-*/^]/, 'operator'],
        [/=/, 'operator'],
        [/[()[\]{},:]/, 'delimiter'],
      ],
      string: [
        [/[^\\"]+/, 'string'],
        [/\\./, 'string.escape'],
        [/"/, { token: 'string.quote', next: '@pop' }],
      ],
    },
  });

  m.languages.setLanguageConfiguration('pseudocode', {
    comments: { lineComment: '//' },
    brackets: [['(', ')'], ['[', ']'], ['{', '}']],
    autoClosingPairs: [
      { open: '(', close: ')' }, { open: '[', close: ']' }, { open: '{', close: '}' },
      { open: '"', close: '"' }, { open: "'", close: "'" }
    ],
    surroundingPairs: [
      { open: '(', close: ')' }, { open: '[', close: ']' }, { open: '{', close: '}' },
      { open: '"', close: '"' }, { open: "'", close: "'" }
    ],
    indentationRules: {
      increaseIndentPattern: /^\s*(IF|THEN|ELSE|ELSEIF|FOR|WHILE|REPEAT|PROCEDURE|FUNCTION|CASE OF|OTHERWISE|TYPE|DEFINE|CLASS|PUBLIC PROCEDURE|PRIVATE PROCEDURE|PUBLIC FUNCTION|PRIVATE FUNCTION)\b/i,
      decreaseIndentPattern: /^\s*(ENDIF|ELSE|ELSEIF|ENDWHILE|UNTIL|ENDPROCEDURE|ENDFUNCTION|ENDCASE|NEXT|ENDFOR|ENDTYPE|ENDCLASS|OTHERWISE)\b/i,
    },
    onEnterRules: [
      {
        beforeText: /^\s*(IF|THEN|ELSE|ELSEIF|FOR\s.*\bTO\b|WHILE\s.*\b(DO)?\b|REPEAT|PROCEDURE|FUNCTION|PUBLIC\s+PROCEDURE|PRIVATE\s+PROCEDURE|PUBLIC\s+FUNCTION|PRIVATE\s+FUNCTION|CASE OF|OTHERWISE|TYPE|CLASS)\s*$/i,
        action: { indentAction: (monaco as { languages: { IndentAction: { Indent: number } } }).languages.IndentAction.Indent },
      },
      {
        beforeText: /^\s*(ENDIF|ENDWHILE|UNTIL|ENDPROCEDURE|ENDFUNCTION|ENDCASE|NEXT|ENDFOR|ENDTYPE|ENDCLASS|OTHERWISE)\s*$/i,
        action: { indentAction: (monaco as { languages: { IndentAction: { Outdent: number } } }).languages.IndentAction.Outdent },
      },
      {
        beforeText: /^\s*(ELSE|ELSEIF)\s*$/i,
        action: { indentAction: (monaco as { languages: { IndentAction: { Outdent: number } } }).languages.IndentAction.Outdent, appendText: '  ' },
      },
    ],
  });
}
