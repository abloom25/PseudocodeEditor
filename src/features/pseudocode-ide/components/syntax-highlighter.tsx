'use client';

// 简单的 JSON 语法高亮组件
const SyntaxHighlighter = ({ code, theme }: { code: string; theme: string }) => {
  // 不同主题的配色
  const getThemeColors = (themeName: string) => {
    switch (themeName) {
      case 'monokai':
        return {
          key: 'text-purple-400',
          string: 'text-yellow-300',
          number: 'text-orange-300',
          boolean: 'text-green-400',
          null: 'text-gray-500',
        };
      case 'dracula':
        return {
          key: 'text-purple-300',
          string: 'text-yellow-200',
          number: 'text-purple-400',
          boolean: 'text-green-400',
          null: 'text-gray-500',
        };
      case 'solarized-dark':
        return {
          key: 'text-yellow-600',
          string: 'text-green-700',
          number: 'text-cyan-600',
          boolean: 'text-orange-600',
          null: 'text-gray-500',
        };
      case 'solarized-light':
        return {
          key: 'text-yellow-700',
          string: 'text-green-700',
          number: 'text-cyan-700',
          boolean: 'text-orange-700',
          null: 'text-gray-500',
        };
      case 'light':
        return {
          key: 'text-purple-600',
          string: 'text-green-600',
          number: 'text-cyan-600',
          boolean: 'text-amber-600',
          null: 'text-gray-500',
        };
      default: // Slate Dark (slate)
        return {
          key: 'text-purple-400',
          string: 'text-green-400',
          number: 'text-cyan-400',
          boolean: 'text-amber-400',
          null: 'text-slate-500',
        };
    }
  };

  const colors = getThemeColors(theme);

  const highlightJson = (json: string) => {
    return json
      .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
        let cls = colors.number; // 默认数字
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = colors.key; // 键
          } else {
            cls = colors.string; // 字符串
          }
        } else if (/true|false/.test(match)) {
          cls = colors.boolean; // 布尔值
        } else if (/null/.test(match)) {
          cls = colors.null; // null
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
};

export { SyntaxHighlighter };
