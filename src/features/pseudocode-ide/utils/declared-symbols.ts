import type { DeclaredSymbols } from '../types';

const KEYWORDS = [
  'IF', 'THEN', 'ELSE', 'ENDIF', 'FOR', 'TO', 'STEP', 'NEXT', 'WHILE', 'DO', 'ENDWHILE',
  'REPEAT', 'UNTIL', 'CASE', 'OF', 'OTHERWISE', 'ENDCASE', 'PROCEDURE', 'FUNCTION',
  'ENDPROCEDURE', 'ENDFUNCTION', 'RETURN', 'RETURNS', 'CONSTANT', 'DECLARE', 'INPUT',
  'OUTPUT', 'ARRAY', 'OPENFILE', 'CALL', 'READFILE', 'WRITEFILE', 'CLOSEFILE',
  'AND', 'OR', 'NOT', 'TRUE', 'FALSE', 'BYREF', 'BYVAL'
];

const PRIMITIVE_TYPES = ['INTEGER', 'REAL', 'CHAR', 'STRING', 'BOOLEAN'];

export function extractDeclaredSymbols(code: string): DeclaredSymbols {
  const variables: DeclaredSymbols['variables'] = [];
  const constants: DeclaredSymbols['constants'] = [];
  const functions: DeclaredSymbols['functions'] = [];
  const procedures: DeclaredSymbols['procedures'] = [];
  const arrays: DeclaredSymbols['arrays'] = [];

  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineNum = i + 1;

    const declareMatch = line.match(/^DECLARE\s+(\w+)\s*:\s*(?!ARRAY\s)(\w+)/i);
    if (declareMatch) {
      const name = declareMatch[1];
      const type = declareMatch[2].toUpperCase();
      if (!KEYWORDS.includes(name.toUpperCase()) && !PRIMITIVE_TYPES.includes(name.toUpperCase())) {
        variables.push({ name, type, line: lineNum });
      }
    }

    const arrayMatch = line.match(/^DECLARE\s+(\w+)\s*:\s*ARRAY(\[.*?\](?:\s*,\s*\[.*?\])*)\s+OF\s+(\w+)/i);
    if (arrayMatch) {
      arrays.push({ name: arrayMatch[1], dimensions: arrayMatch[2].trim(), elementType: arrayMatch[3].toUpperCase(), line: lineNum });
    }

    const constMatch = line.match(/^CONSTANT\s+(\w+)\s*<-\s*(.+)/i);
    if (constMatch) {
      const name = constMatch[1];
      const value = constMatch[2].trim();
      let type = 'UNKNOWN';
      if (/^".*"$/.test(value)) type = 'STRING';
      else if (/^'.'$/.test(value)) type = 'CHAR';
      else if (/^\d+\.\d+$/.test(value)) type = 'REAL';
      else if (/^\d+$/.test(value)) type = 'INTEGER';
      else if (value.toUpperCase() === 'TRUE' || value.toUpperCase() === 'FALSE') type = 'BOOLEAN';
      constants.push({ name, type, value, line: lineNum });
    }

    const funcMatch = line.match(/^FUNCTION\s+(\w+)\s*\(([^)]*)\)\s*RETURNS\s+(\w+)/i);
    if (funcMatch) {
      const name = funcMatch[1];
      const paramsStr = funcMatch[2].trim();
      const returnType = funcMatch[3].toUpperCase();
      const params = paramsStr ? paramsStr.split(',').map(p => p.trim()) : [];
      functions.push({ name, params, returnType, line: lineNum });
    }

    const procMatch = line.match(/^PROCEDURE\s+(\w+)\s*\(([^)]*)\)/i);
    if (procMatch) {
      const name = procMatch[1];
      const paramsStr = procMatch[2].trim();
      const params = paramsStr ? paramsStr.split(',').map(p => p.trim()) : [];
      procedures.push({ name, params, line: lineNum });
    }
  }

  return { variables, constants, functions, procedures, arrays };
}
