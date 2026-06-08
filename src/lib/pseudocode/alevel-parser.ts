/**
 * Cambridge A-Level Pseudocode Parser
 * 严格遵循 Cambridge International AS & A Level Computer Science 9618 (2027-2029) 伪代码规范
 * 基于 IGCSE 0478 解析器扩展，差异包括：
 * - IF...THEN...ENDIF（THEN 在同一行）
 * - WHILE...ENDWHILE（无 DO）
 * - PROCEDURE 调用必须用 CALL
 * - RIGHT/MID/LCASE/UCASE 字符串函数
 * - RAND(x) 返回 0~x 随机实数
 * - CONSTANT 声明
 * - TYPE/ENDTYPE 用户自定义类型
 * - CLASS/ENDCLASS OOP 支持
 * - EOF() 文件结束检测
 * - FOR...STEP 步进
 * - CASE 支持 TO 范围
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { normalizePseudocodeError } from './diagnostics';

// ─── Return 控制流 ───
class ReturnSignal {
  constructor(public value: unknown, public valueType: string) { }
}

class CaseInsensitiveMap<V> extends Map<string, V> {
  private actualKeys = new Map<string, string>();

  private normalize(key: string): string {
    return key.toUpperCase();
  }

  override set(key: string, value: V): this {
    const normalized = this.normalize(key);
    const actual = this.actualKeys.get(normalized) ?? key;
    this.actualKeys.set(normalized, actual);
    return super.set(actual, value);
  }

  override get(key: string): V | undefined {
    const actual = this.actualKeys.get(this.normalize(key));
    return actual === undefined ? undefined : super.get(actual);
  }

  override has(key: string): boolean {
    return this.actualKeys.has(this.normalize(key));
  }

  override delete(key: string): boolean {
    const normalized = this.normalize(key);
    const actual = this.actualKeys.get(normalized);
    if (actual === undefined) return false;
    this.actualKeys.delete(normalized);
    return super.delete(actual);
  }

  override clear(): void {
    this.actualKeys.clear();
    super.clear();
  }
}

// ─── Token 类型 ───
export enum TokenType {
  // 数据类型
  INTEGER = 'INTEGER', REAL = 'REAL', CHAR = 'CHAR', STRING = 'STRING', BOOLEAN = 'BOOLEAN', DATE = 'DATE',
  // 关键字
  DECLARE = 'DECLARE', CONSTANT = 'CONSTANT', INPUT = 'INPUT', OUTPUT = 'OUTPUT',
  IF = 'IF', THEN = 'THEN', ELSE = 'ELSE', ELSEIF = 'ELSEIF', ENDIF = 'ENDIF',
  CASE = 'CASE', OF = 'OF', OTHERWISE = 'OTHERWISE', ENDCASE = 'ENDCASE',
  FOR = 'FOR', TO = 'TO', STEP = 'STEP', NEXT = 'NEXT', ENDFOR = 'ENDFOR',
  REPEAT = 'REPEAT', UNTIL = 'UNTIL', WHILE = 'WHILE', DO = 'DO', ENDWHILE = 'ENDWHILE',
  PROCEDURE = 'PROCEDURE', FUNCTION = 'FUNCTION',
  ENDPROCEDURE = 'ENDPROCEDURE', ENDFUNCTION = 'ENDFUNCTION',
  RETURNS = 'RETURNS', RETURN = 'RETURN',
  CALL = 'CALL',
  BYREF = 'BYREF', BYVAL = 'BYVAL',
  ARRAY = 'ARRAY', AND = 'AND', OR = 'OR', NOT = 'NOT', TRUE = 'TRUE', FALSE = 'FALSE',
  // 用户自定义类型关键字
  TYPE = 'TYPE', ENDTYPE = 'ENDTYPE', DEFINE = 'DEFINE', SET = 'SET',
  CLASS = 'CLASS', ENDCLASS = 'ENDCLASS', INHERITS = 'INHERITS', PUBLIC = 'PUBLIC', PRIVATE = 'PRIVATE', NEW = 'NEW', SUPER = 'SUPER',
  APPEND = 'APPEND', SEEK = 'SEEK', GETRECORD = 'GETRECORD', PUTRECORD = 'PUTRECORD',
  // 内置函数
  LENGTH = 'LENGTH', LCASE = 'LCASE', UCASE = 'UCASE', SUBSTRING = 'SUBSTRING',
  MID_FUNC = 'MID_FUNC', RIGHT_FUNC = 'RIGHT_FUNC',
  ROUND = 'ROUND', RANDOM = 'RANDOM', RANDOMIZE = 'RANDOMIZE', DIV = 'DIV', MOD = 'MOD', EOF_FUNC = 'EOF_FUNC',
  INT_FUNC = 'INT_FUNC', RND = 'RND', RAND = 'RAND',
  NUM_TO_STRING = 'NUM_TO_STRING', STRING_TO_NUM = 'STRING_TO_NUM',
  // 文件操作 — IGCSE 规范: OPENFILE ... FOR READ/WRITE
  OPENFILE = 'OPENFILE',
  READFILE = 'READFILE', WRITEFILE = 'WRITEFILE', CLOSEFILE = 'CLOSEFILE',
  READ = 'READ', WRITE = 'WRITE',
  // 运算符
  PLUS = 'PLUS', MINUS = 'MINUS', MULTIPLY = 'MULTIPLY', DIVIDE = 'DIVIDE', POWER = 'POWER',
  AMPERSAND = 'AMPERSAND',
  ASSIGN = 'ASSIGN',
  EQUAL = 'EQUAL', NOT_EQUAL = 'NOT_EQUAL', LESS = 'LESS', LESS_EQUAL = 'LESS_EQUAL',
  GREATER = 'GREATER', GREATER_EQUAL = 'GREATER_EQUAL',
  // 界符
  LPAREN = 'LPAREN', RPAREN = 'RPAREN', LBRACKET = 'LBRACKET', RBRACKET = 'RBRACKET',
  COLON = 'COLON', COMMA = 'COMMA',
  DOT = 'DOT',        // 记录字段访问: ClassList[1].Name
  CARET = 'CARET',    // 指针解引用: MyPointer^
  // 字面量 / 标识符
  IDENTIFIER = 'IDENTIFIER', NUMBER = 'NUMBER', REAL_NUMBER = 'REAL_NUMBER',
  STRING_LITERAL = 'STRING_LITERAL', CHAR_LITERAL = 'CHAR_LITERAL',
  COMMENT = 'COMMENT', EOF = 'EOF',
}

export interface Token { type: TokenType; value: string; line: number; column: number; }

// ─── AST 节点类型 ───
export type ASTNodeType =
  | 'Program' | 'VariableDeclaration' | 'ConstantDeclaration' | 'Assignment'
  | 'InputStatement' | 'OutputStatement' | 'ReturnStatement' | 'ProcedureCall'
  | 'IfStatement' | 'CaseStatement' | 'ForLoop' | 'RepeatLoop' | 'WhileLoop'
  | 'ProcedureDeclaration' | 'FunctionDeclaration' | 'FunctionCall'
  | 'BinaryExpression' | 'UnaryExpression'
  | 'Identifier' | 'NumberLiteral' | 'RealLiteral' | 'StringLiteral' | 'CharLiteral' | 'BooleanLiteral' | 'DateLiteral'
  | 'ArrayAccess' | 'ArrayDeclaration'
  | 'FileOpenRead' | 'FileOpenWrite' | 'FileOpenAppend' | 'FileOpenRandom' | 'FileRead' | 'FileWrite' | 'FileClose'
  | 'FileSeek' | 'FileGetRecord' | 'FilePutRecord'
  | 'RandomizeStatement' | 'Empty'
  // 用户自定义类型节点
  | 'TypeDeclaration'        // TYPE MyType ... ENDTYPE
  | 'SetDefinition'         // DEFINE name (...) : SetType
  | 'FieldAccess'          // record.field
  | 'PointerDereference'   // pointer^
  | 'AddressOf'           // ^variable
  | 'ClassDeclaration'    // CLASS ... ENDCLASS
  | 'ObjectCreation'      // NEW ClassName(args)
  | 'MethodCall'          // object.method(args)
  | 'SuperMethodCall';    // SUPER.method(args)

export interface ASTNode { type: ASTNodeType;[key: string]: unknown; }

type ArrayBound = number | string;
type ArrayDimension = { lower: ArrayBound; upper: ArrayBound };
type CallableParameter = {
  name: string;
  type: string;
  byRef?: boolean;
  dimensions?: ArrayDimension[];
  elementType?: string;
};

// ════════════════════════════════════════════════════════════════
//  Lexer
// ════════════════════════════════════════════════════════════════
export class Lexer {
  private source: string;
  private pos = 0;
  private line = 1;
  private column = 1;

  private keywords: Record<string, TokenType> = {
    INTEGER: TokenType.INTEGER, REAL: TokenType.REAL, CHAR: TokenType.CHAR,
    STRING: TokenType.STRING, BOOLEAN: TokenType.BOOLEAN, DATE: TokenType.DATE,
    DECLARE: TokenType.DECLARE, CONSTANT: TokenType.CONSTANT,
    INPUT: TokenType.INPUT, OUTPUT: TokenType.OUTPUT,
    IF: TokenType.IF, THEN: TokenType.THEN, ELSE: TokenType.ELSE, ELSEIF: TokenType.ELSEIF, ENDIF: TokenType.ENDIF,
    CASE: TokenType.CASE, OF: TokenType.OF, OTHERWISE: TokenType.OTHERWISE, ENDCASE: TokenType.ENDCASE,
    FOR: TokenType.FOR, TO: TokenType.TO, STEP: TokenType.STEP, NEXT: TokenType.NEXT, ENDFOR: TokenType.ENDFOR,
    REPEAT: TokenType.REPEAT, UNTIL: TokenType.UNTIL,
    WHILE: TokenType.WHILE, DO: TokenType.DO, ENDWHILE: TokenType.ENDWHILE,
    PROCEDURE: TokenType.PROCEDURE, FUNCTION: TokenType.FUNCTION,
    ENDPROCEDURE: TokenType.ENDPROCEDURE, ENDFUNCTION: TokenType.ENDFUNCTION,
    RETURNS: TokenType.RETURNS, RETURN: TokenType.RETURN,
    CALL: TokenType.CALL,
    BYREF: TokenType.BYREF, BYVAL: TokenType.BYVAL,
    ARRAY: TokenType.ARRAY, AND: TokenType.AND, OR: TokenType.OR, NOT: TokenType.NOT,
    TRUE: TokenType.TRUE, FALSE: TokenType.FALSE,
    // 用户自定义类型
    TYPE: TokenType.TYPE, ENDTYPE: TokenType.ENDTYPE, DEFINE: TokenType.DEFINE, SET: TokenType.SET,
    CLASS: TokenType.CLASS, ENDCLASS: TokenType.ENDCLASS, INHERITS: TokenType.INHERITS,
    PUBLIC: TokenType.PUBLIC, PRIVATE: TokenType.PRIVATE, NEW: TokenType.NEW, SUPER: TokenType.SUPER,
    APPEND: TokenType.APPEND, RANDOM: TokenType.RANDOM, SEEK: TokenType.SEEK,
    GETRECORD: TokenType.GETRECORD, PUTRECORD: TokenType.PUTRECORD,
    LENGTH: TokenType.LENGTH, LCASE: TokenType.LCASE, UCASE: TokenType.UCASE,
    SUBSTRING: TokenType.SUBSTRING, MID: TokenType.MID_FUNC, RIGHT: TokenType.RIGHT_FUNC,
    ROUND: TokenType.ROUND,
    DIV: TokenType.DIV, MOD: TokenType.MOD, EOF: TokenType.EOF_FUNC,
    RANDOMIZE: TokenType.RANDOMIZE, INT: TokenType.INT_FUNC, RND: TokenType.RND, RAND: TokenType.RAND,
    NUM_TO_STRING: TokenType.NUM_TO_STRING, STRING_TO_NUM: TokenType.STRING_TO_NUM,
    OPENFILE: TokenType.OPENFILE, READ: TokenType.READ, WRITE: TokenType.WRITE,
    READFILE: TokenType.READFILE, WRITEFILE: TokenType.WRITEFILE, CLOSEFILE: TokenType.CLOSEFILE,
  };

  constructor(source: string) { this.source = source; }

  private peek(offset = 0): string { return this.source[this.pos + offset] || ''; }
  private advance(): string {
    const ch = this.source[this.pos++];
    if (ch === '\n') { this.line++; this.column = 1; } else { this.column++; }
    return ch;
  }
  private skipWhitespace(): void { while (this.pos < this.source.length && /\s/.test(this.peek())) this.advance(); }

  private readComment(): Token {
    const line = this.line, col = this.column;
    this.advance(); this.advance();
    let c = '';
    while (this.pos < this.source.length && this.peek() !== '\n') c += this.advance();
    return { type: TokenType.COMMENT, value: c.trim(), line, column: col };
  }

  private readIdentifier(): Token {
    const line = this.line, col = this.column;
    let id = '';
    while (this.pos < this.source.length && /[A-Za-z0-9_]/.test(this.peek())) id += this.advance();
    const upper = id.toUpperCase();
    // Built-in functions (LENGTH, LCASE, etc.) are only keywords when followed by '('
    // Otherwise they're regular identifiers (e.g., "Length" as a variable name)
    const builtinFunctions = ['LENGTH', 'LCASE', 'UCASE', 'SUBSTRING', 'MID', 'RIGHT', 'ROUND', 'EOF', 'INT', 'RND', 'RAND', 'NUM_TO_STRING', 'STRING_TO_NUM'];
    if (builtinFunctions.includes(upper)) {
      // Look ahead for '('
      const savedPos = this.pos;
      while (this.pos < this.source.length && /\s/.test(this.peek())) this.advance();
      const nextChar = this.pos < this.source.length ? this.peek() : '';
      this.pos = savedPos; // Restore position
      if (nextChar !== '(') {
        return { type: TokenType.IDENTIFIER, value: id, line, column: col };
      }
    }
    return { type: this.keywords[upper] || TokenType.IDENTIFIER, value: id, line, column: col };
  }

  private readNumber(): Token {
    const line = this.line, col = this.column;
    let n = ''; let real = false;
    while (this.pos < this.source.length && /[0-9.]/.test(this.peek())) {
      if (this.peek() === '.') { if (real) break; real = true; }
      n += this.advance();
    }
    if (n.endsWith('.') || this.peek() === '.') {
      throw new Error(`Invalid numeric literal '${n}${this.peek() === '.' ? '.' : ''}' at line ${line}, column ${col}`);
    }
    return { type: real ? TokenType.REAL_NUMBER : TokenType.NUMBER, value: n, line, column: col };
  }

  private readString(q: string): Token {
    const line = this.line, col = this.column;
    this.advance();
    let s = '';
    while (this.pos < this.source.length && this.peek() !== q && this.peek() !== '\n') s += this.advance();
    if (this.peek() !== q) throw new Error(`Unterminated string literal at line ${line}, column ${col}`);
    this.advance();
    return { type: TokenType.STRING_LITERAL, value: s, line, column: col };
  }

  private readChar(): Token {
    const line = this.line, col = this.column;
    this.advance();
    if (this.pos >= this.source.length || this.peek() === '\n' || this.peek() === "'") {
      throw new Error(`Character literal must contain exactly one character at line ${line}, column ${col}`);
    }
    const ch = this.advance();
    if (this.peek() !== "'") {
      throw new Error(`Character literal must contain exactly one character at line ${line}, column ${col}`);
    }
    this.advance();
    return { type: TokenType.CHAR_LITERAL, value: ch, line, column: col };
  }

  public tokenize(): Token[] {
    const tokens: Token[] = [];
    while (this.pos < this.source.length) {
      this.skipWhitespace();
      if (this.pos >= this.source.length) break;
      const line = this.line, col = this.column, ch = this.peek();

      // 行号跳过：只有在一行的开头才跳过数字
      // 但如果数字后面紧跟冒号（如 CASE 分支 "1 : ..."），则不跳过
      if (/[0-9]/.test(ch) && this.column === 1 && /^\d+\s/.test(this.source.slice(this.pos))) {
        let skip = false;
        let tmp = this.pos;
        while (tmp < this.source.length && /[0-9]/.test(this.source[tmp])) tmp++;
        // 检查数字后面是否紧跟冒号（可能中间有空格），如果是则不跳过（CASE 分支值）
        const afterNum = this.source.slice(tmp).trimStart();
        if (afterNum.startsWith(':')) {
          skip = false;
        } else if (tmp < this.source.length && /\s/.test(this.source[tmp])) {
          skip = true;
        }
        if (skip) { while (this.pos < this.source.length && /[0-9]/.test(this.peek())) this.advance(); continue; }
      }

      if (ch === '/' && this.peek(1) === '/') { tokens.push(this.readComment()); continue; }
      if (/[A-Za-z]/.test(ch)) { tokens.push(this.readIdentifier()); continue; }
      if (/[0-9]/.test(ch)) { tokens.push(this.readNumber()); continue; }
      if (ch === '.' && /[0-9]/.test(this.peek(1))) {
        throw new Error(`Invalid real literal at line ${line}, column ${col}: digits are required before the decimal point`);
      }
      if (ch === '"') { tokens.push(this.readString('"')); continue; }
      if (ch === "'") { tokens.push(this.readChar()); continue; }

      const next = this.peek(1);
      let tok: Token | null = null;
      switch (ch) {
        case '<':
          if (next === '-') {
            tok = { type: TokenType.ASSIGN, value: '<-', line, column: col };
            this.advance();
            this.advance();
          } else if (next === '>') {
            tok = { type: TokenType.NOT_EQUAL, value: '<>', line, column: col };
            this.advance();
            this.advance();
          } else if (next === '=') {
            tok = { type: TokenType.LESS_EQUAL, value: '<=', line, column: col };
            this.advance();
            this.advance();
          } else {
            tok = { type: TokenType.LESS, value: '<', line, column: col };
            this.advance();
          }
          break;
        case '=': tok = { type: TokenType.EQUAL, value: '=', line, column: col }; this.advance(); break;
        case '>':
          if (next === '=') { tok = { type: TokenType.GREATER_EQUAL, value: '>=', line, column: col }; this.advance(); this.advance(); }
          else { tok = { type: TokenType.GREATER, value: '>', line, column: col }; this.advance(); } break;
        case '+': tok = { type: TokenType.PLUS, value: '+', line, column: col }; this.advance(); break;
        case '-': tok = { type: TokenType.MINUS, value: '-', line, column: col }; this.advance(); break;
        case '*': tok = { type: TokenType.MULTIPLY, value: '*', line, column: col }; this.advance(); break;
        case '/': tok = { type: TokenType.DIVIDE, value: '/', line, column: col }; this.advance(); break;
        case '&': tok = { type: TokenType.AMPERSAND, value: '&', line, column: col }; this.advance(); break;
        case '(': tok = { type: TokenType.LPAREN, value: '(', line, column: col }; this.advance(); break;
        case ')': tok = { type: TokenType.RPAREN, value: ')', line, column: col }; this.advance(); break;
        case '[': tok = { type: TokenType.LBRACKET, value: '[', line, column: col }; this.advance(); break;
        case ']': tok = { type: TokenType.RBRACKET, value: ']', line, column: col }; this.advance(); break;
        case ':': tok = { type: TokenType.COLON, value: ':', line, column: col }; this.advance(); break;
        case ',': tok = { type: TokenType.COMMA, value: ',', line, column: col }; this.advance(); break;
        case '.': tok = { type: TokenType.DOT, value: '.', line, column: col }; this.advance(); break;
        case '^': tok = { type: TokenType.CARET, value: '^', line, column: col }; this.advance(); break;
      }
      if (tok) {
        tokens.push(tok);
      } else {
        throw new Error(`Unexpected character '${ch}' at line ${line}, column ${col}`);
      }
    }
    tokens.push({ type: TokenType.EOF, value: '', line: this.line, column: this.column });
    return tokens;
  }
}

// ════════════════════════════════════════════════════════════════
//  Parser
// ════════════════════════════════════════════════════════════════
export class Parser {
  private tokens: Token[];
  private pos = 0;
  private functionDepth = 0;
  private procedureDepth = 0;

  constructor(tokens: Token[]) { this.tokens = tokens.filter(t => t.type !== TokenType.COMMENT); }

  private peek(offset = 0): Token { const i = this.pos + offset; return i < this.tokens.length ? this.tokens[i] : this.tokens[this.tokens.length - 1]; }
  private advance(): Token { return this.tokens[this.pos++]; }
  private expect(type: TokenType): Token {
    const t = this.advance();
    if (t.type !== type) throw new Error(`Expected ${type} but got ${t.type} ('${t.value}') at line ${t.line}`);
    return t;
  }
  private match(type: TokenType): boolean { if (this.peek().type === type) { this.advance(); return true; } return false; }

  public parse(): ASTNode {
    const stmts: ASTNode[] = [];
    while (this.peek().type !== TokenType.EOF) stmts.push(this.parseStatement());
    return { type: 'Program', statements: stmts };
  }

  /** 带错误恢复的语法检查，返回所有语法错误（不抛异常） */
  public checkSyntax(): Array<{ line: number; message: string }> {
    const errors: Array<{ line: number; message: string }> = [];
    const savedPos = this.pos;
    this.pos = 0;

    while (this.peek().type !== TokenType.EOF && errors.length < 50) {
      const startPos = this.pos;
      const startLine = this.peek().line;
      try {
        this.parseStatement();
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        const lineMatch = msg.match(/at line (\d+)/);
        const line = lineMatch ? parseInt(lineMatch[1]) : startLine;
        // 去重：同一行不重复报错
        if (!errors.some(er => er.line === line)) {
          errors.push({ line, message: msg });
        }

        // 跳到下一行或下一个语句开头
        while (this.peek().type !== TokenType.EOF) {
          // 如果 pos 没有前进，强制前进
          if (this.pos <= startPos) this.advance();
          // 到了新行且是语句开头，停止跳过
          if (this.peek().line > startLine && this.isStatementStart(this.peek())) break;
          // 安全阀：如果已经前进了很多行还没找到语句开头，逐行跳
          if (this.peek().line > startLine + 1) {
            // 找下一个语句开头的行
            while (this.peek().type !== TokenType.EOF && !this.isStatementStart(this.peek())) {
              this.advance();
            }
            break;
          }
          this.advance();
        }
      }
    }

    this.pos = savedPos;
    return errors;
  }

  // 判断 token 是否是一个语句的开头
  private isStatementStart(t: Token): boolean {
    return [
      TokenType.DECLARE, TokenType.CONSTANT, TokenType.INPUT, TokenType.OUTPUT,
      TokenType.IF, TokenType.CASE, TokenType.FOR, TokenType.REPEAT, TokenType.WHILE,
      TokenType.PROCEDURE, TokenType.FUNCTION, TokenType.RETURN, TokenType.CALL,
      TokenType.OPENFILE, TokenType.READFILE, TokenType.WRITEFILE, TokenType.CLOSEFILE,
      TokenType.NEXT, TokenType.ENDFOR, TokenType.UNTIL, TokenType.ENDWHILE, TokenType.ENDIF,
      TokenType.ENDCASE, TokenType.ENDPROCEDURE, TokenType.ENDFUNCTION,
      TokenType.ELSE, TokenType.ELSEIF, TokenType.THEN, TokenType.OTHERWISE,
      TokenType.TYPE, TokenType.DEFINE, TokenType.CLASS, TokenType.PUBLIC, TokenType.PRIVATE,
      TokenType.SEEK, TokenType.GETRECORD, TokenType.PUTRECORD, TokenType.SUPER,
    ].includes(t.type);
  }

  // 判断 token 是否是表达式的结尾关键字
  private isExprStop(t: Token): boolean {
    return [
      TokenType.THEN, TokenType.ELSE, TokenType.ENDIF,
      TokenType.TO, TokenType.STEP, TokenType.NEXT,
      TokenType.UNTIL, TokenType.DO, TokenType.ENDWHILE,
      TokenType.RETURNS, TokenType.RETURN,
      TokenType.ENDPROCEDURE, TokenType.ENDFUNCTION,
      TokenType.OF, TokenType.OTHERWISE, TokenType.ENDCASE,
      TokenType.COMMA, TokenType.RPAREN, TokenType.RBRACKET,
      TokenType.COLON, TokenType.FOR,
    ].includes(t.type);
  }

  // ─── 判断当前 token 是否可能开启一个表达式 ───
  private isExprStart(t: Token): boolean {
    return [
      TokenType.NUMBER, TokenType.REAL_NUMBER, TokenType.STRING_LITERAL, TokenType.CHAR_LITERAL,
      TokenType.IDENTIFIER, TokenType.TRUE, TokenType.FALSE,
      TokenType.LPAREN, TokenType.MINUS, TokenType.PLUS, TokenType.NOT, TokenType.AMPERSAND,
      TokenType.LENGTH, TokenType.LCASE, TokenType.UCASE, TokenType.SUBSTRING,
      TokenType.ROUND, TokenType.RANDOM, TokenType.EOF_FUNC,
      TokenType.DIV, TokenType.MOD, TokenType.INT_FUNC, TokenType.RND,
      TokenType.MID_FUNC, TokenType.RIGHT_FUNC, TokenType.RAND,
      TokenType.NUM_TO_STRING, TokenType.STRING_TO_NUM, TokenType.NEW, TokenType.SUPER,
    ].includes(t.type);
  }

  private parseStatement(): ASTNode {
    const t = this.peek();
    switch (t.type) {
      case TokenType.TYPE: return this.parseTypeDeclaration();
      case TokenType.DEFINE: return this.parseSetDefinition();
      case TokenType.CLASS: return this.parseClassDeclaration();
      case TokenType.PUBLIC:
      case TokenType.PRIVATE: return this.parseClassMemberDeclaration();
      case TokenType.SEEK: return this.parseFileSeek();
      case TokenType.GETRECORD: return this.parseFileGetRecord();
      case TokenType.PUTRECORD: return this.parseFilePutRecord();
      case TokenType.SUPER: return this.parseSuperMethodCall();
      case TokenType.DECLARE: return this.parseDeclaration();
      case TokenType.CONSTANT: return this.parseConstant();
      case TokenType.INPUT: return this.parseInput();
      case TokenType.OUTPUT: return this.parseOutput();
      case TokenType.RETURN: return this.parseReturn();
      case TokenType.IF: return this.parseIf();
      case TokenType.CASE: return this.parseCase();
      case TokenType.FOR: return this.parseFor();
      case TokenType.REPEAT: return this.parseRepeat();
      case TokenType.WHILE: return this.parseWhile();
      case TokenType.PROCEDURE: return this.parseProcedure();
      case TokenType.FUNCTION: return this.parseFunction();
      case TokenType.CALL: return this.parseCall();
      case TokenType.OPENFILE: return this.parseFileOpen();
      case TokenType.READFILE: return this.parseFileRead();
      case TokenType.WRITEFILE: return this.parseFileWrite();
      case TokenType.CLOSEFILE: return this.parseFileClose();
      case TokenType.RANDOMIZE:
        throw new Error(`RANDOMIZE is not part of Cambridge A-Level 9618 pseudocode at line ${t.line}`);
      case TokenType.ELSEIF:
        throw new Error(`ELSEIF is not part of Cambridge A-Level 9618 pseudocode at line ${t.line}; use a nested IF inside ELSE`);
      case TokenType.ENDFOR:
        throw new Error(`ENDFOR is not part of Cambridge A-Level 9618 pseudocode at line ${t.line}; use NEXT <identifier>`);
      case TokenType.DO:
        throw new Error(`DO is not part of Cambridge A-Level 9618 WHILE syntax at line ${t.line}`);
      case TokenType.IDENTIFIER: return this.parseAssignmentOrCall();
      default: {
        const unexpected = this.peek();
        if (unexpected.type === TokenType.ASSIGN) {
          throw new Error(`Unexpected assignment operator '<-' at line ${unexpected.line}. Assignment must follow a variable name.`);
        }
        if (unexpected.type === TokenType.EOF) {
          throw new Error(`Unexpected end of code at line ${unexpected.line}`);
        }
        throw new Error(`Unexpected token '${unexpected.value}' at line ${unexpected.line}`);
      }
    }
  }

  // ─── 声明 ───
  private parseDeclaration(): ASTNode {
    this.expect(TokenType.DECLARE);
    const name = this.expect(TokenType.IDENTIFIER);
    this.expect(TokenType.COLON);
    if (this.peek().type === TokenType.ARRAY) return this.parseArrayDeclaration(name.value, name.line);
    const dt = this.advance();
    // 支持内置类型和用户自定义类型（IDENTIFIER）
    const builtinTypes = [TokenType.INTEGER, TokenType.REAL, TokenType.CHAR, TokenType.STRING, TokenType.BOOLEAN, TokenType.DATE];
    if (!builtinTypes.includes(dt.type) && dt.type !== TokenType.IDENTIFIER) {
      throw new Error(`Invalid data type '${dt.value}' for variable '${name.value}' at line ${name.line}. Valid types: INTEGER, REAL, CHAR, STRING, BOOLEAN or a user-defined type name`);
    }
    return { type: 'VariableDeclaration', name: name.value, dataType: dt.value, line: name.line };
  }

  private parseArrayDeclaration(name: string, line: number): ASTNode {
    this.expect(TokenType.ARRAY); this.expect(TokenType.LBRACKET);
    const dims: ArrayDimension[] = [this.parseArrayDimension(line)];
    if (this.match(TokenType.COMMA)) dims.push(this.parseArrayDimension(line));
    this.expect(TokenType.RBRACKET); this.expect(TokenType.OF);
    const dt = this.parseDataTypeToken(`array '${name}'`, line);
    return { type: 'ArrayDeclaration', name, dimensions: dims, dataType: dt.value, line };
  }

  private parseArrayDimension(line: number): ArrayDimension {
    const lower = this.parseArrayBound(line);
    this.expect(TokenType.COLON);
    const upper = this.parseArrayBound(line);
    if (typeof lower === 'number' && typeof upper === 'number' && lower > upper) {
      throw new Error(`Array lower bound ${lower} cannot exceed upper bound ${upper} at line ${line}`);
    }
    return { lower, upper };
  }

  private parseArrayBound(line: number): ArrayBound {
    const token = this.peek();
    if (token.type === TokenType.NUMBER) {
      this.advance();
      return Number.parseInt(token.value, 10);
    }
    if (token.type === TokenType.IDENTIFIER) {
      this.advance();
      return token.value;
    }
    throw new Error(`Array bound must be an INTEGER literal or previously declared INTEGER constant at line ${line}, got '${token.value}'`);
  }

  private parseDataTypeToken(context: string, line: number): Token {
    const token = this.advance();
    const builtinTypes = [TokenType.INTEGER, TokenType.REAL, TokenType.CHAR, TokenType.STRING, TokenType.BOOLEAN, TokenType.DATE];
    if (!builtinTypes.includes(token.type) && token.type !== TokenType.IDENTIFIER) {
      throw new Error(`Invalid data type '${token.value}' for ${context} at line ${line}`);
    }
    return token;
  }

  private parseCallableParameterType(parameterName: string, line: number): Omit<CallableParameter, 'name' | 'byRef'> {
    if (this.peek().type !== TokenType.ARRAY) {
      const type = this.parseDataTypeToken(`parameter '${parameterName}'`, line);
      return { type: type.value.toUpperCase() };
    }

    this.expect(TokenType.ARRAY);
    this.expect(TokenType.LBRACKET);
    const dimensions: ArrayDimension[] = [this.parseArrayDimension(line)];
    if (this.match(TokenType.COMMA)) dimensions.push(this.parseArrayDimension(line));
    this.expect(TokenType.RBRACKET);
    this.expect(TokenType.OF);
    const elementType = this.parseDataTypeToken(`array parameter '${parameterName}'`, line).value;
    return {
      type: `ARRAY_OF_${elementType.toUpperCase()}`,
      elementType,
      dimensions,
    };
  }

  // ─── TYPE 声明 ───
  // 支持:
  //   TYPE MyType = (Val1, Val2, ...)        // 枚举类型
  //   TYPE MyPtrType = ^BaseType            // 指针类型
  //   TYPE MyRecType                        // 记录类型
  //       DECLARE field1 : TYPE
  //       DECLARE field2 : TYPE
  //   ENDTYPE
  private parseTypeDeclaration(): ASTNode {
    const startTok = this.expect(TokenType.TYPE);
    const typeNameTok = this.expect(TokenType.IDENTIFIER);
    const typeName = typeNameTok.value;

    // 单行用户类型（枚举、指针、集合）不使用 ENDTYPE。
    if (this.peek().type === TokenType.EQUAL) {
      this.advance(); // consume '='
      if (this.match(TokenType.CARET)) {
        const baseTypeTok = this.advance();
        return { type: 'TypeDeclaration', name: typeName, kind: 'pointer', baseType: baseTypeTok.value, line: startTok.line };
      }
      if (this.match(TokenType.SET)) {
        this.expect(TokenType.OF);
        const baseTypeTok = this.advance();
        return { type: 'TypeDeclaration', name: typeName, kind: 'set', baseType: baseTypeTok.value, line: startTok.line };
      }
      this.expect(TokenType.LPAREN);
      const values: string[] = [];
      while (!this.match(TokenType.RPAREN)) {
        const valTok = this.expect(TokenType.IDENTIFIER);
        values.push(valTok.value);
        if (!this.match(TokenType.COMMA)) {
          this.expect(TokenType.RPAREN);
          break;
        }
      }
      return { type: 'TypeDeclaration', name: typeName, kind: 'enum', values, line: startTok.line };
    }

    // 否则是记录类型
    const fields: { name: string; dataType: string }[] = [];
    while (this.peek().type !== TokenType.ENDTYPE) {
      this.expect(TokenType.DECLARE);
      const fieldNameTok = this.expect(TokenType.IDENTIFIER);
      this.expect(TokenType.COLON);
      const fieldTypeTok = this.advance();
      fields.push({ name: fieldNameTok.value, dataType: fieldTypeTok.value });
    }
    this.expect(TokenType.ENDTYPE);
    return { type: 'TypeDeclaration', name: typeName, kind: 'record', fields, line: startTok.line };
  }

  // ─── DEFINE set 声明 ───
  // 支持: DEFINE Vowels ('A', 'E', 'I', 'O', 'U') : LetterSet
  private parseSetDefinition(): ASTNode {
    const startTok = this.expect(TokenType.DEFINE);
    const nameTok = this.expect(TokenType.IDENTIFIER);
    this.expect(TokenType.LPAREN);
    const values: string[] = [];
    const valueTypes: TokenType[] = [];
    while (!this.match(TokenType.RPAREN)) {
      let valTok: Token;
      if (this.peek().type === TokenType.STRING_LITERAL) {
        valTok = this.advance();
        values.push(valTok.value);
      } else if (this.peek().type === TokenType.CHAR_LITERAL) {
        valTok = this.advance();
        values.push(valTok.value);
      } else if (this.peek().type === TokenType.NUMBER) {
        valTok = this.advance();
        values.push(valTok.value);
      } else {
        valTok = this.expect(TokenType.IDENTIFIER);
        values.push(valTok.value);
      }
      valueTypes.push(valTok.type);
      if (!this.match(TokenType.COMMA)) {
        this.expect(TokenType.RPAREN);
        break;
      }
    }
    this.expect(TokenType.COLON);
    const setTypeTok = this.advance();
    return { type: 'SetDefinition', name: nameTok.value, values, valueTypes, setType: setTypeTok.value, line: startTok.line };
  }

  private parseClassDeclaration(): ASTNode {
    const startTok = this.expect(TokenType.CLASS);
    const nameTok = this.expect(TokenType.IDENTIFIER);
    let parent: string | null = null;
    if (this.match(TokenType.INHERITS)) parent = this.expect(TokenType.IDENTIFIER).value;
    const members: ASTNode[] = [];
    while (this.peek().type !== TokenType.ENDCLASS) {
      members.push(this.parseStatement());
    }
    this.expect(TokenType.ENDCLASS);
    return { type: 'ClassDeclaration', name: nameTok.value, parent, members, line: startTok.line };
  }

  private parseClassMemberDeclaration(): ASTNode {
    const visibilityTok = this.advance();
    const visibility = visibilityTok.type === TokenType.PRIVATE ? 'private' : 'public';
    if (this.peek().type === TokenType.PROCEDURE) {
      const proc = this.parseProcedure();
      return { ...proc, visibility };
    }
    if (this.peek().type === TokenType.FUNCTION) {
      const fn = this.parseFunction();
      return { ...fn, visibility };
    }
    const nameTok = this.expect(TokenType.IDENTIFIER);
    this.expect(TokenType.COLON);
    const typeTok = this.advance();
    return { type: 'VariableDeclaration', name: nameTok.value, dataType: typeTok.value, visibility, line: visibilityTok.line };
  }

  private parseConstant(): ASTNode {
    this.expect(TokenType.CONSTANT);
    const name = this.expect(TokenType.IDENTIFIER);
    // A-Level uses '=' for constant assignment, IGCSE uses '<-'
    // '=' is normally EQ operator, but after CONSTANT identifier it means assignment
    const nextToken = this.peek();
    if (nextToken.type === TokenType.EQUAL) {
      this.advance(); // consume '='
    } else {
      this.expect(TokenType.ASSIGN); // expect '<-'
    }
    const value = this.parseExpression();
    if (!['NumberLiteral', 'RealLiteral', 'StringLiteral', 'CharLiteral', 'BooleanLiteral', 'DateLiteral'].includes(value.type)) {
      throw new Error(`Constant '${name.value}' must be assigned a literal value at line ${name.line}`);
    }
    return { type: 'ConstantDeclaration', name: name.value, value, line: name.line };
  }

  // ─── 输入输出 ───
  private parseInput(): ASTNode {
    const input = this.expect(TokenType.INPUT);
    const name = this.expect(TokenType.IDENTIFIER);
    let target: ASTNode = { type: 'Identifier', name: name.value };
    if (this.match(TokenType.LBRACKET)) {
      const indices: ASTNode[] = [this.parseExpressionSimple()];
      while (this.match(TokenType.COMMA)) indices.push(this.parseExpressionSimple());
      this.expect(TokenType.RBRACKET);
      target = { type: 'ArrayAccess', name: name.value, indices };
    }
    while (this.match(TokenType.DOT)) {
      const field = this.expect(TokenType.IDENTIFIER);
      target = { type: 'FieldAccess', record: target, field: field.value, line: field.line };
    }
    return { type: 'InputStatement', target, line: input.line };
  }

  private parseOutput(): ASTNode {
    const tok = this.expect(TokenType.OUTPUT);
    const values: ASTNode[] = [];
    while (this.peek().type !== TokenType.EOF &&
      this.isExprStart(this.peek()) &&
      !this.isStatementStart(this.peek())) {
      values.push(this.parseExpression());
      if (!this.match(TokenType.COMMA)) break;
    }
    if (values.length === 0) {
      throw new Error(`OUTPUT requires at least one expression at line ${tok.line}`);
    }
    return { type: 'OutputStatement', values, line: tok.line };
  }

  // ─── RETURN ───
  private parseReturn(): ASTNode {
    const tok = this.expect(TokenType.RETURN);
    if (this.functionDepth === 0) {
      throw new Error(`RETURN may only be used inside a function at line ${tok.line}`);
    }
    let value: ASTNode | null = null;

    const startPos = this.pos;
    let endPos = this.pos;
    for (let i = startPos; i < this.tokens.length; i++) {
      const tokenType = this.tokens[i].type;
      if (tokenType === TokenType.ENDIF ||
        tokenType === TokenType.ENDPROCEDURE ||
        tokenType === TokenType.ENDFUNCTION ||
        tokenType === TokenType.NEXT ||
        tokenType === TokenType.UNTIL ||
        tokenType === TokenType.ENDWHILE ||
        tokenType === TokenType.EOF ||
        this.isStatementStart(this.tokens[i])) {
        endPos = i;
        break;
      }
    }

    // If endPos == startPos but next token is a statement keyword, 
    // the user wrote something like "RETURN RETURN" or "RETURN ENDIF" which is invalid
    if (endPos === startPos && this.peek().type !== TokenType.EOF && this.isStatementStart(this.peek())) {
      throw new Error(`Syntax error at line ${tok.line}: RETURN cannot be followed by '${this.peek().value}'`);
    }

    if (endPos > startPos && endPos - startPos <= 50) {
      const exprTokens = this.tokens.slice(startPos, endPos);
      if (exprTokens.length > 0) {
        const subParser = new Parser(exprTokens);
        value = subParser.parseExpressionSimple();
      }
      this.pos = endPos;
    } else if (this.peek().type !== TokenType.EOF && this.isExprStart(this.peek())) {
      value = this.parseExpression();
    }

    return { type: 'ReturnStatement', value, line: tok.line };
  }

  // ─── IF ───
  private parseIf(): ASTNode {
    this.expect(TokenType.IF);

    const startPos = this.pos;
    let thenPos = -1;
    let depth = 0;
    for (let i = this.pos; i < this.tokens.length; i++) {
      const token = this.tokens[i];
      if (token.type === TokenType.IF) {
        depth++;
      } else if (token.type === TokenType.ENDIF) {
        depth--;
      } else if (token.type === TokenType.THEN && depth === 0) {
        thenPos = i;
        break;
      }
    }

    let condition: ASTNode;

    if (thenPos > startPos && thenPos - startPos <= 20) {
      const conditionTokens = this.tokens.slice(startPos, thenPos);
      const subParser = new Parser(conditionTokens);
      condition = subParser.parseExpressionSimple();
      this.pos = thenPos;
    } else {
      condition = this.parseExpressionSimple();
    }

    this.expect(TokenType.THEN);
    const thenBranch: ASTNode[] = [];
    while (this.peek().type !== TokenType.ELSE && this.peek().type !== TokenType.ELSEIF && this.peek().type !== TokenType.ENDIF) thenBranch.push(this.parseStatement());
    const elseBranch: ASTNode[] = [];
    if (this.match(TokenType.ELSEIF)) {
      throw new Error(`ELSEIF is not part of Cambridge A-Level 9618 pseudocode; use a nested IF inside ELSE`);
    } else if (this.match(TokenType.ELSE)) {
      while (this.peek().type !== TokenType.ENDIF) elseBranch.push(this.parseStatement());
    }
    this.expect(TokenType.ENDIF);
    return { type: 'IfStatement', condition, thenBranch, elseBranch };
  }

  // ─── CASE — IGCSE 规范: CASE OF <identifier> ───
  private parseCase(): ASTNode {
    this.expect(TokenType.CASE);
    this.expect(TokenType.OF);
    const variable = this.expect(TokenType.IDENTIFIER);
    const cases: { value: string; valueType: TokenType; statements: ASTNode[]; rangeEnd?: string; rangeEndType?: TokenType }[] = [];
    let otherwise: ASTNode[] | null = null;
    while (this.peek().type !== TokenType.ENDCASE) {
      if (this.peek().type === TokenType.OTHERWISE) {
        this.expect(TokenType.OTHERWISE);
        this.expect(TokenType.COLON);
        const stmts: ASTNode[] = [];
        while (this.peek().type !== TokenType.ENDCASE) {
          stmts.push(this.parseStatement());
        }
        otherwise = stmts;
        break;
      }
      const val = this.advance();
      let rangeEnd: string | null = null;
      let rangeEndType: TokenType | null = null;
      // A-Level: support range syntax like "1 TO 10"
      if (this.peek().type === TokenType.TO) {
        this.expect(TokenType.TO);
        const rangeToken = this.advance();
        rangeEnd = rangeToken.value;
        rangeEndType = rangeToken.type;
      }
      this.expect(TokenType.COLON);
      const stmts: ASTNode[] = [];
      while (this.peek().type !== TokenType.ENDCASE && !this.isCaseHeader(this.pos)) {
        stmts.push(this.parseStatement());
      }
      cases.push({
        value: val.value,
        valueType: val.type,
        statements: stmts,
        ...(rangeEnd === null ? {} : { rangeEnd, rangeEndType: rangeEndType! }),
      });
    }
    this.expect(TokenType.ENDCASE);
    return { type: 'CaseStatement', variable: variable.value, cases, otherwise };
  }

  private isCaseHeader(position: number): boolean {
    const first = this.tokens[position];
    if (!first) return false;
    if (first.type === TokenType.OTHERWISE) return this.tokens[position + 1]?.type === TokenType.COLON;
    const valueTypes = [
      TokenType.STRING_LITERAL, TokenType.CHAR_LITERAL, TokenType.NUMBER,
      TokenType.REAL_NUMBER, TokenType.TRUE, TokenType.FALSE, TokenType.IDENTIFIER,
    ];
    if (!valueTypes.includes(first.type)) return false;
    if (this.tokens[position + 1]?.type === TokenType.COLON) return true;
    return this.tokens[position + 1]?.type === TokenType.TO &&
      valueTypes.includes(this.tokens[position + 2]?.type) &&
      this.tokens[position + 3]?.type === TokenType.COLON;
  }

  // ─── FOR ───
  private parseFor(): ASTNode {
    this.expect(TokenType.FOR);
    const variable = this.expect(TokenType.IDENTIFIER);
    this.expect(TokenType.ASSIGN);

    const startPos = this.pos;
    let toPos = -1;
    for (let i = startPos; i < this.tokens.length; i++) {
      if (this.tokens[i].type === TokenType.TO) {
        toPos = i;
        break;
      }
    }

    let start: ASTNode;
    if (toPos > startPos && toPos - startPos <= 30) {
      const exprTokens = this.tokens.slice(startPos, toPos);
      const subParser = new Parser(exprTokens);
      start = subParser.parseExpressionSimple();
      this.pos = toPos;
    } else {
      start = this.parseExpression();
    }

    this.expect(TokenType.TO);

    const endStartPos = this.pos;
    let endEndPos = -1;
    for (let i = endStartPos; i < this.tokens.length; i++) {
      if (this.tokens[i].type === TokenType.STEP) {
        endEndPos = i;
        break;
      }
      if (this.isStatementStart(this.tokens[i]) ||
        this.tokens[i].type === TokenType.NEXT) {
        break;
      }
    }

    let end: ASTNode;
    if (endEndPos > endStartPos && endEndPos - endStartPos <= 30) {
      const exprTokens = this.tokens.slice(endStartPos, endEndPos);
      const subParser = new Parser(exprTokens);
      end = subParser.parseExpressionSimple();
      this.pos = endEndPos;
    } else {
      end = this.parseExpressionSimple();
    }

    let step: ASTNode | null = null;
    if (this.match(TokenType.STEP)) {
      step = this.parseExpressionSimple();
    }

    const body: ASTNode[] = [];
    while (this.peek().type !== TokenType.NEXT && this.peek().type !== TokenType.ENDFOR) body.push(this.parseStatement());
    if (this.peek().type === TokenType.ENDFOR) {
      throw new Error(`ENDFOR is not part of Cambridge A-Level 9618 pseudocode at line ${this.peek().line}; use NEXT ${variable.value}`);
    }
    this.expect(TokenType.NEXT);
    if (this.peek().type === TokenType.IDENTIFIER) {
      const nextVariable = this.advance();
      if (nextVariable.value.toUpperCase() !== variable.value.toUpperCase()) {
        throw new Error(`NEXT variable '${nextVariable.value}' does not match FOR variable '${variable.value}' at line ${nextVariable.line}`);
      }
    }
    return { type: 'ForLoop', variable: variable.value, start, end, step, body };
  }

  // ─── REPEAT ───
  private parseRepeat(): ASTNode {
    this.expect(TokenType.REPEAT);
    const body: ASTNode[] = [];
    while (this.peek().type !== TokenType.UNTIL) body.push(this.parseStatement());
    this.expect(TokenType.UNTIL);

    const condStartPos = this.pos;
    let condEndPos = -1;
    for (let i = condStartPos; i < this.tokens.length; i++) {
      if (this.isStatementStart(this.tokens[i]) ||
        this.tokens[i].type === TokenType.ENDIF ||
        this.tokens[i].type === TokenType.ENDPROCEDURE ||
        this.tokens[i].type === TokenType.ENDFUNCTION ||
        this.tokens[i].type === TokenType.NEXT ||
        this.tokens[i].type === TokenType.ENDWHILE ||
        this.tokens[i].type === TokenType.EOF) {
        condEndPos = i;
        break;
      }
    }

    let condition: ASTNode;
    if (condEndPos > condStartPos && condEndPos - condStartPos <= 30) {
      const exprTokens = this.tokens.slice(condStartPos, condEndPos);
      const subParser = new Parser(exprTokens);
      condition = subParser.parseExpressionSimple();
      this.pos = condEndPos;
    } else {
      condition = this.parseExpression();
    }

    return { type: 'RepeatLoop', body, condition };
  }

  // ─── WHILE ───
  private parseWhile(): ASTNode {
    this.expect(TokenType.WHILE);

    // A-Level 9618: WHILE <condition> ... ENDWHILE (no DO keyword)
    // Parse condition using parseExpression, it stops naturally at statement boundaries
    const condition = this.parseExpression();
    if (this.peek().type === TokenType.DO) {
      throw new Error(`DO is not part of Cambridge A-Level 9618 WHILE syntax at line ${this.peek().line}`);
    }

    const body: ASTNode[] = [];
    while (this.peek().type !== TokenType.ENDWHILE) body.push(this.parseStatement());
    this.expect(TokenType.ENDWHILE);
    return { type: 'WhileLoop', condition, body };
  }

  // ─── PROCEDURE — IGCSE 规范: 无参数时可省略括号 ───
  private parseProcedure(): ASTNode {
    this.expect(TokenType.PROCEDURE);
    const name = this.peek().type === TokenType.NEW ? this.advance() : this.expect(TokenType.IDENTIFIER);
    const params: CallableParameter[] = [];
    if (this.peek().type !== TokenType.LPAREN) {
      throw new Error(`PROCEDURE '${name.value}' requires parentheses, including empty '()', at line ${name.line}`);
    }
    this.expect(TokenType.LPAREN);
    let byRefMode = false;
    while (!this.match(TokenType.RPAREN)) {
      if (this.match(TokenType.BYREF)) {
        byRefMode = true;
      } else {
        if (this.match(TokenType.BYVAL)) byRefMode = false;
      }
      const pName = this.expect(TokenType.IDENTIFIER);
      this.expect(TokenType.COLON);
      const parameterType = this.parseCallableParameterType(pName.value, pName.line);
      params.push({ name: pName.value, ...parameterType, byRef: byRefMode });
      if (this.peek().type !== TokenType.RPAREN) this.expect(TokenType.COMMA);
    }
    const body: ASTNode[] = [];
    this.procedureDepth++;
    try {
      while (this.peek().type !== TokenType.ENDPROCEDURE) body.push(this.parseStatement());
    } finally {
      this.procedureDepth--;
    }
    this.expect(TokenType.ENDPROCEDURE);
    return { type: 'ProcedureDeclaration', name: name.value, params, body };
  }

  // ─── FUNCTION — IGCSE 规范: 无参数时可省略括号 ───
  private parseFunction(): ASTNode {
    this.expect(TokenType.FUNCTION);
    const name = this.expect(TokenType.IDENTIFIER);
    const params: CallableParameter[] = [];
    if (this.peek().type !== TokenType.LPAREN) {
      throw new Error(`FUNCTION '${name.value}' requires parentheses, including empty '()', at line ${name.line}`);
    }
    this.expect(TokenType.LPAREN);
    while (!this.match(TokenType.RPAREN)) {
      if (this.match(TokenType.BYREF)) {
        throw new Error(`Functions cannot have BYREF parameters at line ${this.peek().line}`);
      }
      this.match(TokenType.BYVAL);
      const pName = this.expect(TokenType.IDENTIFIER);
      this.expect(TokenType.COLON);
      const parameterType = this.parseCallableParameterType(pName.value, pName.line);
      params.push({ name: pName.value, ...parameterType, byRef: false });
      if (this.peek().type !== TokenType.RPAREN) this.expect(TokenType.COMMA);
    }
    this.expect(TokenType.RETURNS);
    const returnType = this.advance();
    const body: ASTNode[] = [];
    this.functionDepth++;
    try {
      while (this.peek().type !== TokenType.ENDFUNCTION) body.push(this.parseStatement());
    } finally {
      this.functionDepth--;
    }
    this.expect(TokenType.ENDFUNCTION);
    return { type: 'FunctionDeclaration', name: name.value, params, returnType: returnType.value.toUpperCase(), body };
  }

  // ─── CALL — IGCSE 规范: CALL ProcedureName 或 CALL ProcedureName(args) ───
  private parseCall(): ASTNode {
    const tok = this.expect(TokenType.CALL);
    const name = this.expect(TokenType.IDENTIFIER);
    const args: ASTNode[] = [];
    if (this.peek().type !== TokenType.LPAREN) {
      throw new Error(`CALL '${name.value}' requires parentheses, including empty '()', at line ${name.line}`);
    }
    this.expect(TokenType.LPAREN);
    while (!this.match(TokenType.RPAREN)) {
      args.push(this.parseExpressionSimple());
      if (!this.match(TokenType.COMMA)) { if (this.peek().type !== TokenType.RPAREN) break; }
    }
    return { type: 'ProcedureCall', name: name.value, args, line: tok.line };
  }

  // ─── 文件操作 — IGCSE 规范: OPENFILE filename FOR READ/WRITE ───
  private parseFilename(): Token {
    const t = this.peek();
    if (t.type === TokenType.IDENTIFIER || t.type === TokenType.STRING_LITERAL) return this.advance();
    throw new Error(`Expected filename but got ${t.type} ('${t.value}') at line ${t.line}`);
  }

  private parseFileOpen(): ASTNode {
    const tok = this.expect(TokenType.OPENFILE);
    const f = this.parseFilename();
    this.expect(TokenType.FOR);
    const mode = this.advance();
    if (mode.type === TokenType.READ) {
      return { type: 'FileOpenRead', filename: f.value, filenameIsLiteral: f.type === TokenType.STRING_LITERAL, line: tok.line };
    } else if (mode.type === TokenType.WRITE) {
      return { type: 'FileOpenWrite', filename: f.value, filenameIsLiteral: f.type === TokenType.STRING_LITERAL, line: tok.line };
    } else if (mode.type === TokenType.APPEND) {
      return { type: 'FileOpenAppend', filename: f.value, filenameIsLiteral: f.type === TokenType.STRING_LITERAL, line: tok.line };
    } else if (mode.type === TokenType.RANDOM) {
      return { type: 'FileOpenRandom', filename: f.value, filenameIsLiteral: f.type === TokenType.STRING_LITERAL, line: tok.line };
    }
    throw new Error(`Expected READ, WRITE, APPEND or RANDOM after FOR in OPENFILE, got '${mode.value}' at line ${mode.line}`);
  }

  private parseFileRead(): ASTNode {
    this.expect(TokenType.READFILE); const f = this.parseFilename();
    this.expect(TokenType.COMMA); const v = this.expect(TokenType.IDENTIFIER);
    return { type: 'FileRead', filename: f.value, filenameIsLiteral: f.type === TokenType.STRING_LITERAL, variable: v.value, line: f.line };
  }
  private parseFileWrite(): ASTNode {
    this.expect(TokenType.WRITEFILE); const f = this.parseFilename();
    this.expect(TokenType.COMMA);
    const value = this.parseExpression();
    return { type: 'FileWrite', filename: f.value, filenameIsLiteral: f.type === TokenType.STRING_LITERAL, value, line: f.line };
  }
  private parseFileClose(): ASTNode {
    this.expect(TokenType.CLOSEFILE); const f = this.parseFilename();
    return { type: 'FileClose', filename: f.value, filenameIsLiteral: f.type === TokenType.STRING_LITERAL, line: f.line };
  }

  private parseFileSeek(): ASTNode {
    const tok = this.expect(TokenType.SEEK);
    const f = this.parseFilename();
    this.expect(TokenType.COMMA);
    const position = this.parseExpression();
    return { type: 'FileSeek', filename: f.value, filenameIsLiteral: f.type === TokenType.STRING_LITERAL, position, line: tok.line };
  }

  private parseFileGetRecord(): ASTNode {
    const tok = this.expect(TokenType.GETRECORD);
    const f = this.parseFilename();
    this.expect(TokenType.COMMA);
    const variable = this.expect(TokenType.IDENTIFIER);
    return { type: 'FileGetRecord', filename: f.value, filenameIsLiteral: f.type === TokenType.STRING_LITERAL, variable: variable.value, line: tok.line };
  }

  private parseFilePutRecord(): ASTNode {
    const tok = this.expect(TokenType.PUTRECORD);
    const f = this.parseFilename();
    this.expect(TokenType.COMMA);
    const value = this.parseExpression();
    return { type: 'FilePutRecord', filename: f.value, filenameIsLiteral: f.type === TokenType.STRING_LITERAL, value, line: tok.line };
  }

  private parseSuperMethodCall(): ASTNode {
    const tok = this.expect(TokenType.SUPER);
    this.expect(TokenType.DOT);
    const methodTok = this.peek().type === TokenType.NEW ? this.advance() : this.expect(TokenType.IDENTIFIER);
    const args: ASTNode[] = [];
    this.expect(TokenType.LPAREN);
    while (!this.match(TokenType.RPAREN)) {
      args.push(this.parseExpressionSimple());
      if (!this.match(TokenType.COMMA)) { if (this.peek().type !== TokenType.RPAREN) break; }
    }
    return { type: 'SuperMethodCall', method: methodTok.value, args, line: tok.line };
  }

  // ─── 赋值 / 过程调用（无 CALL 前缀的标识符开头）───
  private parseAssignmentOrCall(): ASTNode {
    const name = this.expect(TokenType.IDENTIFIER);
    if (this.match(TokenType.LBRACKET)) {
      const indices: ASTNode[] = [this.parseExpression()];
      // 支持 arr[i, j] 和 arr[i][j] 两种写法
      while (true) {
        if (this.match(TokenType.COMMA)) {
          indices.push(this.parseExpression());
        } else if (this.peek().type === TokenType.RBRACKET && this.peek(1).type === TokenType.LBRACKET) {
          this.advance(); // consume ]
          this.advance(); // consume [
          indices.push(this.parseExpression());
        } else {
          break;
        }
      }
      this.expect(TokenType.RBRACKET);
      // 支持 .field 链式访问: arr[i].field
      let target: ASTNode = { type: 'ArrayAccess', name: name.value, indices };
      while (this.match(TokenType.DOT)) {
        const fieldName = this.expect(TokenType.IDENTIFIER);
        target = { type: 'FieldAccess', record: target, field: fieldName.value, line: fieldName.line };
      }
      this.expect(TokenType.ASSIGN);
      const value = this.parseExpression();
      return { type: 'Assignment', target, value, line: name.line };
    }
    // 支持指针解引用赋值: MyPtr^ <- value
    if (this.match(TokenType.CARET)) {
      this.expect(TokenType.ASSIGN);
      const value = this.parseExpression();
      return { type: 'Assignment', target: { type: 'PointerDereference', name: name.value, line: name.line }, value, line: name.line };
    }
    // 支持对象字段赋值/方法调用: object.field <- value / object.method(args)
    if (this.match(TokenType.DOT)) {
      const memberTok = this.expect(TokenType.IDENTIFIER);
      if (this.match(TokenType.LPAREN)) {
        const args: ASTNode[] = [];
        while (!this.match(TokenType.RPAREN)) {
          args.push(this.parseExpression());
          if (!this.match(TokenType.COMMA)) { if (this.peek().type !== TokenType.RPAREN) break; }
        }
        return { type: 'MethodCall', object: { type: 'Identifier', name: name.value }, method: memberTok.value, args, line: name.line };
      }
      let target: ASTNode = { type: 'FieldAccess', record: { type: 'Identifier', name: name.value }, field: memberTok.value, line: memberTok.line };
      while (this.match(TokenType.DOT)) {
        const fieldName = this.expect(TokenType.IDENTIFIER);
        target = { type: 'FieldAccess', record: target, field: fieldName.value, line: fieldName.line };
      }
      this.expect(TokenType.ASSIGN);
      const value = this.parseExpression();
      return { type: 'Assignment', target, value, line: name.line };
    }
    if (this.match(TokenType.LPAREN)) {
      const args: ASTNode[] = [];
      while (!this.match(TokenType.RPAREN)) {
        args.push(this.parseExpression());
        if (!this.match(TokenType.COMMA)) { if (this.peek().type !== TokenType.RPAREN) break; }
      }
      return { type: 'FunctionCall', name: name.value, args };
    }
    this.expect(TokenType.ASSIGN);
    const value = this.parseExpression();
    return { type: 'Assignment', target: { type: 'Identifier', name: name.value }, value, line: name.line };
  }

  // ═══════════════════════════════════════════════════════════
  //  简化版表达式解析
  // ═══════════════════════════════════════════════════════════
  private parseExpression(): ASTNode {
    return this.parseExpressionSimple();
  }

  private parseExpressionSimple(): ASTNode {
    return this.parseOrSimple();
  }

  private parseOrSimple(): ASTNode {
    let left = this.parseAndSimple();
    while (this.peek().type === TokenType.OR && !this.isExprStop(this.peek(1))) {
      this.advance();
      left = { type: 'BinaryExpression', operator: 'OR', left, right: this.parseAndSimple() };
    }
    return left;
  }

  private parseAndSimple(): ASTNode {
    let left = this.parseNotSimple();
    while (this.peek().type === TokenType.AND && !this.isExprStop(this.peek(1))) {
      this.advance();
      left = { type: 'BinaryExpression', operator: 'AND', left, right: this.parseNotSimple() };
    }
    return left;
  }

  private parseNotSimple(): ASTNode {
    if (this.peek().type === TokenType.NOT && !this.isExprStop(this.peek(1))) {
      this.advance();
      return { type: 'UnaryExpression', operator: 'NOT', operand: this.parseComparisonSimple() };
    }
    return this.parseComparisonSimple();
  }

  private parseComparisonSimple(): ASTNode {
    const left = this.parseAddSubSimple();
    const ops: Record<string, string> = { EQUAL: '=', NOT_EQUAL: '<>', LESS: '<', LESS_EQUAL: '<=', GREATER: '>', GREATER_EQUAL: '>=' };
    const t = this.peek();
    if (ops[t.type]) {
      this.advance();
      const right = this.parseAddSubSimpleSimple();
      return { type: 'BinaryExpression', operator: ops[t.type], left, right };
    }
    return left;
  }

  private parseAddSubSimpleSimple(): ASTNode {
    let left = this.parseMulDivSimpleSimple();
    while (this.peek().type === TokenType.PLUS || this.peek().type === TokenType.MINUS || this.peek().type === TokenType.AMPERSAND) {
      const op = this.advance();
      const opStr = op.type === TokenType.PLUS ? '+' : op.type === TokenType.MINUS ? '-' : '&';
      left = { type: 'BinaryExpression', operator: opStr, left, right: this.parseMulDivSimpleSimple() };
    }
    return left;
  }
  private parseMulDivSimpleSimple(): ASTNode {
    let left = this.parsePowerSimpleSimple();
    while ([TokenType.MULTIPLY, TokenType.DIVIDE].includes(this.peek().type)) {
      const op = this.advance();
      const opStr: Record<string, string> = { [TokenType.MULTIPLY]: '*', [TokenType.DIVIDE]: '/' };
      left = { type: 'BinaryExpression', operator: opStr[op.type], left, right: this.parsePowerSimpleSimple() };
    }
    return left;
  }
  private parsePowerSimpleSimple(): ASTNode {
    const left = this.parseUnarySimpleSimple();
    if (this.peek().type === TokenType.POWER) {
      this.advance();
      return { type: 'BinaryExpression', operator: '^', left, right: this.parsePowerSimpleSimple() };
    }
    return left;
  }
  private parseUnarySimpleSimple(): ASTNode {
    if (this.peek().type === TokenType.MINUS) {
      this.advance();
      return { type: 'UnaryExpression', operator: '-', operand: this.parsePrimarySimple() };
    }
    if (this.peek().type === TokenType.PLUS) {
      this.advance();
      return this.parsePrimarySimple();
    }
    return this.parsePrimarySimple();
  }

  private parseAddSubSimple(): ASTNode {
    let left = this.parseMulDivSimple();
    while ((this.peek().type === TokenType.PLUS || this.peek().type === TokenType.MINUS || this.peek().type === TokenType.AMPERSAND) && !this.isExprStop(this.peek(1))) {
      const op = this.advance();
      const opStr = op.type === TokenType.PLUS ? '+' : op.type === TokenType.MINUS ? '-' : '&';
      left = { type: 'BinaryExpression', operator: opStr, left, right: this.parseMulDivSimple() };
    }
    return left;
  }

  private parseMulDivSimple(): ASTNode {
    let left = this.parsePowerSimple();
    while ([TokenType.MULTIPLY, TokenType.DIVIDE, TokenType.DIV, TokenType.MOD].includes(this.peek().type) && !this.isExprStop(this.peek(1))) {
      const op = this.advance();
      const opStr: Record<string, string> = { [TokenType.MULTIPLY]: '*', [TokenType.DIVIDE]: '/', [TokenType.DIV]: 'DIV', [TokenType.MOD]: 'MOD' };
      left = { type: 'BinaryExpression', operator: opStr[op.type], left, right: this.parsePowerSimple() };
    }
    return left;
  }

  private parsePowerSimple(): ASTNode {
    const left = this.parseUnarySimple();
    if (this.peek().type === TokenType.POWER && !this.isExprStop(this.peek(1))) {
      this.advance();
      return { type: 'BinaryExpression', operator: '^', left, right: this.parsePowerSimple() };
    }
    return left;
  }

  private parseUnarySimple(): ASTNode {
    if (this.peek().type === TokenType.MINUS && !this.isExprStop(this.peek(1))) {
      this.advance();
      return { type: 'UnaryExpression', operator: '-', operand: this.parsePrimarySimple() };
    }
    if (this.peek().type === TokenType.PLUS && !this.isExprStop(this.peek(1))) {
      this.advance();
      return this.parsePrimarySimple();
    }
    return this.parsePrimarySimple();
  }

  private parsePrimarySimple(): ASTNode {
    const t = this.peek();

    if (t.type === TokenType.NUMBER) {
      if (this.peek(1).type === TokenType.DIVIDE && this.peek(2).type === TokenType.NUMBER && this.peek(3).type === TokenType.DIVIDE && this.peek(4).type === TokenType.NUMBER) {
        const day = this.advance().value;
        this.advance();
        const month = this.advance().value;
        this.advance();
        const year = this.advance().value;
        return { type: 'DateLiteral', value: `${day}/${month}/${year}` };
      }
      this.advance(); return { type: 'NumberLiteral', value: parseInt(t.value) };
    }
    if (t.type === TokenType.REAL_NUMBER) { this.advance(); return { type: 'RealLiteral', value: parseFloat(t.value) }; }
    if (t.type === TokenType.STRING_LITERAL) { this.advance(); return { type: 'StringLiteral', value: t.value }; }
    if (t.type === TokenType.CHAR_LITERAL) { this.advance(); return { type: 'CharLiteral', value: t.value }; }
    if (t.type === TokenType.TRUE) { this.advance(); return { type: 'BooleanLiteral', value: true }; }
    if (t.type === TokenType.FALSE) { this.advance(); return { type: 'BooleanLiteral', value: false }; }

    // DIV 和 MOD 作为函数调用: DIV(a, b) / MOD(a, b)
    if (t.type === TokenType.DIV || t.type === TokenType.MOD) {
      const funcName = t.type === TokenType.DIV ? 'DIV' : 'MOD';
      if (this.peek(1).type === TokenType.LPAREN) {
        throw new Error(`${funcName}(...) is not part of Cambridge A-Level 9618 pseudocode; use the infix operator at line ${t.line}`);
      }
      this.advance();
      throw new Error(`Unexpected ${funcName} operator at line ${t.line}`);
    }

    const unsupportedBuiltins = new Set([
      TokenType.SUBSTRING, TokenType.ROUND, TokenType.RANDOM, TokenType.RND,
      TokenType.NUM_TO_STRING, TokenType.STRING_TO_NUM,
    ]);
    if (unsupportedBuiltins.has(t.type)) {
      throw new Error(`${t.value.toUpperCase()} is not part of Cambridge A-Level 9618 (2027-2029) pseudocode at line ${t.line}`);
    }

    // 处理所有内置函数 token 类型
    const builtinTokenTypes = new Set([
      TokenType.LENGTH, TokenType.LCASE, TokenType.UCASE,
      TokenType.EOF_FUNC, TokenType.INT_FUNC,
      TokenType.MID_FUNC, TokenType.RIGHT_FUNC, TokenType.RAND,
    ]);
    const builtinNames: Partial<Record<TokenType, string>> = {
      [TokenType.LENGTH]: 'LENGTH',
      [TokenType.LCASE]: 'LCASE',
      [TokenType.UCASE]: 'UCASE',
      [TokenType.MID_FUNC]: 'MID',
      [TokenType.RIGHT_FUNC]: 'RIGHT',
      [TokenType.EOF_FUNC]: 'EOF',
      [TokenType.INT_FUNC]: 'INT',
      [TokenType.RAND]: 'RAND',
    };

    if (builtinTokenTypes.has(t.type)) {
      const funcName = builtinNames[t.type] as string;
      this.advance();
      this.expect(TokenType.LPAREN);
      const args: ASTNode[] = [];
      while (!this.match(TokenType.RPAREN)) {
        args.push(this.parseExpressionSimple());
        if (!this.match(TokenType.COMMA)) { if (this.peek().type !== TokenType.RPAREN) break; }
      }
      return { type: 'FunctionCall', name: funcName, args };
    }

    if (t.type === TokenType.NEW) {
      this.advance();
      const className = this.expect(TokenType.IDENTIFIER);
      const args: ASTNode[] = [];
      this.expect(TokenType.LPAREN);
      while (!this.match(TokenType.RPAREN)) {
        args.push(this.parseExpressionSimple());
        if (!this.match(TokenType.COMMA)) { if (this.peek().type !== TokenType.RPAREN) break; }
      }
      return { type: 'ObjectCreation', className: className.value, args, line: className.line };
    }

    if (t.type === TokenType.SUPER) {
      return this.parseSuperMethodCall();
    }

    if (t.type === TokenType.IDENTIFIER) {
      const name = this.advance();
      if (this.match(TokenType.LBRACKET)) {
        const indices: ASTNode[] = [this.parseExpressionSimple()];
        while (true) {
          if (this.match(TokenType.COMMA)) {
            indices.push(this.parseExpressionSimple());
          } else if (this.peek().type === TokenType.RBRACKET && this.peek(1).type === TokenType.LBRACKET) {
            this.advance(); // consume ]
            this.advance(); // consume [
            indices.push(this.parseExpressionSimple());
          } else {
            break;
          }
        }
        this.expect(TokenType.RBRACKET);
        let expr: ASTNode = { type: 'ArrayAccess', name: name.value, indices };
        // 支持链式 .field 访问: arr[i].field.subfield
        while (this.match(TokenType.DOT)) {
          const fieldName = this.expect(TokenType.IDENTIFIER);
          expr = { type: 'FieldAccess', record: expr, field: fieldName.value, line: fieldName.line };
        }
        return expr;
      }
      if (this.match(TokenType.LPAREN)) {
        const args: ASTNode[] = [];
        while (!this.match(TokenType.RPAREN)) {
          args.push(this.parseExpressionSimple());
          if (!this.match(TokenType.COMMA)) { if (this.peek().type !== TokenType.RPAREN) break; }
        }
        return { type: 'FunctionCall', name: name.value, args };
      }
      let expr: ASTNode = { type: 'Identifier', name: name.value };
      // 支持指针解引用: MyPtr^
      if (this.match(TokenType.CARET)) {
        expr = { type: 'PointerDereference', name: name.value, line: name.line };
      }
      // 支持链式字段访问/方法调用: MyRec.field / object.method()
      while (this.match(TokenType.DOT)) {
        const fieldName = this.expect(TokenType.IDENTIFIER);
        if (this.match(TokenType.LPAREN)) {
          const args: ASTNode[] = [];
          while (!this.match(TokenType.RPAREN)) {
            args.push(this.parseExpressionSimple());
            if (!this.match(TokenType.COMMA)) { if (this.peek().type !== TokenType.RPAREN) break; }
          }
          expr = { type: 'MethodCall', object: expr, method: fieldName.value, args, line: fieldName.line };
        } else {
          expr = { type: 'FieldAccess', record: expr, field: fieldName.value, line: fieldName.line };
        }
      }
      return expr;
    }

    // 支持指针取地址表达式: ^MyVar
    if (t.type === TokenType.CARET) {
      this.advance();
      const varName = this.expect(TokenType.IDENTIFIER);
      return { type: 'AddressOf', name: varName.value, line: varName.line };
    }

    if (this.match(TokenType.LPAREN)) {
      const expr = this.parseExpressionSimple();
      this.expect(TokenType.RPAREN);
      return expr;
    }

    this.advance();
    return { type: 'Empty' };
  }
}

