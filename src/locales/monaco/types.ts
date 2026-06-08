import type { Syllabus } from '@/features/pseudocode-ide/types';

export type MonacoLanguagePack = {
  variableDetail: (type: string) => string;
  declaredAs: (type: string, line: number) => string;
  constantDetail: (type: string) => string;
  value: (value: string) => string;
  functionDetail: (returnType: string) => string;
  signature: (signature: string) => string;
  procedureDetail: string;
  arrayDeclaredAs: (dimensions: string, elementType: string, line: number) => string;
  typeDetail: (kind: string) => string;
  typeDeclared: (name: string, kind: string, line: number) => string;
  snippet: (name: string, description: string) => string;
  variableHover: (name: string, type: string, line: number) => string;
  constantHover: (name: string, type: string, value: string) => string;
  functionHover: (name: string, params: string[], returnType: string, line: number) => string;
  procedureHover: (name: string, params: string[], line: number) => string;
  arrayHover: (name: string, dimensions: string, elementType: string, line: number) => string;
  typeHover: (name: string, kind: string, line: number) => string;
  syllabusHover: (
    word: string,
    syllabus: Syllabus,
    category: 'data type' | 'built-in operation' | 'keyword',
    detailedDescription?: string,
  ) => string;
};
