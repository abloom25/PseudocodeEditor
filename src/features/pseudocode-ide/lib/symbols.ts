// 从伪代码中提取已声明的标识符（变量、常量、函数、过程、数组）
interface DeclaredVariable { name: string; type: string; line: number; }
interface DeclaredConstant { name: string; type: string; value: string; line: number; }
interface DeclaredFunction { name: string; params: string[]; returnType: string; line: number; }
interface DeclaredProcedure { name: string; params: string[]; line: number; }
interface DeclaredArray { name: string; dimensions: string; elementType: string; line: number; }
interface DeclaredSymbols {
  variables: DeclaredVariable[];
  constants: DeclaredConstant[];
  functions: DeclaredFunction[];
  procedures: DeclaredProcedure[];
  arrays: DeclaredArray[];
}

function extractDeclaredSymbols(code: string): DeclaredSymbols {
  const variables: DeclaredVariable[] = [];
  const constants: DeclaredConstant[] = [];
  const functions: DeclaredFunction[] = [];
  const procedures: DeclaredProcedure[] = [];
  const arrays: DeclaredArray[] = [];

  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineNum = i + 1;

    // 解析 DECLARE name : TYPE (非数组)
    const declareMatch = line.match(/^DECLARE\s+(\w+)\s*:\s*(?!ARRAY\s)(\w+)/i);
    if (declareMatch) {
      const name = declareMatch[1];
      const type = declareMatch[2].toUpperCase();
      // 排除关键字被误识别
      if (!['INTEGER', 'REAL', 'CHAR', 'STRING', 'BOOLEAN'].includes(name.toUpperCase()) &&
          !['IF', 'THEN', 'ELSE', 'ENDIF', 'FOR', 'TO', 'STEP', 'NEXT', 'WHILE', 'DO', 'ENDWHILE',
            'REPEAT', 'UNTIL', 'CASE', 'OF', 'OTHERWISE', 'ENDCASE', 'PROCEDURE', 'FUNCTION',
            'ENDPROCEDURE', 'ENDFUNCTION', 'RETURN', 'RETURNS', 'CONSTANT', 'DECLARE', 'INPUT',
            'OUTPUT', 'ARRAY', 'OPENFILE', 'CALL', 'READFILE', 'WRITEFILE', 'CLOSEFILE',
            'AND', 'OR', 'NOT', 'TRUE', 'FALSE', 'BYREF', 'BYVAL'].includes(name.toUpperCase())) {
        variables.push({ name, type, line: lineNum });
      }
    }

    // 解析 DECLARE name : ARRAY[...] OF TYPE
    const arrayMatch = line.match(/^DECLARE\s+(\w+)\s*:\s*ARRAY(\[.*?\](?:\s*,\s*\[.*?\])*)\s+OF\s+(\w+)/i);
    if (arrayMatch) {
      arrays.push({ name: arrayMatch[1], dimensions: arrayMatch[2].trim(), elementType: arrayMatch[3].toUpperCase(), line: lineNum });
    }

    // 解析 CONSTANT name <- value
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

    // 解析 FUNCTION Name(params) RETURNS TYPE
    const funcMatch = line.match(/^FUNCTION\s+(\w+)\s*\(([^)]*)\)\s*RETURNS\s+(\w+)/i);
    if (funcMatch) {
      const name = funcMatch[1];
      const paramsStr = funcMatch[2].trim();
      const returnType = funcMatch[3].toUpperCase();
      const params = paramsStr ? paramsStr.split(',').map(p => p.trim()) : [];
      functions.push({ name, params, returnType, line: lineNum });
    }

    // 解析 PROCEDURE Name(params)
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


export type { DeclaredVariable, DeclaredConstant, DeclaredFunction, DeclaredProcedure, DeclaredArray, DeclaredSymbols };
export { extractDeclaredSymbols };