// ════════════════════════════════════════════════════════════════
//  Interpreter
// ════════════════════════════════════════════════════════════════

export interface TraceEntry {
  line: number;
  variables: Record<string, string>;
  output: string;
}

export class Interpreter {
  private variables = new CaseInsensitiveMap<unknown>();
  private constants = new CaseInsensitiveMap<unknown>();
  private arrays = new CaseInsensitiveMap<{ dims: { lower: number; upper: number }[]; data: unknown[] }>();
  private procedures = new CaseInsensitiveMap<any>();
  private functions = new CaseInsensitiveMap<any>();
  private output: string[] = [];
  private onOutput?: (text: string) => void;
  private inputCallback?: (prompt?: string) => Promise<unknown>;
  private maxIterations = 10000;
  private maxCallDepth = 500;
  private currentIteration = 0;
  private callDepth = 0;
  private aborted = false;
  private fileContents = new CaseInsensitiveMap<string[]>();
  private filePositions = new CaseInsensitiveMap<number>();
  private traceTable: TraceEntry[] = [];
  private traceEnabled = true;
  private lastOutputLine = 0;
  private openFiles = new CaseInsensitiveMap<'read' | 'write' | 'append' | 'random'>();
  private randomFileRecords = new CaseInsensitiveMap<unknown[]>();
  private randomFileTypes = new CaseInsensitiveMap<string>();

