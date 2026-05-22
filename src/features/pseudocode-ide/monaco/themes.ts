import { editorThemes } from '../config';

type MonacoType = unknown;

export function registerPseudocodeThemes(monaco: MonacoType) {
  const m = monaco as {
    editor: {
      defineTheme: (themeName: string, themeData: object) => void;
    };
  };

  for (const [name, themeData] of Object.entries(editorThemes)) {
    m.editor.defineTheme(name, themeData);
  }
}
