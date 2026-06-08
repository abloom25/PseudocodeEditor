import type { MonacoLanguagePack } from './types';

export const monacoEn: MonacoLanguagePack = {
  variableDetail: type => `${type} - Variable`,
  declaredAs: (type, line) => `Declared as \`${type}\` on line ${line}`,
  constantDetail: type => `${type} - Constant`,
  value: value => `Value: \`${value}\``,
  functionDetail: returnType => `FUNCTION - Returns ${returnType || 'unknown'}`,
  signature: signature => `**Signature**: \`${signature}\``,
  procedureDetail: 'PROCEDURE',
  arrayDeclaredAs: (dimensions, elementType, line) =>
    `Declared as \`${dimensions} OF ${elementType}\` on line ${line}`,
  typeDetail: kind => `TYPE (${kind})`,
  typeDeclared: (name, kind, line) =>
    `User-defined type \`${name}\` (${kind}) declared on line ${line}`,
  snippet: (_name, description) => description,
  variableHover: (name, type, line) =>
    `### Variable: \`${name}\`\n\n**Type**: \`${type}\`\n**Declared on line**: ${line}\n\nDeclared with \`DECLARE ${name} : ${type}\``,
  constantHover: (name, type, value) =>
    `### Constant: \`${name}\`\n\n**Type**: \`${type}\`\n**Value**: \`${value}\``,
  functionHover: (name, params, returnType, line) =>
    `### Function: \`${name}\`\n\n**Signature**: \`${name}(${params.join(', ')})\`\n**Returns**: \`${returnType || 'unknown'}\`\n**Declared on line**: ${line}`,
  procedureHover: (name, params, line) =>
    `### Procedure: \`${name}\`\n\n**Signature**: \`${name}(${params.join(', ')})\`\n**Declared on line**: ${line}`,
  arrayHover: (name, dimensions, elementType, line) =>
    `### Array: \`${name}\`\n\n**Dimensions**: \`${dimensions}\`\n**Element Type**: \`${elementType}\`\n**Declared on line**: ${line}`,
  typeHover: (name, kind, line) =>
    `### User-defined Type: \`${name}\`\n\n**Kind**: \`${kind}\`\n**Declared on line**: ${line}`,
  syllabusHover: (word, syllabus, category) =>
    `### ${word}\n\nCambridge ${syllabus === 'alevel-9618' ? 'A Level 9618' : 'IGCSE 0478'} pseudocode ${category}.\n\nUse the **Reference** panel for the syllabus-specific syntax.`,
};