  private classDefinitions = new CaseInsensitiveMap<{ name: string; parent: string | null; fields: any[]; methods: CaseInsensitiveMap<any> }>();
  private objectClasses = new WeakMap<object, string>();
  private currentThis: Record<string, unknown> | null = null;
  private currentClassName: string | null = null;

  // 变量类型追踪，用于 REAL 输出格式化
  private variableTypes = new CaseInsensitiveMap<string>();

  // 用户自定义类型存储
  private typeDefinitions = new CaseInsensitiveMap<{ kind: 'enum' | 'pointer' | 'record' | 'set'; values?: string[]; baseType?: string; fields?: { name: string; dataType: string }[] }>();
  // 指针变量存储: pointerName -> targetVariableName
  private pointerVariables = new CaseInsensitiveMap<string>();
  // 集合定义存储: setName -> { values: string[], setType: string }
  private setDefinitions = new CaseInsensitiveMap<{ values: string[]; setType: string }>();

  // Trace Table 追踪
  private traceLog: { line: number; variables: Record<string, unknown>; output: string }[] = [];
  private enableTrace = false;

  setInputCallback(cb: (prompt?: string) => Promise<unknown>): void { this.inputCallback = cb; }
  setOnOutput(cb: (text: string) => void): void { this.onOutput = cb; }
  setEnableTrace(enable: boolean): void { this.enableTrace = enable; }
  getTraceLog(): { line: number; variables: Record<string, unknown>; output: string }[] { return this.traceLog; }
  setMaxIterations(max: number): void { this.maxIterations = max; }
  abort(): void { this.aborted = true; }
  setFileContent(filename: string, content: string | string[]): void { this.fileContents.set(filename, typeof content === 'string' ? content.split('\n') : content); }
  getFileContent(filename: string): string[] | undefined { return this.fileContents.get(filename); }
  getAllFiles(): Record<string, string[]> {
    const files: Record<string, string[]> = {};
    this.fileContents.forEach((lines, filename) => {
      files[filename] = lines;
    });
    return files;
  }
  deleteFile(filename: string): void { this.fileContents.delete(filename); }
  clearAllFiles(): void { this.fileContents.clear(); }
  getTraceTable(): TraceEntry[] { return this.traceTable; }
  getVariables(): Map<string, unknown> { return this.variables; }
  getVariableTypes(): Map<string, string> { return this.variableTypes; }
  getTypeDefinitions(): Map<string, { kind: string; values?: string[]; baseType?: string; fields?: { name: string; dataType: string }[] }> { return this.typeDefinitions; }
  getSetDefinitions(): Map<string, { values: string[]; setType: string }> { return this.setDefinitions; }
  getPointerVariables(): Map<string, string> { return this.pointerVariables; }
  getArrays(): Map<string, { dims: { lower: number; upper: number }[]; data: unknown[] }> { return this.arrays; }

