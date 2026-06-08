import type { MonacoLanguagePack } from './types';

export const monacoZh: MonacoLanguagePack = {
  variableDetail: type => `${type} - 变量`,
  declaredAs: (type, line) => `在第 ${line} 行声明为 \`${type}\``,
  constantDetail: type => `${type} - 常量`,
  value: value => `值：\`${value}\``,
  functionDetail: returnType => `函数 - 返回 ${returnType || '未知'}`,
  signature: signature => `**签名**：\`${signature}\``,
  procedureDetail: '过程',
  arrayDeclaredAs: (dimensions, elementType, line) =>
    `在第 ${line} 行声明为 \`${dimensions} OF ${elementType}\``,
  typeDetail: kind => `类型（${kind}）`,
  typeDeclared: (name, kind, line) =>
    `用户自定义类型 \`${name}\`（${kind}），声明于第 ${line} 行`,
  snippet: name => `代码片段：${name}`,
  variableHover: (name, type, line) =>
    `### 变量：\`${name}\`\n\n**类型**：\`${type}\`\n**声明行**：${line}\n\n声明语句：\`DECLARE ${name} : ${type}\``,
  constantHover: (name, type, value) =>
    `### 常量：\`${name}\`\n\n**类型**：\`${type}\`\n**值**：\`${value}\``,
  functionHover: (name, params, returnType, line) =>
    `### 函数：\`${name}\`\n\n**签名**：\`${name}(${params.join(', ')})\`\n**返回**：\`${returnType || '未知'}\`\n**声明行**：${line}`,
  procedureHover: (name, params, line) =>
    `### 过程：\`${name}\`\n\n**签名**：\`${name}(${params.join(', ')})\`\n**声明行**：${line}`,
  arrayHover: (name, dimensions, elementType, line) =>
    `### 数组：\`${name}\`\n\n**维度**：\`${dimensions}\`\n**元素类型**：\`${elementType}\`\n**声明行**：${line}`,
  typeHover: (name, kind, line) =>
    `### 用户自定义类型：\`${name}\`\n\n**种类**：\`${kind}\`\n**声明行**：${line}`,
  syllabusHover: (_word, syllabus, _category, detailedDescription) => {
    if (!detailedDescription) return '';
    let result = detailedDescription;
    if (result.includes('CONSTANT name') && !result.includes('CONSTANT name =')) {
      const syntax = syllabus === 'igcse-0478' ? '<-' : '=';
      result = result.replaceAll('CONSTANT name <-', `CONSTANT name ${syntax}`);
    }
    if (result.includes('WHILE condition') && !result.includes('condition DO') && !result.includes('condition\\n')) {
      result = syllabus === 'igcse-0478'
        ? result.replace('WHILE condition', 'WHILE condition DO')
        : result.replace('WHILE condition DO', 'WHILE condition').replace('condition DO', 'condition');
    }
    return result;
  },
};
