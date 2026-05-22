'use client';

import { getThemeColors } from '../config';

interface SyntaxHighlighterProps {
  code: string;
  theme: string;
}

export function SyntaxHighlighter({ code, theme }: SyntaxHighlighterProps) {
  const colors = getThemeColors(theme);

  const highlightJson = (json: string) => {
    return json
      .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
        let cls = colors.number;
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = colors.key;
          } else {
            cls = colors.string;
          }
        } else if (/true|false/.test(match)) {
          cls = colors.boolean;
        } else if (/null/.test(match)) {
          cls = colors.null;
        }
        return `<span class="${cls}">${match}</span>`;
      });
  };

  return (
    <code
      dangerouslySetInnerHTML={{
        __html: highlightJson(code),
      }}
    />
  );
}