  // 根据数据类型返回默认值
  private getDefaultValue(dataType: string): unknown {
    const dt = dataType.toUpperCase();
    if (dt === 'INTEGER') return 0;
    if (dt === 'REAL') return 0.0;
    if (dt === 'CHAR') return '';
    if (dt === 'STRING') return '';
    if (dt === 'BOOLEAN') return false;
    if (dt === 'DATE') return '';
    // 用户自定义记录类型
    const typeDef = this.typeDefinitions.get(dataType);
    if (typeDef && typeDef.kind === 'record' && typeDef.fields) {
      const record: Record<string, unknown> = {};
      for (const field of typeDef.fields) {
        record[field.name] = this.getDefaultValue(field.dataType);
      }
      return record;
    }
    // 枚举类型默认值
    if (typeDef && typeDef.kind === 'enum' && typeDef.values && typeDef.values.length > 0) {
      return typeDef.values[0];
    }
    return null;
  }

  // 根据数据类型返回类型字符串（用于 variableTypes Map）
  private getTypeString(dataType: string): string {
    const dt = dataType.toUpperCase();
    const builtin = ['INTEGER', 'REAL', 'CHAR', 'STRING', 'BOOLEAN', 'DATE'];
    if (builtin.includes(dt)) return dt;
    // 用户自定义类型，直接用类型名
    if (this.typeDefinitions.has(dataType)) return dataType;
    return dataType;
  }

  private isKnownType(dataType: string): boolean {
    const upper = dataType.toUpperCase();
    return ['INTEGER', 'REAL', 'CHAR', 'STRING', 'BOOLEAN', 'DATE'].includes(upper) ||
      this.typeDefinitions.has(dataType) ||
      this.classDefinitions.has(dataType);
  }

  private hasDeclaredName(name: string): boolean {
    return this.variables.has(name) || this.constants.has(name) || this.arrays.has(name);
  }

  private isGlobalNameDeclared(name: string): boolean {
    return this.hasDeclaredName(name) ||
      this.procedures.has(name) ||
      this.functions.has(name) ||
      this.typeDefinitions.has(name) ||
      this.classDefinitions.has(name) ||
      this.setDefinitions.has(name);
  }

  private getObjectKey(record: Record<string, unknown>, requested: string): string | undefined {
    const upper = requested.toUpperCase();
    return Object.keys(record).find(key => key.toUpperCase() === upper);
  }

  // ─── 类型检查：检查赋值目标是否是用户自定义记录类型字段 ───
  private checkRecordFieldType(fieldDef: { name: string; dataType: string }, value: unknown, fieldPath: string, expressionType?: string): void {
    const expectedType = this.getTypeString(fieldDef.dataType);
    const valueType = expressionType ?? this.inferType(value);
    if (expectedType === valueType) return;
    if (expectedType === 'REAL' && valueType === 'INTEGER') return;
    throw this.runtimeError(`Type mismatch: cannot assign ${valueType} value to record field '${fieldPath}' (expected ${expectedType})`);
  }

