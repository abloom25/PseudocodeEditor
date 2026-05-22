export type Syllabus = 'igcse-0478' | 'alevel-9618';

export type EditorTheme = 'nightlight' | 'dark' | 'light' | 'monokai' | 'dracula' | 'solarized-dark' | 'solarized-light';

export type DesktopLayout = 'side-by-side' | 'stacked' | 'editor-only' | 'panel-only';

export interface DeclaredVariable { name: string; type: string; line: number; }
export interface DeclaredConstant { name: string; type: string; value: string; line: number; }
export interface DeclaredFunction { name: string; params: string[]; returnType: string; line: number; }
export interface DeclaredProcedure { name: string; params: string[]; line: number; }
export interface DeclaredArray { name: string; dimensions: string; elementType: string; line: number; }
export interface DeclaredType { name: string; kind: string; line: number; }
export interface DeclaredSymbols {
  variables: DeclaredVariable[];
  constants: DeclaredConstant[];
  functions: DeclaredFunction[];
  procedures: DeclaredProcedure[];
  arrays: DeclaredArray[];
  types: DeclaredType[];
}

export interface UIThemeColors {
  bg: string;
  text: string;
  headerBg: string;
  headerBorder: string;
  headerText: string;
  badgeBg: string;
  badgeText: string;
  buttonText: string;
  buttonHover: string;
  dropdownBg: string;
  dropdownBorder: string;
  dropdownItemText: string;
  dropdownItemHover: string;
  outputBg: string;
  outputBorder: string;
  tabActiveBg: string;
  tabActiveText: string;
  tabText: string;
  tabHoverText: string;
  outputLineBorder: string;
  outputSuccessText: string;
  outputErrorText: string;
  outputDimText: string;
  refCodeBg: string;
  separatorBg: string;
  dividerBg: string;
  dividerHover: string;
  runBtnBg: string;
  runBtnHover: string;
  runBtnText: string;
}

export interface ArrayData {
  bounds: number[][];
  is2D: boolean;
  elementType: string;
  data: Record<string, unknown>;
}

export interface TraceEntry {
  line?: number;
  variables: Record<string, unknown>;
  output?: string;
}
