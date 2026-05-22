export function friendlyErrorMessage(msg: string): string {
  let m = msg.match(/Expected (\w+) but got (\w+)\s*\('?(.*?)'?\)\s*at line (\d+)/);
  if (m) {
    const [, expected, , got, line] = m;
    const expectedMap: Record<string, string> = {
      ASSIGN: '← (赋值符号)',
      THEN: 'THEN',
      TO: 'TO',
      DO: 'DO',
      ENDCASE: 'ENDCASE',
      ENDIF: 'ENDIF',
      ENDWHILE: 'ENDWHILE',
      NEXT: 'NEXT',
      ENDFUNCTION: 'ENDFUNCTION',
      ENDPROCEDURE: 'ENDPROCEDURE',
      RETURNS: 'RETURNS',
      OF: 'OF',
      COLON: ': (冒号)',
      COMMA: ', (逗号)',
      LPAREN: '( (左括号)',
      RPAREN: ') (右括号)',
      LBRACKET: '[ (左方括号)',
      RBRACKET: '] (右方括号)',
      SEMICOLON: '; (分号)',
    };
    const gotMap: Record<string, string> = {
      IDENTIFIER: '标识符',
      NUMBER: '数字',
      STRING: '字符串',
      EOF: '文件结尾',
      ASSIGN: '←',
    };
    const e = expectedMap[expected] || expected;
    const g = gotMap[got] || got;
    return `第 ${line} 行：期望 ${e}，但遇到了 ${g === got ? `'${got}'` : g}`;
  }

  if (msg.includes("Unexpected assignment operator")) {
    const m2 = msg.match(/at line (\d+)/);
    return `第 ${m2?.[1] || '?'} 行：赋值符号 '<-' 前缺少变量名`;
  }

  m = msg.match(/OUTPUT requires at least one expression at line (\d+)/);
  if (m) {
    return `第 ${m[1]} 行：OUTPUT 后缺少要输出的表达式`;
  }

  m = msg.match(/RETURN cannot be followed by '(.*?)' at line (\d+)/);
  if (m) {
    const [, kw, line] = m;
    return `第 ${line} 行：RETURN 后不能跟 '${kw}'`;
  }

  m = msg.match(/Unexpected token\s+'?(.*?)'?\s+at line (\d+)/);
  if (m) {
    const [, got, line] = m;
    return `第 ${line} 行：意外的标记 '${got}'`;
  }

  if (msg.includes('Unexpected end of code')) {
    const m2 = msg.match(/at line (\d+)/);
    return `第 ${m2?.[1] || '?'} 行：代码不完整，可能缺少 ENDIF、ENDWHILE、NEXT、ENDFUNCTION 或 ENDPROCEDURE`;
  }

  if (msg.includes('Unexpected end of input')) {
    return '代码不完整：可能缺少 ENDIF、ENDWHILE、NEXT、ENDFUNCTION 或 ENDPROCEDURE';
  }

  m = msg.match(/Type error: cannot convert "([^"]*)" to (\w+) for variable (\w+)/);
  if (m) {
    const [, value, type, varName] = m;
    const typeMap: Record<string, string> = {
      INTEGER: '整数',
      REAL: '实数',
      BOOLEAN: '布尔值 (TRUE/FALSE)',
      CHAR: '单个字符',
    };
    return `类型错误：无法将 "${value}" 转换为 ${typeMap[type] || type}（变量 ${varName}）`;
  }

  m = msg.match(/Undefined variable ['"](\w+)['"]/);
  if (m) {
    return `变量 '${m[1]}' 未声明，请先使用 DECLARE 声明或赋值`;
  }

  m = msg.match(/Undefined (function|procedure):\s+(\w+)/);
  if (m) {
    const kind = m[1] === 'function' ? '函数' : '过程';
    return `未定义的${kind}：${m[2]}`;
  }

  if (msg.includes('Division by zero')) return '运行时错误：除以零';
  if (msg.includes('Maximum iterations exceeded')) return '运行时错误：循环次数超限（可能存在无限循环）';
  if (msg.includes('Maximum call depth exceeded')) return '运行时错误：递归深度超限（可能存在无限递归）';
  if (msg.includes('aborted by user')) return '执行已被用户中断';

  m = msg.match(/Array index out of bounds.*accessing\s+(\d+)/);
  if (m) return `数组索引越界：访问了索引 ${m[1]}`;

  if (msg.includes('End of file reached')) return '文件读取错误：已到达文件末尾';
  if (msg.includes('File') && msg.includes('not open')) return '文件操作错误：文件未打开';
  if (msg.includes('RETURN statement outside')) return 'RETURN 语句只能在函数内部使用';

  const lineMatch = msg.match(/at line (\d+)/);
  if (lineMatch) return `第 ${lineMatch[1]} 行：${msg}`;

  return msg;
}