  reset(): void {
    this.variables.clear(); this.constants.clear(); this.arrays.clear();
    this.procedures.clear(); this.functions.clear();
    this.variableTypes.clear();
    this.recordInstances.clear();
    this.objectClasses = new WeakMap<object, string>();
    this.output = []; this.currentIteration = 0; this.callDepth = 0; this.aborted = false;
    this.filePositions.clear(); this.openFiles.clear();
    this.traceTable = []; this.lastOutputLine = 0;
    this.traceLog = [];
    this.inputCallback = undefined;
    this.onOutput = undefined;
    this.typeDefinitions.clear();
    this.pointerVariables.clear();
    this.setDefinitions.clear();
    this.randomFileRecords.clear();
    this.randomFileTypes.clear();
    this.classDefinitions.clear();
    this.currentThis = null;
    this.currentClassName = null;
  }

  private recordTrace(line: number): void {
    if (!this.traceEnabled) return;
    const snapshot: Record<string, string> = {};
    this.variables.forEach((v, k) => { snapshot[k] = this.formatValue(v); });
    this.constants.forEach((v, k) => { snapshot[k] = this.formatValue(v); });
    this.arrays.forEach((arr, k) => { snapshot[k] = JSON.stringify(arr.data); });
    const newOutput = this.output.slice(this.lastOutputLine).join('\\n');
    this.lastOutputLine = this.output.length;
    this.traceTable.push({ line, variables: snapshot, output: newOutput });
   }

  async execute(ast: ASTNode): Promise<string[]> {
    this.output = [];
    await this.executeNode(ast);
    return this.output;
  }

  private currentLine = 0;

  private runtimeError(msg: string): never {
    throw new Error(`${msg} at line ${this.currentLine}`);
  }

  private async executeNode(node: any): Promise<unknown> {
    if (!node || node.type === 'Empty') return null;
    if (this.aborted) throw new Error('Execution aborted by user');
    if (node.line) this.currentLine = node.line;

    switch (node.type) {
      case 'Program': return this.executeProgram(node);
      case 'VariableDeclaration': return this.executeVariableDeclaration(node);
      case 'ArrayDeclaration': return this.executeArrayDeclaration(node);
      case 'ConstantDeclaration': return this.executeConstantDeclaration(node);
      case 'Assignment': return this.executeAssignment(node);
      case 'InputStatement': return this.executeInput(node);
      case 'OutputStatement': return this.executeOutput(node);
      case 'ReturnStatement': return this.executeReturn(node);
      case 'IfStatement': return this.executeIf(node);
      case 'CaseStatement': return this.executeCase(node);
      case 'ForLoop': return this.executeFor(node);
      case 'RepeatLoop': return this.executeRepeat(node);
      case 'WhileLoop': return this.executeWhile(node);
      case 'ProcedureDeclaration': return this.executeProcedureDeclaration(node);
      case 'FunctionDeclaration': return this.executeFunctionDeclaration(node);
      case 'ProcedureCall': return this.executeProcedureCall(node);
      case 'FunctionCall': return this.executeFunctionCall(node);
      case 'MethodCall': return this.executeMethodCall(node);
      case 'SuperMethodCall': return this.executeSuperMethodCall(node);
      case 'ObjectCreation': return this.createObject(node.className, node.args || []);
      case 'FileOpenRead': return this.executeFileOpenRead(node);
      case 'FileOpenWrite': return this.executeFileOpenWrite(node);
      case 'FileOpenAppend': return this.executeFileOpenAppend(node);
      case 'FileOpenRandom': return this.executeFileOpenRandom(node);
      case 'FileRead': return this.executeFileRead(node);
      case 'FileWrite': return this.executeFileWrite(node);
      case 'FileSeek': return this.executeFileSeek(node);
      case 'FileGetRecord': return this.executeFileGetRecord(node);
      case 'FilePutRecord': return this.executeFilePutRecord(node);
      case 'FileClose': return this.executeFileClose(node);
      case 'RandomizeStatement': return null;
      case 'TypeDeclaration': return this.executeTypeDeclaration(node);
      case 'SetDefinition': return this.executeSetDefinition(node);
      case 'ClassDeclaration': return this.executeClassDeclaration(node);
      case 'MethodCall': return this.executeMethodCall(node);
      case 'SuperMethodCall': return this.executeSuperMethodCall(node);
      default: return this.evaluateExpression(node);
    }
  }

  private async executeProgram(node: any): Promise<void> {
    const stmts: any[] = node.statements;
    // Pass 1: 先注册所有 TYPE、SET DEFINE 和 CLASS 声明
    for (const s of stmts) {
      if (s.type === 'TypeDeclaration' || s.type === 'SetDefinition' || s.type === 'ClassDeclaration') await this.executeNode(s);
    }
    // Pass 2: 再注册过程和函数
    for (const s of stmts) {
      if (s.type === 'ProcedureDeclaration' || s.type === 'FunctionDeclaration') await this.executeNode(s);
    }
    // Pass 3: 执行主程序语句
    for (const s of stmts) {
      if (s.type === 'TypeDeclaration' || s.type === 'SetDefinition' || s.type === 'ClassDeclaration' ||
        s.type === 'ProcedureDeclaration' || s.type === 'FunctionDeclaration') continue;
      if (s.type === 'FunctionCall') {
        const callableName = String(s.name);
        if (this.procedures.has(callableName)) {
          this.runtimeError(`Procedure '${callableName}' must be called with CALL`);
        }
        this.runtimeError(`Function call '${callableName}' cannot be used as a standalone statement`);
      }
      const result = await this.executeNode(s);
      if (result instanceof ReturnSignal) throw result;
    }
  }

  private executeVariableDeclaration(node: any): void {
    const name = node.name as string;
    const dataType = node.dataType as string;
    if (this.hasDeclaredName(name)) this.runtimeError(`Identifier '${name}' is already declared`);
    if (!this.isKnownType(dataType)) this.runtimeError(`Undefined data type '${dataType}'`);
    const typeStr = this.getTypeString(dataType);
    const value = this.getDefaultValue(dataType);
    this.variables.set(name, value);
    this.variableTypes.set(name, typeStr);
    // 注册记录实例，用于类型推断
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      this.recordInstances.set(value, typeStr);
    }
    if (!this.typeDefinitions.has(dataType)) {
      const typeDef = this.findTypeDefinition(dataType);
      if (typeDef) this.typeDefinitions.set(dataType, typeDef);
    }
    this.recordTrace(node.line || 0);
  }

  private findTypeDefinition(typeName: string): { kind: 'enum' | 'pointer' | 'record' | 'set'; values?: string[]; baseType?: string; fields?: { name: string; dataType: string }[] } | null {
    return this.typeDefinitions.get(typeName) ?? null;
  }

  private executeArrayDeclaration(node: any): void {
    const name = node.name as string;
    const dims = this.resolveArrayDimensions(node.dimensions as ArrayDimension[], `array '${name}'`);
    const dataType = node.dataType as string;
    if (this.hasDeclaredName(name)) this.runtimeError(`Identifier '${name}' is already declared`);
    if (!this.isKnownType(dataType)) this.runtimeError(`Undefined data type '${dataType}'`);

    let totalSize = 1;
    for (const dim of dims) {
      totalSize *= (dim.upper - dim.lower + 1);
    }

    const defaultVal = this.getDefaultValue(dataType);
    const data = new Array(totalSize).fill(null).map(() => this.deepClone(defaultVal));

    this.arrays.set(name, { dims, data });
    this.variableTypes.set(name, `ARRAY_OF_${this.getTypeString(dataType)}`);
  }

  private resolveArrayDimensions(dimensions: ArrayDimension[], context: string): { lower: number; upper: number }[] {
    return dimensions.map((dimension, index) => {
      const lower = this.resolveArrayBound(dimension.lower, `${context} lower bound for dimension ${index + 1}`);
      const upper = this.resolveArrayBound(dimension.upper, `${context} upper bound for dimension ${index + 1}`);
      if (lower > upper) {
        this.runtimeError(`Array lower bound ${lower} cannot exceed upper bound ${upper} in ${context}`);
      }
      return { lower, upper };
    });
  }

  private resolveArrayBound(bound: ArrayBound, context: string): number {
    if (typeof bound === 'number') return bound;
    if (!this.constants.has(bound)) {
      this.runtimeError(`Array bound '${bound}' in ${context} must be a previously declared INTEGER constant`);
    }
    const value = this.constants.get(bound);
    if (!Number.isInteger(value)) {
      this.runtimeError(`Array bound constant '${bound}' in ${context} must contain an INTEGER value`);
    }
    return value as number;
  }

  private deepClone(value: unknown): unknown {
    if (value === null || value === undefined) return null;
    if (typeof value !== 'object') return value;
    if (Array.isArray(value)) return value.map(v => this.deepClone(v));
    const record: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      record[k] = this.deepClone(v);
    }
    const recordType = this.recordInstances.get(value as object);
    if (recordType) this.recordInstances.set(record, recordType);
    const className = this.objectClasses.get(value as object);
    if (className) this.objectClasses.set(record, className);
    return record;
  }

  private async executeConstantDeclaration(node: any): Promise<void> {
    const name = node.name as string;
    if (this.hasDeclaredName(name)) this.runtimeError(`Identifier '${name}' is already declared`);
    const value = await this.evaluateExpression(node.value);
    this.constants.set(name, value);
    this.recordTrace(node.line || 0);
  }

  private async executeAssignment(node: any): Promise<void> {
    const target = node.target as any;
    const value = await this.evaluateExpression(node.value);
    const expressionType = this.getExpressionType(node.value, value);

    if (target.type === 'PointerDereference') {
      // ptr^ <- value: 把值写入指针指向的变量
      const targetVarName = this.pointerVariables.get(target.name);
      if (!targetVarName) this.runtimeError(`Pointer '${target.name}' does not point to any variable`);
      if (!this.variableTypes.has(targetVarName)) this.runtimeError(`Undefined variable '${targetVarName}'`);
      this.checkTypeCompatibility(value, targetVarName, expressionType);
      this.variables.set(targetVarName, value);
      this.recordTrace(node.line || 0);
      return;
    }

    if (target.type === 'FieldAccess') {
      // rec.field <- value
      await this.executeFieldAccessAssignment(target, value, expressionType);
      this.recordTrace(node.line || 0);
      return;
    }

    if (target.type === 'Identifier') {
      if (this.arrays.has(target.name)) {
        if (!value || typeof value !== 'object' || !('__arrayValue' in value)) {
          this.runtimeError(`Cannot assign non-array value to array '${target.name}'`);
        }
        const source = value as unknown as { dims: { lower: number; upper: number }[]; data: unknown[]; elementType: string };
        const destination = this.arrays.get(target.name)!;
        if (JSON.stringify(destination.dims) !== JSON.stringify(source.dims)) {
          this.runtimeError(`Array dimensions do not match for assignment to '${target.name}'`);
        }
        const destinationType = this.variableTypes.get(target.name)?.slice('ARRAY_OF_'.length) ?? '';
        if (destinationType.toUpperCase() !== source.elementType.toUpperCase()) {
          this.runtimeError(`Array element types do not match for assignment to '${target.name}'`);
        }
        destination.data = source.data.map(item => this.deepClone(item));
        this.recordTrace(node.line || 0);
        return;
      }
      // 处理指针赋值: ptr <- ^MyVar
      if (typeof value === 'object' && value !== null && '__pointerTarget' in value) {
        const pointerTypeName = this.variableTypes.get(target.name);
        const pointerType = pointerTypeName ? this.typeDefinitions.get(pointerTypeName) : undefined;
        if (!pointerType || pointerType.kind !== 'pointer') {
          this.runtimeError(`Variable '${target.name}' is not a pointer`);
        }
        const targetVariable = String((value as any).__pointerTarget);
        const targetType = this.variableTypes.get(targetVariable);
        if (!targetType || targetType.toUpperCase() !== pointerType.baseType?.toUpperCase()) {
          this.runtimeError(`Pointer type mismatch: '${target.name}' points to ${pointerType.baseType} but '${targetVariable}' is ${targetType ?? 'undefined'}`);
        }
        this.pointerVariables.set(target.name, targetVariable);
        this.recordTrace(node.line || 0);
        return;
      }
      if (!this.variableTypes.has(target.name) && !this.constants.has(target.name)) {
        throw this.runtimeError(`Undefined variable '${target.name}'`);
      }
      if (this.constants.has(target.name)) {
        throw this.runtimeError(`Cannot reassign constant '${target.name}'`);
      }
      this.checkTypeCompatibility(value, target.name, expressionType);
      this.variables.set(target.name, this.deepClone(value));
    } else if (target.type === 'ArrayAccess') {
      const arrInfo = this.arrays.get(target.name);
      if (arrInfo) {
        const indices = [];
        for (const idx of target.indices as any[]) {
          indices.push(await this.evaluateExpression(idx) as number);
        }
        const flatIndex = this.getFlatIndex(arrInfo.dims, indices);
        this.checkArrayElementType(value, target.name, expressionType);
        arrInfo.data[flatIndex] = this.deepClone(value);
      }
    }
    this.recordTrace(node.line || 0);
  }

  private async executeFieldAccessAssignment(target: any, value: unknown, expressionType?: string): Promise<void> {
    // 递归解析 FieldAccess: a.b.c <- value
    // 找到最外层的 base（可能是 Identifier 或 ArrayAccess），逐步访问到目标字段
    const base = target.record;
    let current = base;
    const fieldNames: string[] = [];
    while (current.type === 'FieldAccess') {
      fieldNames.unshift(current.field as string);
      current = current.record;
    }
    fieldNames.push(target.field as string);

    let rootRecord: Record<string, unknown>;
    let rootType: string | undefined;
    let commit: () => void;

    if (current.type === 'Identifier') {
      const varVal = this.variables.get(current.name as string);
      if (typeof varVal !== 'object' || varVal === null) this.runtimeError(`Variable '${current.name}' is not a record type`);
      rootRecord = varVal as Record<string, unknown>;
      rootType = this.variableTypes.get(current.name as string);
      commit = () => this.variables.set(current.name as string, rootRecord);
    } else if (current.type === 'ArrayAccess') {
      const arrInfo = this.arrays.get(current.name as string);
      if (!arrInfo) this.runtimeError(`Undefined array '${current.name}'`);
      const indices: number[] = [];
      for (const idx of current.indices as any[]) {
        indices.push(await this.evaluateExpression(idx) as number);
      }
      const flatIndex = this.getFlatIndex(arrInfo.dims, indices);
      const arr = arrInfo.data[flatIndex];
      if (typeof arr !== 'object' || arr === null) this.runtimeError(`Array element at [${indices.join(',')}] is not a record type`);
      rootRecord = arr as Record<string, unknown>;
      rootType = this.variableTypes.get(current.name as string)?.replace(/^ARRAY_OF_/, '');
      commit = () => { arrInfo.data[flatIndex] = rootRecord; };
    } else {
      this.runtimeError(`Cannot assign to field access on '${current.type}'`);
    }

    let record = rootRecord;
    let recordType = rootType;
    for (let i = 0; i < fieldNames.length - 1; i++) {
      const requested = fieldNames[i];
      const key = this.getObjectKey(record, requested);
      if (!key) this.runtimeError(`Record has no field '${requested}'`);
      const next = record[key];
      if (typeof next !== 'object' || next === null) this.runtimeError(`Field '${requested}' is not a record`);
      const fieldDef = this.typeDefinitions.get(recordType || '')?.fields
        ?.find(field => field.name.toUpperCase() === requested.toUpperCase());
      recordType = fieldDef?.dataType;
      record = next as Record<string, unknown>;
    }

    const requestedField = fieldNames[fieldNames.length - 1];
    const actualField = this.getObjectKey(record, requestedField);
    if (!actualField) this.runtimeError(`Record has no field '${requestedField}'`);
    const className = this.objectClasses.get(record) || (record.__className as string | undefined);
    if (className && this.findFieldVisibility(className, requestedField) === 'private' && this.currentThis !== record) {
      this.runtimeError(`Cannot assign to private field '${requestedField}' of class '${className}'`);
    }
    const fieldDef = this.typeDefinitions.get(recordType || '')?.fields
      ?.find(field => field.name.toUpperCase() === requestedField.toUpperCase());
    if (fieldDef) this.checkRecordFieldType(fieldDef, value, fieldNames.join('.'), expressionType);
    record[actualField] = this.deepClone(value);
    commit();
  }

  private executeTypeDeclaration(node: any): void {
    const { name, kind, values, baseType, fields } = node;
    if (this.isGlobalNameDeclared(name)) this.runtimeError(`Identifier '${name}' is already declared`);
    if (kind === 'enum') {
      const seen = new Set<string>();
      for (const value of values as string[]) {
        const normalized = value.toUpperCase();
        if (seen.has(normalized)) this.runtimeError(`Duplicate enum value '${value}' in type '${name}'`);
        seen.add(normalized);
      }
    }
    if ((kind === 'pointer' || kind === 'set') && !this.isKnownType(baseType)) {
      this.runtimeError(`Undefined base type '${baseType}' for ${kind} type '${name}'`);
    }
    if (kind === 'record') {
      const seen = new Set<string>();
      for (const field of fields as { name: string; dataType: string }[]) {
        const normalized = field.name.toUpperCase();
        if (seen.has(normalized)) this.runtimeError(`Duplicate field '${field.name}' in record type '${name}'`);
        seen.add(normalized);
        if (!this.isKnownType(field.dataType)) this.runtimeError(`Undefined field type '${field.dataType}' for '${name}.${field.name}'`);
      }
    }
    this.typeDefinitions.set(name, { kind, values, baseType, fields });
  }

  private executeSetDefinition(node: any): void {
    const { name, values, valueTypes, setType } = node;
    if (this.isGlobalNameDeclared(name)) this.runtimeError(`Identifier '${name}' is already declared`);
    const type = this.typeDefinitions.get(setType);
    if (!type || type.kind !== 'set') this.runtimeError(`Undefined set type '${setType}'`);
    for (let i = 0; i < values.length; i++) {
      const valueType = this.tokenTypeToDataType(valueTypes[i]);
      if (!this.isTypeCompatible(type.baseType!, valueType, values[i])) {
        this.runtimeError(`Set value type mismatch in '${name}': expected ${type.baseType} but got ${valueType}`);
      }
    }
    this.setDefinitions.set(name, { values, setType });
  }

  private executeClassDeclaration(node: any): void {
    if (this.isGlobalNameDeclared(node.name)) this.runtimeError(`Identifier '${node.name}' is already declared`);
    if (node.parent && !this.classDefinitions.has(node.parent)) {
      this.runtimeError(`Undefined parent class '${node.parent}' for class '${node.name}'`);
    }
    const fields: any[] = [];
    const methods = new CaseInsensitiveMap<any>();
    const memberNames = new Set<string>();
    for (const member of node.members as any[]) {
      if (member.name) {
        const normalized = String(member.name).toUpperCase();
        if (memberNames.has(normalized)) this.runtimeError(`Duplicate class member '${member.name}' in class '${node.name}'`);
        memberNames.add(normalized);
      }
      if (member.type === 'VariableDeclaration') {
        if (!this.isKnownType(member.dataType)) this.runtimeError(`Undefined field type '${member.dataType}' for '${node.name}.${member.name}'`);
        fields.push({ ...member, visibility: member.visibility || 'public' });
      }
      if (member.type === 'Assignment' && member.target?.type === 'Identifier') {
        const field = fields.find(f => f.name === member.target.name);
        if (field) field.initializer = member.value;
      }
      if (member.type === 'ProcedureDeclaration' || member.type === 'FunctionDeclaration') {
        this.validateCallableSignature(member, `${node.name}.${member.name}`);
        methods.set(member.name, { ...member, visibility: member.visibility || 'public' });
      }
    }
    this.classDefinitions.set(node.name, { name: node.name, parent: node.parent ?? null, fields, methods });
  }

  private getClassFieldDefaults(className: string): Record<string, unknown> {
    const cls = this.classDefinitions.get(className);
    if (!cls) this.runtimeError(`Undefined class '${className}'`);
    const obj: Record<string, unknown> = { __className: className };
    if (cls.parent) {
      const parentDefaults = this.getClassFieldDefaults(cls.parent);
      delete parentDefaults.__className;
      Object.assign(obj, parentDefaults);
    }
    for (const field of cls.fields) obj[field.name] = field.initializer ? this.evaluateLiteralInitializer(field.initializer) : this.getDefaultValue(field.dataType);
    return obj;
  }

  private evaluateLiteralInitializer(node: any): unknown {
    if (!node) return null;
    if (node.type === 'NumberLiteral' || node.type === 'RealLiteral' || node.type === 'StringLiteral' || node.type === 'CharLiteral' || node.type === 'BooleanLiteral' || node.type === 'DateLiteral') return node.value;
    return null;
  }

  private findMethod(className: string, methodName: string): any {
    const cls = this.classDefinitions.get(className);
    if (!cls) return null;
    const method = cls.methods.get(methodName);
    if (method) return { method, owner: className };
    if (cls.parent) return this.findMethod(cls.parent, methodName);
    return null;
  }

  private async createObject(className: string, args: any[]): Promise<Record<string, unknown>> {
    const obj = this.getClassFieldDefaults(className);
    this.objectClasses.set(obj, className);
    const ctor = this.findMethod(className, 'NEW');
    if (ctor) {
      const values = await this.validateCallArguments(`constructor '${className}'`, ctor.method.params, args);
      await this.executeClassMethod(obj, className, ctor.method, values);
    } else if (args.length > 0) {
      this.runtimeError(`Constructor '${className}' expects 0 arguments but got ${args.length}`);
    }
    return obj;
  }

  private async executeMethodCall(node: any): Promise<unknown> {
    const objectValue = await this.evaluateExpression(node.object);
    if (typeof objectValue !== 'object' || objectValue === null) this.runtimeError(`Cannot call method '${node.method}' on non-object value`);
    const className = this.objectClasses.get(objectValue) || (objectValue as any).__className;
    if (!className) this.runtimeError(`Cannot determine object class for method '${node.method}'`);
    const found = this.findMethod(className, node.method);
    if (!found) this.runtimeError(`Class '${className}' has no method '${node.method}'`);
    if (found.method.visibility === 'private' && this.currentThis !== objectValue) {
      this.runtimeError(`Cannot call private method '${node.method}' of class '${className}'`);
    }
    const values = await this.validateCallArguments(`method '${node.method}'`, found.method.params, node.args || []);
    return this.executeClassMethod(objectValue as Record<string, unknown>, found.owner, found.method, values);
  }

  private async executeSuperMethodCall(node: any): Promise<unknown> {
    if (!this.currentThis || !this.currentClassName) this.runtimeError(`SUPER can only be used inside a class method`);
    const cls = this.classDefinitions.get(this.currentClassName);
    if (!cls || !cls.parent) this.runtimeError(`Class '${this.currentClassName}' has no superclass`);
    const found = this.findMethod(cls.parent, node.method);
    if (!found) this.runtimeError(`Superclass '${cls.parent}' has no method '${node.method}'`);
    const object = this.currentThis;
    const values = await this.validateCallArguments(`method '${node.method}'`, found.method.params, node.args || []);
    const result = await this.executeClassMethod(object, found.owner, found.method, values);
    for (const [key, value] of Object.entries(object)) {
      if (key !== '__className') this.variables.set(key, value);
    }
    return result;
  }

  private async executeClassMethod(obj: Record<string, unknown>, ownerClass: string, method: any, argValues: unknown[]): Promise<unknown> {
    const oldVars = new CaseInsensitiveMap<unknown>();
    const oldTypes = new CaseInsensitiveMap<string>();
    this.variables.forEach((value, key) => oldVars.set(key, value));
    this.variableTypes.forEach((value, key) => oldTypes.set(key, value));
    const oldThis = this.currentThis;
    const oldClass = this.currentClassName;
    this.currentThis = obj;
    this.currentClassName = ownerClass;
    for (const [k, v] of Object.entries(obj)) {
      if (k !== '__className') this.variables.set(k, v);
    }
    let className: string | null = this.objectClasses.get(obj) ?? (obj.__className as string | undefined) ?? ownerClass;
    while (className) {
      const definition = this.classDefinitions.get(className);
      if (!definition) break;
      for (const field of definition.fields) this.variableTypes.set(field.name, field.dataType);
      className = definition.parent;
    }
    for (let i = 0; i < method.params.length; i++) {
      const param = method.params[i];
      this.variables.set(param.name, param.byRef ? argValues[i] : this.deepClone(argValues[i]));
      this.variableTypes.set(param.name, param.type);
    }
    try {
      for (const stmt of method.body as any[]) {
        const result = await this.executeNode(stmt);
        if (result instanceof ReturnSignal) {
          if (method.type === 'FunctionDeclaration' &&
            !this.isTypeCompatible(method.returnType, result.valueType, result.value)) {
            this.runtimeError(`Return type mismatch in method '${method.name}': expected ${method.returnType} but got ${result.valueType}`);
          }
          return result.value;
        }
      }
      if (method.type === 'FunctionDeclaration') {
        this.runtimeError(`Function method '${method.name}' did not return a value`);
      }
      return null;
    } finally {
      for (const key of Object.keys(obj)) {
        if (key !== '__className' && this.variables.has(key)) obj[key] = this.variables.get(key);
      }
      this.variables = oldVars;
      this.variableTypes = oldTypes;
      this.currentThis = oldThis;
      this.currentClassName = oldClass;
    }
  }

  private checkTypeCompatibility(value: unknown, varName: string, expressionType?: string): void {
    const varType = this.variableTypes.get(varName);
    if (!varType) return;
    const valueType = expressionType ?? this.inferType(value);
    if (!this.isTypeCompatible(varType, valueType, value)) {
      throw this.runtimeError(`Type mismatch: cannot assign ${valueType} value to ${varType} variable '${varName}'`);
    }
  }

  private checkArrayElementType(value: unknown, arrayName: string, expressionType?: string): void {
    const varType = this.variableTypes.get(arrayName);
    if (!varType?.startsWith('ARRAY_OF_')) return;
    const elementType = varType.slice(9);
    const valueType = expressionType ?? this.inferType(value);
    if (!this.isTypeCompatible(elementType, valueType, value)) {
      throw this.runtimeError(`Type mismatch: cannot assign ${valueType} value to ${elementType} array '${arrayName}'`);
    }
  }

  // 运行时记录实例 → 类型名 的映射（用于类型推断）
  private recordInstances = new Map<object, string>();

  private inferType(value: unknown): string {
    if (typeof value === 'number') return Number.isInteger(value) ? 'INTEGER' : 'REAL';
    if (typeof value === 'string') return value.length === 1 ? 'CHAR' : 'STRING';
    if (typeof value === 'boolean') return 'BOOLEAN';
    if (typeof value === 'object' && value !== null) {
      const className = this.objectClasses.get(value) || (value as Record<string, unknown>).__className;
      if (typeof className === 'string') return className;
      if (this.recordInstances.has(value)) return this.recordInstances.get(value)!;
      if (Array.isArray(value)) return 'ARRAY';
      return 'RECORD';
    }
    return 'UNKNOWN';
  }

  private getExpressionType(node: any, evaluatedValue?: unknown): string {
    if (!node) return this.inferType(evaluatedValue);
    switch (node.type) {
      case 'NumberLiteral': return 'INTEGER';
      case 'RealLiteral': return 'REAL';
      case 'StringLiteral': return 'STRING';
      case 'CharLiteral': return 'CHAR';
      case 'BooleanLiteral': return 'BOOLEAN';
      case 'DateLiteral': return 'DATE';
      case 'Identifier':
        if (this.arrays.has(node.name)) {
          return this.variableTypes.get(node.name) ?? 'ARRAY';
        }
        return this.variableTypes.get(node.name) ??
          (this.constants.has(node.name) ? this.inferType(this.constants.get(node.name)) : this.inferType(evaluatedValue));
      case 'ArrayAccess':
        return this.variableTypes.get(node.name)?.replace(/^ARRAY_OF_/, '') ?? this.inferType(evaluatedValue);
      case 'PointerDereference': {
        const pointerType = this.variableTypes.get(node.name);
        return pointerType ? this.typeDefinitions.get(pointerType)?.baseType ?? 'UNKNOWN' : 'UNKNOWN';
      }
      case 'ObjectCreation':
        return node.className;
      case 'UnaryExpression':
        return node.operator === 'NOT' ? 'BOOLEAN' : this.getExpressionType(node.operand);
      case 'BinaryExpression': {
        const operator = node.operator as string;
        if (['=', '<>', '<', '<=', '>', '>=', 'AND', 'OR'].includes(operator)) return 'BOOLEAN';
        if (operator === '&') return 'STRING';
        if (operator === '/') return 'REAL';
        if (operator === 'DIV' || operator === 'MOD') return 'INTEGER';
        const left = this.getExpressionType(node.left);
        const right = this.getExpressionType(node.right);
        return left === 'REAL' || right === 'REAL' ? 'REAL' : 'INTEGER';
      }
      case 'FunctionCall': {
        const name = String(node.name).toUpperCase();
        const builtins: Record<string, string> = {
          LENGTH: 'INTEGER', LCASE: 'CHAR', UCASE: 'CHAR', MID: 'STRING',
          RIGHT: 'STRING', INT: 'INTEGER', RAND: 'REAL', EOF: 'BOOLEAN',
        };
        return builtins[name] ?? this.functions.get(node.name)?.returnType ?? this.inferType(evaluatedValue);
      }
      case 'MethodCall': {
        const objectType = this.getExpressionType(node.object);
        return this.findMethod(objectType, node.method)?.method?.returnType ?? this.inferType(evaluatedValue);
      }
      case 'FieldAccess': {
        const recordType = this.getExpressionType(node.record);
        const field = this.typeDefinitions.get(recordType)?.fields
          ?.find(item => item.name.toUpperCase() === String(node.field).toUpperCase());
        if (field) return field.dataType;
        const classField = this.classDefinitions.get(recordType)?.fields
          ?.find((item: any) => String(item.name).toUpperCase() === String(node.field).toUpperCase());
        return classField?.dataType ?? this.inferType(evaluatedValue);
      }
      default:
        return this.inferType(evaluatedValue);
    }
  }

  private isTypeCompatible(targetType: string, valueType: string, value: unknown): boolean {
    if (targetType.toUpperCase() === valueType.toUpperCase()) return true;
    if (targetType === 'REAL' && valueType === 'INTEGER') return true;
    if (targetType === 'STRING' && valueType === 'CHAR') return true;
    const type = this.typeDefinitions.get(targetType);
    if (type?.kind === 'enum' && typeof value === 'string') {
      return type.values?.some(item => item.toUpperCase() === value.toUpperCase()) ?? false;
    }
    let className = valueType;
    while (this.classDefinitions.has(className)) {
      if (className.toUpperCase() === targetType.toUpperCase()) return true;
      className = this.classDefinitions.get(className)?.parent ?? '';
    }
    return false;
  }

  private getFlatIndex(dims: { lower: number; upper: number }[], indices: number[]): number {
    if (indices.length !== dims.length) {
      this.runtimeError(`Array dimension mismatch: expected ${dims.length} indices but got ${indices.length}`);
    }
    // 边界检查：每个维度的索引必须在 [lower, upper] 范围内
    for (let i = 0; i < dims.length; i++) {
      if (!Number.isInteger(indices[i])) {
        this.runtimeError(`Array index must be an integer, got ${indices[i]} in dimension ${i + 1}`);
      }
      if (indices[i] < dims[i].lower || indices[i] > dims[i].upper) {
        this.runtimeError(`Array index out of bounds: accessing index ${indices[i]} in dimension ${i + 1} (valid range ${dims[i].lower}:${dims[i].upper})`);
      }
    }
    if (dims.length === 1) {
      return indices[0] - dims[0].lower;
    }
    const rowSize = dims[1].upper - dims[1].lower + 1;
    return (indices[0] - dims[0].lower) * rowSize + (indices[1] - dims[1].lower);
  }

  private async executeInput(node: any): Promise<void> {
    const target = node.target as any;
    const targetName = target.type === 'Identifier' ? target.name as string : 'input target';
    const varType = this.getInputTargetType(target);

    if (this.inputCallback) {
      const rawValue = await this.inputCallback(targetName);
      const str = String(rawValue).trim();
      let value: unknown;

      if (varType === 'INTEGER') {
        const parsed = parseInt(str, 10);
        if (isNaN(parsed) || str !== String(parsed)) {
          this.runtimeError(`Type error: cannot convert "${str}" to INTEGER for ${targetName}`);
        }
        value = parsed;
      } else if (varType === 'REAL') {
        const parsed = parseFloat(str);
        if (isNaN(parsed)) {
          this.runtimeError(`Type error: cannot convert "${str}" to REAL for ${targetName}`);
        }
        value = parsed;
      } else if (varType === 'BOOLEAN') {
        const upper = str.toUpperCase();
        if (upper !== 'TRUE' && upper !== 'FALSE') {
          this.runtimeError(`Type error: cannot convert "${str}" to BOOLEAN for ${targetName} (expected TRUE or FALSE)`);
        }
        value = upper === 'TRUE';
      } else if (varType === 'CHAR') {
        if (str.length !== 1) {
          this.runtimeError(`Type error: cannot convert "${str}" to CHAR for ${targetName} (expected single character)`);
        }
        value = str;
      } else if (varType === 'DATE') {
        if (!this.isValidDateLiteral(str)) this.runtimeError(`Type error: invalid DATE value "${str}" for ${targetName}`);
        value = str;
      } else {
        value = str;
      }
      await this.assignInputTarget(target, value, varType);
    } else {
      const defaults: Record<string, unknown> = { INTEGER: 0, REAL: 0.0, CHAR: '', STRING: '', BOOLEAN: false };
      await this.assignInputTarget(target, defaults[varType || 'STRING'] ?? '', varType);
    }
    this.recordTrace(node.line || 0);
  }

  private getInputTargetType(target: any): string | undefined {
    if (target.type === 'Identifier') return this.variableTypes.get(target.name);
    if (target.type === 'ArrayAccess') return this.variableTypes.get(target.name)?.replace(/^ARRAY_OF_/, '');
    if (target.type === 'FieldAccess') {
      let root = target.record;
      while (root.type === 'FieldAccess') root = root.record;
      const rootType = root.type === 'Identifier'
        ? this.variableTypes.get(root.name)
        : this.variableTypes.get(root.name)?.replace(/^ARRAY_OF_/, '');
      const type = rootType ? this.typeDefinitions.get(rootType) : undefined;
      return type?.fields?.find(field => field.name.toUpperCase() === String(target.field).toUpperCase())?.dataType.toUpperCase();
    }
    return undefined;
  }

  private async assignInputTarget(target: any, value: unknown, valueType?: string): Promise<void> {
    if (target.type === 'Identifier') {
      if (!this.variableTypes.has(target.name)) this.runtimeError(`Undefined variable '${target.name}'`);
      this.checkTypeCompatibility(value, target.name, valueType);
      this.variables.set(target.name, value);
      return;
    }
    if (target.type === 'ArrayAccess') {
      const array = this.arrays.get(target.name);
      if (!array) this.runtimeError(`Undefined array '${target.name}'`);
      const indices: number[] = [];
      for (const index of target.indices) indices.push(Number(await this.evaluateExpression(index)));
      this.checkArrayElementType(value, target.name, valueType);
      array.data[this.getFlatIndex(array.dims, indices)] = value;
      return;
    }
    if (target.type === 'FieldAccess') {
      await this.executeFieldAccessAssignment(target, value, valueType);
      return;
    }
    this.runtimeError('Invalid INPUT target');
  }

  private async executeOutput(node: any): Promise<void> {
    const vals: string[] = [];
    for (const v of node.values as any[]) {
      const value = await this.evaluateExpression(v);
      vals.push(this.formatValue(value, v));
    }
    const outputStr = vals.join(' ');
    this.output.push(outputStr);
    if (this.onOutput) this.onOutput(outputStr);
    this.recordTrace(node.line || 0);
  }

  private formatValue(value: unknown, expr?: any): string {
    if (typeof value === 'number') {
      const isRealType = this.isRealExpression(expr);
      if (Number.isInteger(value) && !Number.isNaN(value)) {
        if (isRealType) return String(value) + '.0';
        return String(value);
      }
      const str = String(value);
      if (!str.includes('.')) return str + '.0';
      return str;
    }
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    if (typeof value === 'object' && value !== null) {
      // 指针解引用结果
      if (this.recordInstances.has(value)) {
        const typeName = this.recordInstances.get(value)!;
        const rec = value as Record<string, unknown>;
        const fields = Object.entries(rec).map(([k, v]) => `${k}: ${this.formatValue(v)}`).join(', ');
        return `${typeName}(${fields})`;
      }
      // 指针值（未解引用）
      if ('__pointerTarget' in value) return `^${(value as any).__pointerTarget}`;
      // 集合
      if (Array.isArray(value)) {
        return `{${(value as string[]).join(', ')}}`;
      }
      return String(value);
    }
    return String(value ?? '');
  }

  private isRealExpression(expr: any): boolean {
    if (!expr) return false;
    if (expr.type === 'Identifier') {
      const varType = this.variableTypes.get(expr.name as string);
      return varType === 'REAL';
    }
    if (expr.type === 'RealLiteral') return true;
    if (expr.type === 'FunctionCall') {
      const name = (expr.name as string).toUpperCase();
      if (name === 'ROUND' || name === 'RANDOM' || name === 'RND' || name === 'RAND') return true;
    }
    if (expr.type === 'BinaryExpression') {
      const op = expr.operator as string;
      if (op === 'DIV' || op === 'MOD') return false;
      return this.isRealExpression(expr.left) || this.isRealExpression(expr.right);
    }
    if (expr.type === 'ArithmeticExpression') {
      const op = expr.operator as string;
      if (op === '/') return true;
      return this.isRealExpression(expr.left) || this.isRealExpression(expr.right);
    }
    return false;
  }

  private async executeReturn(node: any): Promise<ReturnSignal> {
    const value = node.value ? await this.evaluateExpression(node.value) : null;
    return new ReturnSignal(value, this.getExpressionType(node.value, value));
  }

  private async executeIf(node: any): Promise<void> {
    const cond = await this.evaluateExpression(node.condition);
    if (typeof cond !== 'boolean') this.runtimeError(`IF condition must be BOOLEAN, got ${this.inferType(cond)}`);
    const branch = cond ? node.thenBranch : node.elseBranch;
    for (const s of branch as any[]) {
      const result = await this.executeNode(s);
      if (result instanceof ReturnSignal) throw result;
    }
  }

  private async executeCase(node: any): Promise<void> {
    const varName = node.variable as string;
    if (!this.variables.has(varName) && !this.constants.has(varName)) {
      throw this.runtimeError(`Undefined variable '${varName}'`);
    }
    const value = this.variables.get(varName) ?? this.constants.get(varName);
    const selectorType = this.variableTypes.get(varName) ?? this.inferType(value);
    for (const c of node.cases as { value: string; valueType: TokenType; rangeEnd?: string; rangeEndType?: TokenType; statements: any[] }[]) {
      const caseValue = this.getCaseLiteralValue(c.value, c.valueType, selectorType);
      const caseType = this.inferType(caseValue);
      if (!this.isTypeCompatible(selectorType, caseType, caseValue) &&
        !this.isTypeCompatible(caseType, selectorType, value)) {
        this.runtimeError(`CASE value type mismatch: selector '${varName}' is ${selectorType} but case value '${c.value}' is ${caseType}`);
      }
      if (c.rangeEnd) {
        const rangeEnd = this.getCaseLiteralValue(c.rangeEnd, c.rangeEndType!, selectorType);
        if (typeof value !== 'number' || typeof caseValue !== 'number' || typeof rangeEnd !== 'number') {
          this.runtimeError(`CASE ranges require numeric selector and values`);
        }
        if (value >= caseValue && value <= rangeEnd) {
          for (const s of c.statements) {
            const r = await this.executeNode(s);
            if (r instanceof ReturnSignal) throw r;
          }
          return;
        }
      } else if (value === caseValue) {
        for (const s of c.statements) {
          const r = await this.executeNode(s);
          if (r instanceof ReturnSignal) throw r;
        }
        return;
      }
    }
    if (node.otherwise) {
      for (const s of node.otherwise as any[]) {
        const r = await this.executeNode(s);
        if (r instanceof ReturnSignal) throw r;
      }
    }
  }

  private async executeFor(node: any): Promise<void> {
    const variableName = node.variable as string;
    if (!this.variableTypes.has(variableName)) this.runtimeError(`FOR control variable '${variableName}' must be declared`);
    if (this.variableTypes.get(variableName) !== 'INTEGER') this.runtimeError(`FOR control variable '${variableName}' must be INTEGER`);
    const startValue = await this.evaluateExpression(node.start);
    const endValue = await this.evaluateExpression(node.end);
    const stepValue = node.step ? await this.evaluateExpression(node.step) : 1;
    if (!Number.isInteger(startValue)) this.runtimeError(`FOR start expression must be INTEGER`);
    if (!Number.isInteger(endValue)) this.runtimeError(`FOR end expression must be INTEGER`);
    if (!Number.isInteger(stepValue)) this.runtimeError(`FOR STEP expression must be INTEGER`);
    const start = startValue as number;
    const end = endValue as number;
    const step = stepValue as number;
    if (step === 0) this.runtimeError('FOR loop STEP cannot be zero');
    this.variables.set(variableName, start);
    const test = step >= 0
      ? () => (this.variables.get(node.variable as string) as number) <= end
      : () => (this.variables.get(node.variable as string) as number) >= end;
    while (test()) {
      if (this.aborted) throw new Error('Execution aborted by user');
      if (++this.currentIteration > this.maxIterations) this.runtimeError('Maximum iterations exceeded');
      for (const s of node.body as any[]) { const r = await this.executeNode(s); if (r instanceof ReturnSignal) throw r; }
      this.variables.set(node.variable as string, (this.variables.get(node.variable as string) as number) + step);
    }
  }

  private async executeRepeat(node: any): Promise<void> {
    let condition: unknown;
    do {
      if (this.aborted) throw new Error('Execution aborted by user');
      if (++this.currentIteration > this.maxIterations) this.runtimeError('Maximum iterations exceeded');
      for (const s of node.body as any[]) { const r = await this.executeNode(s); if (r instanceof ReturnSignal) throw r; }
      condition = await this.evaluateExpression(node.condition);
      if (typeof condition !== 'boolean') this.runtimeError(`UNTIL condition must be BOOLEAN, got ${this.inferType(condition)}`);
    } while (!condition);
  }

  private async executeWhile(node: any): Promise<void> {
    while (true) {
      const condition = await this.evaluateExpression(node.condition);
      if (typeof condition !== 'boolean') this.runtimeError(`WHILE condition must be BOOLEAN, got ${this.inferType(condition)}`);
      if (!condition) break;
      if (this.aborted) throw new Error('Execution aborted by user');
      if (++this.currentIteration > this.maxIterations) this.runtimeError('Maximum iterations exceeded');
      for (const s of node.body as any[]) { const r = await this.executeNode(s); if (r instanceof ReturnSignal) throw r; }
    }
  }

  private getCaseLiteralValue(value: string, tokenType: TokenType, selectorType: string): unknown {
    if (tokenType === TokenType.NUMBER) return Number.parseInt(value, 10);
    if (tokenType === TokenType.REAL_NUMBER) return Number.parseFloat(value);
    if (tokenType === TokenType.TRUE) return true;
    if (tokenType === TokenType.FALSE) return false;
    if (tokenType === TokenType.STRING_LITERAL) return value;
    if (tokenType === TokenType.CHAR_LITERAL) return value;
    if (tokenType === TokenType.IDENTIFIER) {
      if (selectorType === 'CHAR' && value.length === 1) return value;
      for (const definition of this.typeDefinitions.values()) {
        const enumValue = definition.kind === 'enum'
          ? definition.values?.find(item => item.toUpperCase() === value.toUpperCase())
          : undefined;
        if (enumValue) return enumValue;
      }
    }
    this.runtimeError(`Invalid CASE value '${value}'`);
  }

  private executeProcedureDeclaration(node: any): void {
    if (this.isGlobalNameDeclared(node.name)) this.runtimeError(`Identifier '${node.name}' is already declared`);
    this.validateCallableSignature(node, node.name);
    this.procedures.set(node.name as string, node);
  }
  private executeFunctionDeclaration(node: any): void {
    if (this.isGlobalNameDeclared(node.name)) this.runtimeError(`Identifier '${node.name}' is already declared`);
    this.validateCallableSignature(node, node.name);
    this.functions.set(node.name as string, node);
  }

  private validateCallableSignature(node: any, label: string): void {
    const names = new Set<string>();
    for (const param of node.params as CallableParameter[]) {
      const normalized = param.name.toUpperCase();
      if (names.has(normalized)) this.runtimeError(`Duplicate parameter '${param.name}' in '${label}'`);
      names.add(normalized);
      if (param.type.startsWith('ARRAY_OF_')) {
        if (!param.elementType || !this.isKnownType(param.elementType)) {
          this.runtimeError(`Undefined array element type '${param.elementType ?? ''}' for parameter '${param.name}' in '${label}'`);
        }
        continue;
      }
      if (!this.isKnownType(param.type)) this.runtimeError(`Undefined parameter type '${param.type}' in '${label}'`);
    }
    if (node.type === 'FunctionDeclaration' && !this.isKnownType(node.returnType)) {
      this.runtimeError(`Undefined return type '${node.returnType}' in '${label}'`);
    }
  }

  private tokenTypeToDataType(type: TokenType): string {
    if (type === TokenType.NUMBER) return 'INTEGER';
    if (type === TokenType.REAL_NUMBER) return 'REAL';
    if (type === TokenType.STRING_LITERAL) return 'STRING';
    if (type === TokenType.CHAR_LITERAL) return 'CHAR';
    if (type === TokenType.TRUE || type === TokenType.FALSE) return 'BOOLEAN';
    return 'UNKNOWN';
  }

  private async executeProcedureCall(node: any): Promise<unknown> {
    const proc = this.procedures.get(node.name as string);
    if (proc) {
      this.callDepth++;
      if (this.callDepth > this.maxCallDepth) {
        this.callDepth--;
        this.runtimeError('Maximum call depth exceeded (possible infinite recursion)');
      }
      // Save only the variables that will be overwritten by parameters
      const savedVars = new Map<string, unknown>();
      const savedTypes = new Map<string, string>();
      const savedArrays = new Map<string, { dims: { lower: number; upper: number }[]; data: unknown[] }>();
      const args = node.args as any[];
      const byRefArgs: { paramName: string; argName: string }[] = [];
      const values = await this.validateCallArguments(`Procedure '${node.name}'`, proc.params, args, true);
      const variablesBeforeCall = new Set(this.variables.keys());
      const arraysBeforeCall = new Set(this.arrays.keys());

      for (let i = 0; i < proc.params.length; i++) {
        const param = proc.params[i] as CallableParameter;
        const arg = args[i];
        if (param.type.startsWith('ARRAY_OF_')) {
          if (this.arrays.has(param.name)) savedArrays.set(param.name, this.arrays.get(param.name)!);
          if (this.variableTypes.has(param.name)) savedTypes.set(param.name, this.variableTypes.get(param.name)!);
          const source = this.arrays.get(arg.name)!;
          this.arrays.set(param.name, param.byRef
            ? source
            : {
                dims: source.dims.map((dimension: { lower: number; upper: number }) => ({ ...dimension })),
                data: source.data.map((item: unknown) => this.deepClone(item)),
              });
          this.variableTypes.set(param.name, param.type);
          continue;
        }
        if (param.byRef && arg && arg.type === 'Identifier') {
          byRefArgs.push({ paramName: param.name, argName: arg.name });
        }
        // Save existing value for this param name before overwriting
        if (this.variables.has(param.name)) savedVars.set(param.name, this.variables.get(param.name));
        if (this.variableTypes.has(param.name)) savedTypes.set(param.name, this.variableTypes.get(param.name)!);
        this.variables.set(param.name, param.byRef ? values[i] : this.deepClone(values[i]));
        this.variableTypes.set(param.name, param.type);
      }

      try {
        for (const s of proc.body as any[]) await this.executeNode(s);
      } catch (e) {
        if (!(e instanceof ReturnSignal)) throw e;
      } finally {
        this.callDepth--;
      }

      // Write back BYREF parameters
      for (const { paramName, argName } of byRefArgs) {
        const value = this.variables.get(paramName);
        this.variables.set(argName, value);
      }

      // Restore only the saved parameter variables (remove params, restore originals)
      for (const param of proc.params as CallableParameter[]) {
        if (param.type.startsWith('ARRAY_OF_')) {
          if (savedArrays.has(param.name)) {
            this.arrays.set(param.name, savedArrays.get(param.name)!);
          } else {
            this.arrays.delete(param.name);
          }
          if (savedTypes.has(param.name)) {
            this.variableTypes.set(param.name, savedTypes.get(param.name)!);
          } else {
            this.variableTypes.delete(param.name);
          }
          continue;
        }
        if (savedVars.has(param.name)) {
          this.variables.set(param.name, savedVars.get(param.name));
        } else {
          this.variables.delete(param.name);
        }
        if (savedTypes.has(param.name)) {
          this.variableTypes.set(param.name, savedTypes.get(param.name)!);
        } else {
          this.variableTypes.delete(param.name);
        }
      }
      for (const name of [...this.variables.keys()]) {
        if (!variablesBeforeCall.has(name)) {
          this.variables.delete(name);
          this.variableTypes.delete(name);
        }
      }
      for (const name of [...this.arrays.keys()]) {
        if (!arraysBeforeCall.has(name)) {
          this.arrays.delete(name);
          this.variableTypes.delete(name);
        }
      }

      return null;
    }
    throw new Error(`Undefined procedure '${node.name}' at line ${node.line}`);
  }

  private async executeFunctionCall(node: any): Promise<unknown> {
    const nameUpper = (node.name as string).toUpperCase();
    const builtinSignatures: Record<string, string[]> = {
      LENGTH: ['STRING'],
      LCASE: ['CHAR'],
      UCASE: ['CHAR'],
      SUBSTRING: ['STRING', 'INTEGER', 'INTEGER'],
      MID: ['STRING', 'INTEGER', 'INTEGER'],
      RIGHT: ['STRING', 'INTEGER'],
      ROUND: ['NUMBER', 'INTEGER'],
      RANDOM: [],
      EOF: ['STRING'],
      INT: ['NUMBER'],
      RND: [],
      RAND: ['INTEGER'],
      NUM_TO_STRING: ['NUMBER'],
      STRING_TO_NUM: ['STRING'],
      DIV: ['NUMBER', 'NUMBER'],
      MOD: ['NUMBER', 'NUMBER'],
    };
    let builtinValues: unknown[] | null = null;
    if (builtinSignatures[nameUpper]) {
      const signature = builtinSignatures[nameUpper];
      if (node.args.length !== signature.length) {
        this.runtimeError(`${nameUpper} expects ${signature.length} argument${signature.length === 1 ? '' : 's'} but got ${node.args.length}`);
      }
      builtinValues = [];
      for (let i = 0; i < signature.length; i++) {
        const value = await this.evaluateExpression(node.args[i]);
        const actual = this.getExpressionType(node.args[i], value);
        const expected = signature[i];
        const compatible = expected === 'NUMBER'
          ? actual === 'INTEGER' || actual === 'REAL'
          : actual === expected;
        if (!compatible) this.runtimeError(`Type mismatch in ${nameUpper} argument ${i + 1}: expected ${expected} but got ${actual}`);
        builtinValues.push(value);
      }
    }
    const builtin = builtinValues ?? [];
    switch (nameUpper) {
      case 'LENGTH': return String(builtin[0]).length;
      case 'LCASE': return String(builtin[0]).toLowerCase();
      case 'UCASE': return String(builtin[0]).toUpperCase();
      case 'SUBSTRING': {
        const s = String(builtin[0]);
        const start = builtin[1] as number;
        const len = builtin[2] as number;
        // 边界检查：起始位置越界或无效时返回空串
        if (start < 1 || start > s.length) return '';
        // 长度修正：防止截取超出剩余范围
        const actualLen = Math.min(len, s.length - start + 1);
        return s.substring(start - 1, start - 1 + actualLen);
      }
      case 'ROUND': {
        const v = builtin[0] as number;
        const p = builtin[1] as number;
        const f = Math.pow(10, p); return Math.round(v * f) / f;
      }
      case 'RANDOM': return Math.random();
      case 'EOF': return this.isFileEOF(String(builtin[0]));
      case 'INT': return Math.trunc(builtin[0] as number);
      case 'RND': return Math.random();
      case 'NUM_TO_STRING': return String(builtin[0]);
      case 'STRING_TO_NUM': {
        const str = String(builtin[0]);
        const num = Number(str);
        if (isNaN(num)) this.runtimeError(`Cannot convert "${str}" to number`);
        return num;
      }
      case 'MID': {
        // MID(ThisString, x, y) — returns y characters starting at position x
        const midStr = String(builtin[0]);
        const midStart = builtin[1] as number;
        const midLen = builtin[2] as number;
        if (midStart < 1 || midStart > midStr.length) return '';
        const midActualLen = Math.min(midLen, midStr.length - midStart + 1);
        return midStr.substring(midStart - 1, midStart - 1 + midActualLen);
      }
      case 'RIGHT': {
        // RIGHT(ThisString, x) — returns rightmost x characters
        const rightStr = String(builtin[0]);
        const rightLen = builtin[1] as number;
        if (rightLen <= 0) return '';
        if (rightLen >= rightStr.length) return rightStr;
        return rightStr.substring(rightStr.length - rightLen);
      }
      case 'RAND': {
        // RAND(x) — returns a random real number in range 0 to x (not inclusive of x)
        const randMax = builtin[0] as number;
        return Math.random() * randMax;
      }
      case 'DIV': {
        const divisor = builtin[1] as number;
        if (divisor === 0) this.runtimeError('Division by zero');
        return Math.trunc((builtin[0] as number) / divisor);
      }
      case 'MOD': {
        const modDivisor = builtin[1] as number;
        if (modDivisor === 0) this.runtimeError('Division by zero');
        return (builtin[0] as number) % modDivisor;
      }
    }
    const func = this.functions.get(node.name as string);
    if (func) {
      const values = await this.validateCallArguments(`Function '${node.name}'`, func.params, node.args as any[]);
      this.callDepth++;
      if (this.callDepth > this.maxCallDepth) {
        this.callDepth--;
        this.runtimeError('Maximum call depth exceeded (possible infinite recursion)');
      }
      // Save only the variables that will be overwritten by parameters
      const savedVars = new Map<string, unknown>();
      const savedTypes = new Map<string, string>();
      const savedArrays = new Map<string, { dims: { lower: number; upper: number }[]; data: unknown[] }>();
      const variablesBeforeCall = new Set(this.variables.keys());
      const arraysBeforeCall = new Set(this.arrays.keys());
      for (let i = 0; i < func.params.length; i++) {
        const param = func.params[i] as CallableParameter;
        const arg = node.args[i];
        if (param.type.startsWith('ARRAY_OF_')) {
          if (this.arrays.has(param.name)) savedArrays.set(param.name, this.arrays.get(param.name)!);
          if (this.variableTypes.has(param.name)) savedTypes.set(param.name, this.variableTypes.get(param.name)!);
          const source = this.arrays.get(arg.name)!;
          this.arrays.set(param.name, {
            dims: source.dims.map((dimension: { lower: number; upper: number }) => ({ ...dimension })),
            data: source.data.map((item: unknown) => this.deepClone(item)),
          });
          this.variableTypes.set(param.name, param.type);
          continue;
        }
        if (this.variables.has(func.params[i].name)) savedVars.set(func.params[i].name, this.variables.get(func.params[i].name));
        if (this.variableTypes.has(func.params[i].name)) savedTypes.set(func.params[i].name, this.variableTypes.get(func.params[i].name)!);
        this.variables.set(func.params[i].name, this.deepClone(values[i]));
        this.variableTypes.set(func.params[i].name, func.params[i].type);
      }
      let result: unknown = null;
      let resultType = 'UNKNOWN';
      let hasReturned = false; try {
        for (const s of func.body as any[]) {
          const stmtResult = await this.executeNode(s);
          if (stmtResult instanceof ReturnSignal) {
            result = stmtResult.value;
            resultType = stmtResult.valueType;
            hasReturned = true;
            break;
          }
        }
      } catch (e) {
        if (e instanceof ReturnSignal) { result = e.value; resultType = e.valueType; hasReturned = true; }
        else { this.callDepth--; throw e; }
      }
      // Restore only the saved parameter variables
      for (const param of func.params as CallableParameter[]) {
        if (param.type.startsWith('ARRAY_OF_')) {
          if (savedArrays.has(param.name)) {
            this.arrays.set(param.name, savedArrays.get(param.name)!);
          } else {
            this.arrays.delete(param.name);
          }
          if (savedTypes.has(param.name)) {
            this.variableTypes.set(param.name, savedTypes.get(param.name)!);
          } else {
            this.variableTypes.delete(param.name);
          }
          continue;
        }
        if (savedVars.has(param.name)) {
          this.variables.set(param.name, savedVars.get(param.name));
        } else {
          this.variables.delete(param.name);
        }
        if (savedTypes.has(param.name)) {
          this.variableTypes.set(param.name, savedTypes.get(param.name)!);
        } else {
          this.variableTypes.delete(param.name);
        }
      }
      for (const name of [...this.variables.keys()]) {
        if (!variablesBeforeCall.has(name)) {
          this.variables.delete(name);
          this.variableTypes.delete(name);
        }
      }
      for (const name of [...this.arrays.keys()]) {
        if (!arraysBeforeCall.has(name)) {
          this.arrays.delete(name);
          this.variableTypes.delete(name);
        }
      }
      this.callDepth--;

      if (hasReturned) {
        if (!this.isTypeCompatible(func.returnType, resultType, result)) {
          this.runtimeError(`Return type mismatch in function '${node.name}': expected ${func.returnType} but got ${resultType}`);
        }
        return result;
      }
      // Function completed without RETURN statement
      this.runtimeError(`Function '${node.name}' did not return a value`);
    }
    if (this.currentThis && this.currentClassName) {
      const method = this.findMethod(this.currentClassName, node.name as string);
      if (method) return this.executeClassMethod(this.currentThis, method.owner, method.method, node.args || []);
    }
    const proc = this.procedures.get(node.name as string);
    if (proc) return this.executeProcedureCall(node);
    this.runtimeError(`Undefined function '${node.name}'`);
  }

  private async validateCallArguments(
    label: string,
    params: CallableParameter[],
    args: any[],
    validateByRef = false,
  ): Promise<unknown[]> {
    if (args.length !== params.length) {
      this.runtimeError(`${label} expects ${params.length} argument${params.length === 1 ? '' : 's'} but got ${args.length}`);
    }
    const values: unknown[] = [];
    for (let i = 0; i < params.length; i++) {
      const param = params[i];
      const arg = args[i];
      if (validateByRef && param.byRef && arg?.type !== 'Identifier') {
        this.runtimeError(`BYREF parameter '${param.name}' requires a variable argument`);
      }
      const value = await this.evaluateExpression(arg);
      values.push(value);
      if (param.type.startsWith('ARRAY_OF_')) {
        if (arg?.type !== 'Identifier' || !this.arrays.has(arg.name)) {
          this.runtimeError(`Array parameter '${param.name}' in ${label} requires an array variable argument`);
        }
        const actual = this.arrays.get(arg.name)!;
        const expectedDimensions = this.resolveArrayDimensions(
          param.dimensions ?? [],
          `array parameter '${param.name}' in ${label}`,
        );
        const actualElementType = this.variableTypes.get(arg.name)?.slice('ARRAY_OF_'.length) ?? '';
        const expectedElementType = this.getTypeString(param.elementType ?? '');
        if (actualElementType.toUpperCase() !== expectedElementType.toUpperCase()) {
          this.runtimeError(`Type mismatch for array parameter '${param.name}' in ${label}: expected elements of ${expectedElementType} but got ${actualElementType}`);
        }
        if (actual.dims.length !== expectedDimensions.length ||
          actual.dims.some((dimension, dimensionIndex) =>
            dimension.lower !== expectedDimensions[dimensionIndex].lower ||
            dimension.upper !== expectedDimensions[dimensionIndex].upper)) {
          const format = (dims: { lower: number; upper: number }[]) =>
            dims.map(dimension => `${dimension.lower}:${dimension.upper}`).join(',');
          this.runtimeError(`Array bounds mismatch for parameter '${param.name}' in ${label}: expected [${format(expectedDimensions)}] but got [${format(actual.dims)}]`);
        }
        continue;
      }
      const valueType = this.getExpressionType(arg, value);
      if (!this.isTypeCompatible(param.type, valueType, value)) {
        this.runtimeError(`Type mismatch for parameter '${param.name}' in ${label}: expected ${param.type} but got ${valueType}`);
      }
    }
    return values;
  }

  private executeFileOpenRead(node: any): void {
    const fn = this.resolveFilename(node.filename as string, node.filenameIsLiteral);
    if (this.openFiles.has(fn)) this.runtimeError(`File '${fn}' is already open`);
    if (!this.fileContents.has(fn)) this.fileContents.set(fn, []);
    this.openFiles.set(fn, 'read'); this.filePositions.set(fn, 0);
  }
  private executeFileOpenWrite(node: any): void {
    const fn = this.resolveFilename(node.filename as string, node.filenameIsLiteral);
    if (this.openFiles.has(fn)) this.runtimeError(`File '${fn}' is already open`);
    this.fileContents.set(fn, []); this.openFiles.set(fn, 'write'); this.filePositions.set(fn, 0);
  }
  private executeFileOpenAppend(node: any): void {
    const fn = this.resolveFilename(node.filename as string, node.filenameIsLiteral);
    if (this.openFiles.has(fn)) this.runtimeError(`File '${fn}' is already open`);
    if (!this.fileContents.has(fn)) this.fileContents.set(fn, []);
    const lines = this.fileContents.get(fn) ?? [];
    this.openFiles.set(fn, 'append'); this.filePositions.set(fn, lines.length);
  }
  private executeFileOpenRandom(node: any): void {
    const fn = this.resolveFilename(node.filename as string, node.filenameIsLiteral);
    if (this.openFiles.has(fn)) this.runtimeError(`File '${fn}' is already open`);
    if (!this.randomFileRecords.has(fn)) this.randomFileRecords.set(fn, []);
    this.openFiles.set(fn, 'random'); this.filePositions.set(fn, 0);
  }
  private async executeFileRead(node: any): Promise<void> {
    const fn = this.resolveFilename(node.filename as string, node.filenameIsLiteral);
    if (this.openFiles.get(fn) !== 'read') this.runtimeError(`READFILE requires '${fn}' to be open in READ mode`);
    const targetType = this.variableTypes.get(node.variable as string);
    if (!targetType) this.runtimeError(`Undefined variable '${node.variable}'`);
    if (targetType !== 'STRING') this.runtimeError(`READFILE target '${node.variable}' must be STRING, got ${targetType}`);
    const lines = this.fileContents.get(fn); const pos = this.filePositions.get(fn) ?? 0;
    if (!lines || pos >= lines.length) this.runtimeError(`End of file '${fn}' reached`);
    this.variables.set(node.variable as string, lines[pos]); this.filePositions.set(fn, pos + 1);
  }
  private async executeFileWrite(node: any): Promise<void> {
    const fn = this.resolveFilename(node.filename as string, node.filenameIsLiteral);
    const mode = this.openFiles.get(fn);
    if (mode !== 'write' && mode !== 'append') this.runtimeError(`WRITEFILE requires '${fn}' to be open in WRITE or APPEND mode`);
    const value = await this.evaluateExpression(node.value);
    const lines = this.fileContents.get(fn) ?? [];
    lines.push(String(value ?? ''));
    this.fileContents.set(fn, lines);
  }
  private async executeFileSeek(node: any): Promise<void> {
    const fn = this.resolveFilename(node.filename as string, node.filenameIsLiteral);
    if (this.openFiles.get(fn) !== 'random') this.runtimeError(`File '${fn}' is not open for random access`);
    const pos = Number(await this.evaluateExpression(node.position));
    if (!Number.isInteger(pos) || pos < 1) this.runtimeError(`SEEK position must be a positive integer`);
    this.filePositions.set(fn, pos - 1);
  }
  private async executeFileGetRecord(node: any): Promise<void> {
    const fn = this.resolveFilename(node.filename as string, node.filenameIsLiteral);
    if (this.openFiles.get(fn) !== 'random') this.runtimeError(`File '${fn}' is not open for random access`);
    const records = this.randomFileRecords.get(fn) ?? [];
    const pos = this.filePositions.get(fn) ?? 0;
    if (pos < 0 || pos >= records.length || records[pos] === undefined) this.runtimeError(`No record at position ${pos + 1} in file '${fn}'`);
    if (!this.variableTypes.has(node.variable as string)) this.runtimeError(`Undefined variable '${node.variable}'`);
    const expectedType = this.randomFileTypes.get(fn);
    const targetType = this.variableTypes.get(node.variable as string)!;
    if (expectedType && expectedType.toUpperCase() !== targetType.toUpperCase()) {
      this.runtimeError(`Random file record type mismatch: file '${fn}' contains ${expectedType} but target '${node.variable}' is ${targetType}`);
    }
    this.variables.set(node.variable as string, this.deepClone(records[pos]));
    this.filePositions.set(fn, pos + 1);
  }
  private async executeFilePutRecord(node: any): Promise<void> {
    const fn = this.resolveFilename(node.filename as string, node.filenameIsLiteral);
    if (this.openFiles.get(fn) !== 'random') this.runtimeError(`File '${fn}' is not open for random access`);
    const records = this.randomFileRecords.get(fn) ?? [];
    const pos = this.filePositions.get(fn) ?? 0;
    const value = await this.evaluateExpression(node.value);
    const valueType = this.getExpressionType(node.value, value);
    const existingType = this.randomFileTypes.get(fn);
    if (existingType && existingType.toUpperCase() !== valueType.toUpperCase()) {
      this.runtimeError(`Random file record type mismatch: file '${fn}' contains ${existingType} but value is ${valueType}`);
    }
    this.randomFileTypes.set(fn, existingType ?? valueType);
    records[pos] = this.deepClone(value);
    this.randomFileRecords.set(fn, records);
    this.filePositions.set(fn, pos + 1);
  }
  private executeFileClose(node: any): void {
    const fn = this.resolveFilename(node.filename as string, node.filenameIsLiteral);
    if (!this.openFiles.has(fn)) this.runtimeError(`File '${fn}' is not open`);
    this.openFiles.delete(fn); this.filePositions.delete(fn);
  }
  private isFileEOF(fn: string): boolean {
    fn = this.resolveFilename(fn, true);
    if (this.openFiles.get(fn) !== 'read') this.runtimeError(`File '${fn}' is not open for reading`);
    const lines = this.fileContents.get(fn); const pos = this.filePositions.get(fn) ?? 0;
    return !lines || pos >= lines.length;
  }

  private resolveFilename(filename: string, isLiteral = false): string {
    if (isLiteral) return filename;
    if (!this.variables.has(filename) && !this.constants.has(filename)) {
      this.runtimeError(`Undefined file identifier '${filename}'`);
    }
    const varValue = this.variables.get(filename);
    if (varValue !== undefined) {
      if (this.variableTypes.get(filename) !== 'STRING') {
        this.runtimeError(`File identifier '${filename}' must be STRING`);
      }
      return String(varValue);
    }
    const constValue = this.constants.get(filename);
    if (typeof constValue !== 'string') this.runtimeError(`File identifier '${filename}' must be STRING`);
    return constValue;
  }

  private async evaluateExpression(node: any): Promise<unknown> {
    if (!node || node.type === 'Empty') return null;
    switch (node.type) {
      case 'Identifier': {
        if (this.variables.has(node.name)) return this.variables.get(node.name);
        if (this.constants.has(node.name)) return this.constants.get(node.name);
        const array = this.arrays.get(node.name);
        if (array) {
          return {
            __arrayValue: true,
            dims: array.dims.map(dim => ({ ...dim })),
            data: array.data.map(item => this.deepClone(item)),
            elementType: this.variableTypes.get(node.name)?.slice('ARRAY_OF_'.length) ?? '',
          };
        }
        for (const type of this.typeDefinitions.values()) {
          if (type.kind !== 'enum') continue;
          const enumValue = type.values?.find(value => value.toUpperCase() === String(node.name).toUpperCase());
          if (enumValue) return enumValue;
        }
        throw this.runtimeError(`Undefined variable '${node.name}'`);
      }
      case 'NumberLiteral': return node.value;
      case 'RealLiteral': return node.value;
      case 'StringLiteral': return node.value;
      case 'CharLiteral': return node.value;
      case 'BooleanLiteral': return node.value;
      case 'DateLiteral': {
        if (!this.isValidDateLiteral(node.value)) this.runtimeError(`Invalid date literal '${node.value}'`);
        return node.value;
      }
      case 'ArrayAccess': {
        const arrInfo = this.arrays.get(node.name);
        if (arrInfo) {
          const indices = [];
          for (const idx of node.indices as any[]) {
            indices.push(await this.evaluateExpression(idx) as number);
          }
          const flatIndex = this.getFlatIndex(arrInfo.dims, indices);
          return arrInfo.data[flatIndex];
        }
        return null;
      }
      case 'FieldAccess': return this.evaluateFieldAccess(node);
      case 'PointerDereference': {
        const targetVarName = this.pointerVariables.get(node.name);
        if (!targetVarName) this.runtimeError(`Pointer '${node.name}' does not point to any variable`);
        if (this.variables.has(targetVarName)) return this.variables.get(targetVarName);
        if (this.constants.has(targetVarName)) return this.constants.get(targetVarName);
        this.runtimeError(`Undefined variable '${targetVarName}'`);
      }
      case 'AddressOf': {
        // ^MyVar — 返回指向该变量的指针（将指针变量指向目标变量）
        const varName = node.name as string;
        // 检查目标变量是否存在
        if (!this.variableTypes.has(varName)) this.runtimeError(`Undefined variable '${varName}'`);
        // 在指针变量中建立映射（需要在 DECLARE MyPtr : TIntPointer 之后才能用）
        // 这里我们把 "指向 varName" 的关系存下来
        // 注意：AddressOf 是表达式，不是声明式赋值，所以我们需要把它作为一个值返回
        // 实际上，^MyVar 作为 RHS 时，我们创建一个代理对象
        return { __pointerTarget: varName };
      }
      case 'FunctionCall': return this.executeFunctionCall(node);
      case 'MethodCall': return this.executeMethodCall(node);
      case 'SuperMethodCall': return this.executeSuperMethodCall(node);
      case 'ObjectCreation': return this.createObject(node.className, node.args || []);
      case 'ProcedureCall': return this.executeProcedureCall(node);
      case 'BinaryExpression': return this.evalBinary(node);
      case 'UnaryExpression': return this.evalUnary(node);
    }
    return null;
  }

  private findFieldVisibility(className: string, fieldName: string): 'public' | 'private' {
    const cls = this.classDefinitions.get(className);
    if (!cls) return 'public';
    const field = cls.fields.find((f: any) => String(f.name).toUpperCase() === fieldName.toUpperCase());
    if (field) return field.visibility || 'public';
    if (cls.parent) return this.findFieldVisibility(cls.parent, fieldName);
    return 'public';
  }

  private async evaluateFieldAccess(node: any): Promise<unknown> {
    const base = await this.evaluateExpression(node.record);
    if (typeof base !== 'object' || base === null) this.runtimeError(`Cannot access field on non-record value`);
    const record = base as Record<string, unknown>;
    const className = this.objectClasses.get(record) || (record as any).__className;
    if (className && this.findFieldVisibility(className, node.field) === 'private' && this.currentThis !== record) {
      this.runtimeError(`Cannot access private field '${node.field}' of class '${className}'`);
    }
    const key = this.getObjectKey(record, node.field);
    if (!key) this.runtimeError(`Record has no field '${node.field}'`);
    return record[key];
  }

  private isValidDateLiteral(value: string): boolean {
    const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
    if (!match) return false;
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day;
  }

  private async evalBinary(node: any): Promise<unknown> {
    const l = await this.evaluateExpression(node.left);
    const r = await this.evaluateExpression(node.right);
    switch (node.operator) {
      case '+': {
        if (typeof l === 'number' && typeof r === 'number') return (l as number) + (r as number);
        if (typeof l === 'string' && typeof r === 'string') return l + r;
        this.runtimeError(`Type mismatch: cannot use '+' operator with ${typeof l === 'number' ? (Number.isInteger(l) ? 'INTEGER' : 'REAL') : typeof l === 'string' ? 'STRING' : typeof l === 'boolean' ? 'BOOLEAN' : 'UNKNOWN'} and ${typeof r === 'number' ? (Number.isInteger(r) ? 'INTEGER' : 'REAL') : typeof r === 'string' ? 'STRING' : typeof r === 'boolean' ? 'BOOLEAN' : 'UNKNOWN'}`);
      }
      case '-': {
        if (typeof l !== 'number' || typeof r !== 'number') this.runtimeError(`Type mismatch: cannot use '-' with non-numeric values`);
        return (l as number) - (r as number);
      }
      case '*': {
        if (typeof l !== 'number' || typeof r !== 'number') this.runtimeError(`Type mismatch: cannot use '*' with non-numeric values`);
        return (l as number) * (r as number);
      }
      case '/': {
        if (typeof l !== 'number' || typeof r !== 'number') this.runtimeError(`Type mismatch: cannot use '/' with non-numeric values`);
        const rightNum = r as number;
        if (rightNum === 0) this.runtimeError('Division by zero');
        return (l as number) / rightNum;
      }
      case '^': {
        if (typeof l !== 'number' || typeof r !== 'number') this.runtimeError(`Type mismatch: cannot use '^' with non-numeric values`);
        return Math.pow(l as number, r as number);
      }
      case '=': {
        if (typeof l !== typeof r) this.runtimeError(`Type mismatch: cannot compare ${this.inferType(l)} with ${this.inferType(r)} using '='`);
        return l === r;
      }
      case '<>': {
        if (typeof l !== typeof r) this.runtimeError(`Type mismatch: cannot compare ${this.inferType(l)} with ${this.inferType(r)} using '<>'`);
        return l !== r;
      }
      case '<': {
        if (typeof l !== 'number' || typeof r !== 'number') this.runtimeError(`Type mismatch: cannot compare non-numeric values using '<'`);
        return (l as number) < (r as number);
      }
      case '<=': {
        if (typeof l !== 'number' || typeof r !== 'number') this.runtimeError(`Type mismatch: cannot compare non-numeric values using '<='`);
        return (l as number) <= (r as number);
      }
      case '>': {
        if (typeof l !== 'number' || typeof r !== 'number') this.runtimeError(`Type mismatch: cannot compare non-numeric values using '>'`);
        return (l as number) > (r as number);
      }
      case '>=': {
        if (typeof l !== 'number' || typeof r !== 'number') this.runtimeError(`Type mismatch: cannot compare non-numeric values using '>='`);
        return (l as number) >= (r as number);
      }
      case '&': {
        if (typeof l !== 'string' || typeof r !== 'string') this.runtimeError(`Type mismatch: cannot use '&' with non-string values`);
        return l + r;
      }
      case 'AND': {
        if (typeof l !== 'boolean' || typeof r !== 'boolean') this.runtimeError(`Type mismatch: cannot use 'AND' with non-boolean values`);
        return l && r;
      }
      case 'OR': {
        if (typeof l !== 'boolean' || typeof r !== 'boolean') this.runtimeError(`Type mismatch: cannot use 'OR' with non-boolean values`);
        return l || r;
      }
      case 'DIV': {
        if (typeof l !== 'number' || typeof r !== 'number') this.runtimeError(`Type mismatch: cannot use 'DIV' with non-numeric values`);
        const rightNum = r as number;
        if (rightNum === 0) this.runtimeError('Division by zero');
        return Math.trunc((l as number) / rightNum);
      }
      case 'MOD': {
        if (typeof l !== 'number' || typeof r !== 'number') this.runtimeError(`Type mismatch: cannot use 'MOD' with non-numeric values`);
        const rightNum = r as number;
        if (rightNum === 0) this.runtimeError('Division by zero');
        return (l as number) % rightNum;
      }
    }
    return null;
  }

  private async evalUnary(node: any): Promise<unknown> {
    const op = await this.evaluateExpression(node.operand);
    switch (node.operator) {
      case 'NOT': {
        if (typeof op !== 'boolean') this.runtimeError(`Type mismatch: cannot use 'NOT' with non-boolean value`);
        return !op;
      }
      case '-': {
        if (typeof op !== 'number') this.runtimeError(`Type mismatch: cannot use unary '-' with non-numeric value`);
        return -(op as number);
      }
    }
    return op;
  }
}

// ════════════════════════════════════════════════════════════════
//  PseudocodeParser (主入口)
// ════════════════════════════════════════════════════════════════
export class ALevelParser {
  private lexer = new Lexer('');
  private parser = new Parser([]);
  private interpreter = new Interpreter();

  public abort(): void { this.interpreter.abort(); }

  public parse(source: string): ASTNode {
    try {
      this.lexer = new Lexer(source);
      const tokens = this.lexer.tokenize();
      this.parser = new Parser(tokens);
      return this.parser.parse();
    } catch (error) {
      throw normalizePseudocodeError(error);
    }
  }

  public async run(source: string, inputCallback?: (prompt?: string) => Promise<unknown>, onOutput?: (text: string) => void): Promise<string[]> {
    try {
      this.interpreter.reset();
      const ast = this.parse(source);
      if (inputCallback) this.interpreter.setInputCallback(inputCallback);
      if (onOutput) this.interpreter.setOnOutput(onOutput);
      return await this.interpreter.execute(ast);
    } catch (error) {
      throw normalizePseudocodeError(error);
    }
  }

  public checkSyntax(source: string): Array<{ line: number; message: string }> {
    try {
      this.lexer = new Lexer(source);
      const tokens = this.lexer.tokenize();
      this.parser = new Parser(tokens);
      return this.parser.checkSyntax();
    } catch (error) {
      const diagnosticError = normalizePseudocodeError(error);
      return [{
        line: diagnosticError.diagnostic.line ?? 1,
        message: diagnosticError.message,
      }];
    }
  }

  public getTokens(source: string): Token[] {
    this.lexer = new Lexer(source);
    return this.lexer.tokenize();
  }

  public setFileContent(filename: string, content: string | string[]): void {
    this.interpreter.setFileContent(filename, content);
  }
  public getFileContent(filename: string): string[] | undefined {
    return this.interpreter.getFileContent(filename);
  }
  public getAllFiles(): Record<string, string[]> {
    return this.interpreter.getAllFiles();
  }
  public deleteFile(filename: string): void {
    this.interpreter.deleteFile(filename);
  }
  public clearAllFiles(): void {
    this.interpreter.clearAllFiles();
  }
  public getTraceTable(): TraceEntry[] {
    return this.interpreter.getTraceTable();
  }
  public getVariables(): Record<string, unknown> {
    return Object.fromEntries(this.interpreter.getVariables());
  }
  public getVariableTypes(): Record<string, string> {
    return Object.fromEntries(this.interpreter.getVariableTypes());
  }
  public getArrays(): Record<string, { dims: { lower: number; upper: number }[]; data: unknown[] }> {
    return Object.fromEntries(this.interpreter.getArrays());
  }
  public getTypeDefinitions(): Record<string, { kind: string; values?: string[]; baseType?: string; fields?: { name: string; dataType: string }[] }> {
    return Object.fromEntries(this.interpreter.getTypeDefinitions());
  }
  public getSetDefinitions(): Record<string, { values: string[]; setType: string }> {
    return Object.fromEntries(this.interpreter.getSetDefinitions());
  }
  public getPointerVariables(): Record<string, string> {
    return Object.fromEntries(this.interpreter.getPointerVariables());
  }
}
