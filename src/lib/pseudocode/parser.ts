/**
 * Cambridge IGCSE Pseudocode Parser
 * 严格遵循 Cambridge IGCSE Computer Science 0478 (2026-2028) 伪代码规范
 */

/* eslint-disable @typescript-eslint/no-explicit-any */


// ─── Return 控制流 ───
class ReturnSignal {
  constructor(public value: unknown) {}
}

// ─── Token 类型 ───
export enum TokenType {
  // 数据类型
  INTEGER = 'INTEGER', REAL = 'REAL', CHAR = 'CHAR', STRING = 'STRING', BOOLEAN = 'BOOLEAN',
  // 关键字
  DECLARE = 'DECLARE', CONSTANT = 'CONSTANT', INPUT = 'INPUT', OUTPUT = 'OUTPUT',
  IF = 'IF', THEN = 'THEN', ELSE = 'ELSE', ENDIF = 'ENDIF',
  CASE = 'CASE', OF = 'OF', OTHERWISE = 'OTHERWISE', ENDCASE = 'ENDCASE',
  FOR = 'FOR', TO = 'TO', STEP = 'STEP', NEXT = 'NEXT',
  REPEAT = 'REPEAT', UNTIL = 'UNTIL', WHILE = 'WHILE', DO = 'DO', ENDWHILE = 'ENDWHILE',
  PROCEDURE = 'PROCEDURE', FUNCTION = 'FUNCTION',
  ENDPROCEDURE = 'ENDPROCEDURE', ENDFUNCTION = 'ENDFUNCTION',
  RETURNS = 'RETURNS', RETURN = 'RETURN',
  CALL = 'CALL',
  BYREF = 'BYREF', BYVAL = 'BYVAL',
  ARRAY = 'ARRAY', AND = 'AND', OR = 'OR', NOT = 'NOT', TRUE = 'TRUE', FALSE = 'FALSE',
  // 内置函数
  LENGTH = 'LENGTH', LCASE = 'LCASE', UCASE = 'UCASE', SUBSTRING = 'SUBSTRING',
  ROUND = 'ROUND', RANDOM = 'RANDOM', RANDOMIZE = 'RANDOMIZE', DIV = 'DIV', MOD = 'MOD', EOF_FUNC = 'EOF_FUNC',
  INT_FUNC = 'INT_FUNC', RND = 'RND',
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
  | 'Identifier' | 'NumberLiteral' | 'RealLiteral' | 'StringLiteral' | 'CharLiteral' | 'BooleanLiteral'
  | 'ArrayAccess' | 'ArrayDeclaration'
  | 'FileOpenRead' | 'FileOpenWrite' | 'FileRead' | 'FileWrite' | 'FileClose'
  | 'RandomizeStatement' | 'Empty';

export interface ASTNode { type: ASTNodeType; [key: string]: unknown; }

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
    STRING: TokenType.STRING, BOOLEAN: TokenType.BOOLEAN,
    DECLARE: TokenType.DECLARE, CONSTANT: TokenType.CONSTANT,
    INPUT: TokenType.INPUT, OUTPUT: TokenType.OUTPUT,
    IF: TokenType.IF, THEN: TokenType.THEN, ELSE: TokenType.ELSE, ENDIF: TokenType.ENDIF,
    CASE: TokenType.CASE, OF: TokenType.OF, OTHERWISE: TokenType.OTHERWISE, ENDCASE: TokenType.ENDCASE,
    FOR: TokenType.FOR, TO: TokenType.TO, STEP: TokenType.STEP, NEXT: TokenType.NEXT,
    REPEAT: TokenType.REPEAT, UNTIL: TokenType.UNTIL,
    WHILE: TokenType.WHILE, DO: TokenType.DO, ENDWHILE: TokenType.ENDWHILE,
    PROCEDURE: TokenType.PROCEDURE, FUNCTION: TokenType.FUNCTION,
    ENDPROCEDURE: TokenType.ENDPROCEDURE, ENDFUNCTION: TokenType.ENDFUNCTION,
    RETURNS: TokenType.RETURNS, RETURN: TokenType.RETURN,
    CALL: TokenType.CALL,
    BYREF: TokenType.BYREF, BYVAL: TokenType.BYVAL,
    ARRAY: TokenType.ARRAY, AND: TokenType.AND, OR: TokenType.OR, NOT: TokenType.NOT,
    TRUE: TokenType.TRUE, FALSE: TokenType.FALSE,
    LENGTH: TokenType.LENGTH, LCASE: TokenType.LCASE, UCASE: TokenType.UCASE,
    SUBSTRING: TokenType.SUBSTRING, ROUND: TokenType.ROUND, RANDOM: TokenType.RANDOM,
    DIV: TokenType.DIV, MOD: TokenType.MOD, EOF: TokenType.EOF_FUNC,
    RANDOMIZE: TokenType.RANDOMIZE, INT: TokenType.INT_FUNC, RND: TokenType.RND,
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
    const builtinFunctions = ['LENGTH', 'LCASE', 'UCASE', 'SUBSTRING', 'ROUND', 'RANDOM', 'EOF', 'INT', 'RND', 'NUM_TO_STRING', 'STRING_TO_NUM'];
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
    return { type: real ? TokenType.REAL_NUMBER : TokenType.NUMBER, value: n, line, column: col };
  }

  private readString(q: string): Token {
    const line = this.line, col = this.column;
    this.advance();
    let s = '';
    while (this.pos < this.source.length && this.peek() !== q) s += this.advance();
    if (this.pos < this.source.length) this.advance();
    return { type: TokenType.STRING_LITERAL, value: s, line, column: col };
  }

  private readChar(): Token {
    const line = this.line, col = this.column;
    this.advance();
    let ch = '';
    if (this.peek() !== "'") ch = this.advance();
    if (this.peek() === "'") this.advance();
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
        case '^': tok = { type: TokenType.POWER, value: '^', line, column: col }; this.advance(); break;
        case '&': tok = { type: TokenType.AMPERSAND, value: '&', line, column: col }; this.advance(); break;
        case '(': tok = { type: TokenType.LPAREN, value: '(', line, column: col }; this.advance(); break;
        case ')': tok = { type: TokenType.RPAREN, value: ')', line, column: col }; this.advance(); break;
        case '[': tok = { type: TokenType.LBRACKET, value: '[', line, column: col }; this.advance(); break;
        case ']': tok = { type: TokenType.RBRACKET, value: ']', line, column: col }; this.advance(); break;
        case ':': tok = { type: TokenType.COLON, value: ':', line, column: col }; this.advance(); break;
        case ',': tok = { type: TokenType.COMMA, value: ',', line, column: col }; this.advance(); break;
      }
      if (tok) tokens.push(tok); else this.advance();
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
      TokenType.NEXT, TokenType.UNTIL, TokenType.ENDWHILE, TokenType.ENDIF,
      TokenType.ENDCASE, TokenType.ENDPROCEDURE, TokenType.ENDFUNCTION,
      TokenType.ELSE, TokenType.THEN, TokenType.OTHERWISE,
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
      TokenType.NUM_TO_STRING, TokenType.STRING_TO_NUM,
    ].includes(t.type);
  }

  private parseStatement(): ASTNode {
    const t = this.peek();
    switch (t.type) {
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
      case TokenType.RANDOMIZE: this.advance(); return { type: 'RandomizeStatement' };
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
    const validDataTypes: string[] = [TokenType.INTEGER, TokenType.REAL, TokenType.CHAR, TokenType.STRING, TokenType.BOOLEAN];
    if (!validDataTypes.includes(dt.type)) {
      throw new Error(`Invalid data type '${dt.value}' for variable '${name.value}' at line ${name.line}. Valid types: INTEGER, REAL, CHAR, STRING, BOOLEAN`);
    }
    return { type: 'VariableDeclaration', name: name.value, dataType: dt.type, line: name.line };
  }

  private parseArrayDeclaration(name: string, line: number): ASTNode {
    this.expect(TokenType.ARRAY); this.expect(TokenType.LBRACKET);
    const dims: { lower: number; upper: number }[] = [];
    const lo1 = parseInt(this.expect(TokenType.NUMBER).value);
    this.expect(TokenType.COLON);
    const hi1 = parseInt(this.expect(TokenType.NUMBER).value);
    dims.push({ lower: lo1, upper: hi1 });
    if (this.match(TokenType.COMMA)) {
      const lo2 = parseInt(this.expect(TokenType.NUMBER).value);
      this.expect(TokenType.COLON);
      const hi2 = parseInt(this.expect(TokenType.NUMBER).value);
      dims.push({ lower: lo2, upper: hi2 });
    }
    this.expect(TokenType.RBRACKET); this.expect(TokenType.OF);
    const dt = this.advance();
    const validDataTypes: string[] = [TokenType.INTEGER, TokenType.REAL, TokenType.CHAR, TokenType.STRING, TokenType.BOOLEAN];
    if (!validDataTypes.includes(dt.type)) {
      throw new Error(`Invalid data type '${dt.value}' for array '${name}' at line ${line}. Valid types: INTEGER, REAL, CHAR, STRING, BOOLEAN`);
    }
    return { type: 'ArrayDeclaration', name, dimensions: dims, dataType: dt.type, line };
  }

  private parseConstant(): ASTNode {
    this.expect(TokenType.CONSTANT);
    const name = this.expect(TokenType.IDENTIFIER);
    this.expect(TokenType.ASSIGN);
    const value = this.parseExpression();
    return { type: 'ConstantDeclaration', name: name.value, value, line: name.line };
  }

  // ─── 输入输出 ───
  private parseInput(): ASTNode {
    this.expect(TokenType.INPUT);
    const name = this.expect(TokenType.IDENTIFIER);
    return { type: 'InputStatement', variable: name.value, line: name.line };
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
    while (this.peek().type !== TokenType.ELSE && this.peek().type !== TokenType.ENDIF) thenBranch.push(this.parseStatement());
    const elseBranch: ASTNode[] = [];
    if (this.match(TokenType.ELSE)) {
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
    const cases: { value: string; statements: ASTNode[] }[] = [];
    let otherwise: ASTNode[] | null = null;
    while (this.peek().type !== TokenType.ENDCASE) {
      if (this.peek().type === TokenType.OTHERWISE) {
        this.expect(TokenType.OTHERWISE);
        const stmts: ASTNode[] = [];
        while (this.peek().type !== TokenType.ENDCASE && 
               !this.isCaseValue(this.peek()) && 
               this.peek().type !== TokenType.OTHERWISE) {
          stmts.push(this.parseStatement());
        }
        otherwise = stmts;
        break;
      }
      const val = this.advance();
      this.expect(TokenType.COLON);
      const stmts: ASTNode[] = [];
      while (this.peek().type !== TokenType.ENDCASE && 
             !this.isCaseValue(this.peek()) && 
             this.peek().type !== TokenType.OTHERWISE) {
        stmts.push(this.parseStatement());
      }
      cases.push({ value: val.value, statements: stmts });
    }
    this.expect(TokenType.ENDCASE);
    return { type: 'CaseStatement', variable: variable.value, cases, otherwise };
  }
  
  // 判断 token 是否是 case 分支的可能值
  private isCaseValue(t: Token): boolean {
    return [
      TokenType.STRING_LITERAL, 
      TokenType.CHAR_LITERAL, 
      TokenType.NUMBER, 
      TokenType.REAL_NUMBER,
      TokenType.TRUE,
      TokenType.FALSE
    ].includes(t.type);
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
    while (this.peek().type !== TokenType.NEXT) body.push(this.parseStatement());
    this.expect(TokenType.NEXT);
    if (this.peek().type === TokenType.IDENTIFIER && this.peek().value.toUpperCase() === variable.value.toUpperCase()) {
      this.advance();
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
    
    const startPos = this.pos;
    let doPos = -1;
    for (let i = startPos; i < this.tokens.length; i++) {
      if (this.tokens[i].type === TokenType.DO) {
        doPos = i;
        break;
      }
    }
    
    let condition: ASTNode;
    
    if (doPos > startPos && doPos - startPos <= 30) {
      const conditionTokens = this.tokens.slice(startPos, doPos);
      const subParser = new Parser(conditionTokens);
      condition = subParser.parseExpressionSimple();
      this.pos = doPos;
    } else {
      condition = this.parseExpression();
    }
    
    this.expect(TokenType.DO);
    const body: ASTNode[] = [];
    while (this.peek().type !== TokenType.ENDWHILE) body.push(this.parseStatement());
    this.expect(TokenType.ENDWHILE);
    return { type: 'WhileLoop', condition, body };
  }

  // ─── PROCEDURE — IGCSE 规范: 无参数时可省略括号 ───
  private parseProcedure(): ASTNode {
    this.expect(TokenType.PROCEDURE);
    const name = this.expect(TokenType.IDENTIFIER);
    const params: { name: string; type: string; byRef?: boolean }[] = [];
    // 支持无参数形式: PROCEDURE Name
    if (this.peek().type === TokenType.LPAREN) {
      this.expect(TokenType.LPAREN);
      while (!this.match(TokenType.RPAREN)) {
        let byRef = false;
        if (this.match(TokenType.BYREF)) {
          byRef = true;
        } else {
          this.match(TokenType.BYVAL);
        }
        const pName = this.expect(TokenType.IDENTIFIER);
        this.expect(TokenType.COLON);
        const pType = this.advance();
        params.push({ name: pName.value, type: pType.value.toUpperCase(), byRef });
        if (this.peek().type !== TokenType.RPAREN) this.expect(TokenType.COMMA);
      }
    }
    const body: ASTNode[] = [];
    while (this.peek().type !== TokenType.ENDPROCEDURE) body.push(this.parseStatement());
    this.expect(TokenType.ENDPROCEDURE);
    return { type: 'ProcedureDeclaration', name: name.value, params, body };
  }

  // ─── FUNCTION — IGCSE 规范: 无参数时可省略括号 ───
  private parseFunction(): ASTNode {
    this.expect(TokenType.FUNCTION);
    const name = this.expect(TokenType.IDENTIFIER);
    const params: { name: string; type: string; byRef?: boolean }[] = [];
    // 支持无参数形式: FUNCTION Name RETURNS type
    if (this.peek().type === TokenType.LPAREN) {
      this.expect(TokenType.LPAREN);
      while (!this.match(TokenType.RPAREN)) {
        let byRef = false;
        if (this.match(TokenType.BYREF)) {
          byRef = true;
        } else {
          this.match(TokenType.BYVAL);
        }
        const pName = this.expect(TokenType.IDENTIFIER);
        this.expect(TokenType.COLON);
        const pType = this.advance();
        params.push({ name: pName.value, type: pType.value.toUpperCase(), byRef });
        if (this.peek().type !== TokenType.RPAREN) this.expect(TokenType.COMMA);
      }
    }
    this.expect(TokenType.RETURNS);
    const returnType = this.advance();
    const body: ASTNode[] = [];
    while (this.peek().type !== TokenType.ENDFUNCTION) body.push(this.parseStatement());
    this.expect(TokenType.ENDFUNCTION);
    return { type: 'FunctionDeclaration', name: name.value, params, returnType: returnType.value.toUpperCase(), body };
  }

  // ─── CALL — IGCSE 规范: CALL ProcedureName 或 CALL ProcedureName(args) ───
  private parseCall(): ASTNode {
    const tok = this.expect(TokenType.CALL);
    const name = this.expect(TokenType.IDENTIFIER);
    const args: ASTNode[] = [];
    if (this.peek().type === TokenType.LPAREN) {
      this.expect(TokenType.LPAREN);
      while (!this.match(TokenType.RPAREN)) {
        args.push(this.parseExpressionSimple());
        if (!this.match(TokenType.COMMA)) { if (this.peek().type !== TokenType.RPAREN) break; }
      }
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
      return { type: 'FileOpenRead', filename: f.value, line: tok.line };
    } else if (mode.type === TokenType.WRITE) {
      return { type: 'FileOpenWrite', filename: f.value, line: tok.line };
    }
    throw new Error(`Expected READ or WRITE after FOR in OPENFILE, got '${mode.value}' at line ${mode.line}`);
  }

  private parseFileRead(): ASTNode {
    this.expect(TokenType.READFILE); const f = this.parseFilename();
    this.expect(TokenType.COMMA); const v = this.expect(TokenType.IDENTIFIER);
    return { type: 'FileRead', filename: f.value, variable: v.value, line: f.line };
  }
  private parseFileWrite(): ASTNode {
    this.expect(TokenType.WRITEFILE); const f = this.parseFilename();
    this.expect(TokenType.COMMA);
    const value = this.parseExpression();
    return { type: 'FileWrite', filename: f.value, value, line: f.line };
  }
  private parseFileClose(): ASTNode {
    this.expect(TokenType.CLOSEFILE); const f = this.parseFilename();
    return { type: 'FileClose', filename: f.value, line: f.line };
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
      this.expect(TokenType.ASSIGN);
      const value = this.parseExpression();
      return { type: 'Assignment', target: { type: 'ArrayAccess', name: name.value, indices }, value, line: name.line };
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

    if (t.type === TokenType.NUMBER) { this.advance(); return { type: 'NumberLiteral', value: parseInt(t.value) }; }
    if (t.type === TokenType.REAL_NUMBER) { this.advance(); return { type: 'RealLiteral', value: parseFloat(t.value) }; }
    if (t.type === TokenType.STRING_LITERAL) { this.advance(); return { type: 'StringLiteral', value: t.value }; }
    if (t.type === TokenType.CHAR_LITERAL) { this.advance(); return { type: 'CharLiteral', value: t.value }; }
    if (t.type === TokenType.TRUE) { this.advance(); return { type: 'BooleanLiteral', value: true }; }
    if (t.type === TokenType.FALSE) { this.advance(); return { type: 'BooleanLiteral', value: false }; }

    // DIV 和 MOD 作为函数调用: DIV(a, b) / MOD(a, b)
    if (t.type === TokenType.DIV || t.type === TokenType.MOD) {
      const funcName = t.type === TokenType.DIV ? 'DIV' : 'MOD';
      this.advance();
      this.expect(TokenType.LPAREN);
      const args: ASTNode[] = [];
      while (!this.match(TokenType.RPAREN)) {
        args.push(this.parseExpressionSimple());
        if (!this.match(TokenType.COMMA)) { if (this.peek().type !== TokenType.RPAREN) break; }
      }
      return { type: 'FunctionCall', name: funcName, args };
    }

    // 处理所有内置函数 token 类型
    const builtinTokenTypes = new Set([
      TokenType.LENGTH, TokenType.LCASE, TokenType.UCASE, 
      TokenType.SUBSTRING, TokenType.ROUND, TokenType.RANDOM, 
      TokenType.EOF_FUNC, TokenType.INT_FUNC, TokenType.RND,
      TokenType.NUM_TO_STRING, TokenType.STRING_TO_NUM
    ]);
    const builtinNames: Partial<Record<TokenType, string>> = {
      [TokenType.LENGTH]: 'LENGTH',
      [TokenType.LCASE]: 'LCASE',
      [TokenType.UCASE]: 'UCASE',
      [TokenType.SUBSTRING]: 'SUBSTRING',
      [TokenType.ROUND]: 'ROUND',
      [TokenType.RANDOM]: 'RANDOM',
      [TokenType.EOF_FUNC]: 'EOF',
      [TokenType.INT_FUNC]: 'INT',
      [TokenType.RND]: 'RND',
      [TokenType.NUM_TO_STRING]: 'NUM_TO_STRING',
      [TokenType.STRING_TO_NUM]: 'STRING_TO_NUM',
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
        return { type: 'ArrayAccess', name: name.value, indices };
      }
      if (this.match(TokenType.LPAREN)) {
        const args: ASTNode[] = [];
        while (!this.match(TokenType.RPAREN)) {
          args.push(this.parseExpressionSimple());
          if (!this.match(TokenType.COMMA)) { if (this.peek().type !== TokenType.RPAREN) break; }
        }
        return { type: 'FunctionCall', name: name.value, args };
      }
      return { type: 'Identifier', name: name.value };
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
  private variables = new Map<string, unknown>();
  private constants = new Map<string, unknown>();
  private arrays = new Map<string, { dims: { lower: number; upper: number }[]; data: unknown[] }>();
  private procedures = new Map<string, any>();
  private functions = new Map<string, any>();
  private output: string[] = [];
  private onOutput?: (text: string) => void;
  private inputCallback?: (prompt?: string) => Promise<unknown>;
  private maxIterations = 10000;
  private maxCallDepth = 500;
  private currentIteration = 0;
  private callDepth = 0;
  private aborted = false;
  private fileContents = new Map<string, string[]>();
  private filePositions = new Map<string, number>();
  private traceTable: TraceEntry[] = [];
  private traceEnabled = true;
  private lastOutputLine = 0;
  private openFiles = new Map<string, 'read' | 'write'>();

  // 变量类型追踪，用于 REAL 输出格式化
  private variableTypes = new Map<string, string>();

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
  getArrays(): Map<string, { dims: { lower: number; upper: number }[]; data: unknown[] }> { return this.arrays; }
  
  reset(): void {
    this.variables.clear(); this.constants.clear(); this.arrays.clear();
    this.variableTypes.clear();
    this.output = []; this.currentIteration = 0; this.callDepth = 0; this.aborted = false;
    this.filePositions.clear(); this.openFiles.clear();
    this.traceTable = []; this.lastOutputLine = 0;
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
      case 'FileOpenRead': return this.executeFileOpenRead(node);
      case 'FileOpenWrite': return this.executeFileOpenWrite(node);
      case 'FileRead': return this.executeFileRead(node);
      case 'FileWrite': return this.executeFileWrite(node);
      case 'FileClose': return this.executeFileClose(node);
      case 'RandomizeStatement': return null; // RANDOMIZE is a no-op in this interpreter
      default: return this.evaluateExpression(node);
    }
  }

  private async executeProgram(node: any): Promise<void> {
    const stmts: any[] = node.statements;
    for (const s of stmts) { if (s.type === 'ProcedureDeclaration' || s.type === 'FunctionDeclaration') this.executeNode(s); }
    for (const s of stmts) {
      if (s.type === 'ProcedureDeclaration' || s.type === 'FunctionDeclaration') continue;
      const result = await this.executeNode(s);
      if (result instanceof ReturnSignal) throw result;
    }
  }

  private executeVariableDeclaration(node: any): void {
    const defaults: Record<string, unknown> = { INTEGER: 0, REAL: 0.0, CHAR: '', STRING: '', BOOLEAN: false };
    const name = node.name as string;
    const dataTypeToken = node.dataType as string;
    const value = defaults[dataTypeToken] ?? null;
    this.variables.set(name, value);
    this.variableTypes.set(name, dataTypeToken);
    this.recordTrace(node.line || 0);
  }
  
  private executeArrayDeclaration(node: any): void {
    const name = node.name as string;
    const dims = node.dimensions as { lower: number; upper: number }[];
    const dataType = node.dataType as string;
    
    let totalSize = 1;
    for (const dim of dims) {
      totalSize *= (dim.upper - dim.lower + 1);
    }
    
    const defaults: Record<string, unknown> = { INTEGER: 0, REAL: 0.0, CHAR: '', STRING: '', BOOLEAN: false };
    const defaultVal = defaults[dataType] ?? null;
    const data = new Array(totalSize).fill(defaultVal);
    
    this.arrays.set(name, { dims, data });
    this.variableTypes.set(name, `ARRAY_OF_${dataType}`);
  }
  
  private async executeConstantDeclaration(node: any): Promise<void> {
    const name = node.name as string;
    const value = await this.evaluateExpression(node.value);
    this.constants.set(name, value);
    this.recordTrace(node.line || 0);
  }
  
  private async executeAssignment(node: any): Promise<void> {
    const target = node.target as any;
    const value = await this.evaluateExpression(node.value);
    
    if (target.type === 'Identifier') {
      if (!this.variableTypes.has(target.name) && !this.constants.has(target.name)) {
        throw this.runtimeError(`Undefined variable '${target.name}'`);
      }
      if (this.constants.has(target.name)) {
        throw this.runtimeError(`Cannot reassign constant '${target.name}'`);
      }
      this.checkTypeCompatibility(value, target.name);
      this.variables.set(target.name, value);
    } else if (target.type === 'ArrayAccess') {
      const arrInfo = this.arrays.get(target.name);
      if (arrInfo) {
        const indices = [];
        for (const idx of target.indices as any[]) {
          indices.push(await this.evaluateExpression(idx) as number);
        }
        const flatIndex = this.getFlatIndex(arrInfo.dims, indices);
        this.checkArrayElementType(value, target.name);
        arrInfo.data[flatIndex] = value;
      }
    }
    this.recordTrace(node.line || 0);
  }
  
  private checkTypeCompatibility(value: unknown, varName: string): void {
    const varType = this.variableTypes.get(varName);
    if (!varType) return;
    const valueType = this.inferType(value);
    if (!this.isTypeCompatible(varType, valueType, value, varName, false)) {
      throw this.runtimeError(`Type mismatch: cannot assign ${valueType} value to ${varType} variable '${varName}'`);
    }
  }
  
  private checkArrayElementType(value: unknown, arrayName: string): void {
    const varType = this.variableTypes.get(arrayName);
    if (!varType?.startsWith('ARRAY_OF_')) return;
    const elementType = varType.slice(9);
    const valueType = this.inferType(value);
    if (!this.isTypeCompatible(elementType, valueType, value, arrayName, true)) {
      throw this.runtimeError(`Type mismatch: cannot assign ${valueType} value to ${elementType} array '${arrayName}'`);
    }
  }

  private inferType(value: unknown): string {
    if (typeof value === 'number') return Number.isInteger(value) ? 'INTEGER' : 'REAL';
    if (typeof value === 'string') return value.length === 1 ? 'CHAR' : 'STRING';
    if (typeof value === 'boolean') return 'BOOLEAN';
    return 'UNKNOWN';
  }

  private isTypeCompatible(targetType: string, valueType: string, value: unknown, name: string, isArray: boolean): boolean {
    if (targetType === valueType) return true;
    if (targetType === 'REAL' && valueType === 'INTEGER') return true;
    return false;
  }

  private getFlatIndex(dims: { lower: number; upper: number }[], indices: number[]): number {
    // 边界检查：每个维度的索引必须在 [lower, upper] 范围内
    for (let i = 0; i < dims.length; i++) {
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
    const varName = node.variable as string;
    const varType = this.variableTypes.get(varName);
    
    if (this.inputCallback) {
      const rawValue = await this.inputCallback(varName);
      const str = String(rawValue).trim();
      
      if (varType === 'INTEGER') {
        const parsed = parseInt(str, 10);
        if (isNaN(parsed) || str !== String(parsed)) {
          this.runtimeError(`Type error: cannot convert "${str}" to INTEGER for variable ${varName}`);
        }
        this.variables.set(varName, parsed);
      } else if (varType === 'REAL') {
        const parsed = parseFloat(str);
        if (isNaN(parsed)) {
          this.runtimeError(`Type error: cannot convert "${str}" to REAL for variable ${varName}`);
        }
        this.variables.set(varName, parsed);
      } else if (varType === 'BOOLEAN') {
        const upper = str.toUpperCase();
        if (upper !== 'TRUE' && upper !== 'FALSE') {
          this.runtimeError(`Type error: cannot convert "${str}" to BOOLEAN for variable ${varName} (expected TRUE or FALSE)`);
        }
        this.variables.set(varName, upper === 'TRUE');
      } else if (varType === 'CHAR') {
        if (str.length !== 1) {
          this.runtimeError(`Type error: cannot convert "${str}" to CHAR for variable ${varName} (expected single character)`);
        }
        this.variables.set(varName, str);
      } else {
        this.variables.set(varName, str);
      }
    } else {
      const defaults: Record<string, unknown> = { INTEGER: 0, REAL: 0.0, CHAR: '', STRING: '', BOOLEAN: false };
      this.variables.set(varName, defaults[varType || 'STRING'] ?? '');
    }
    this.recordTrace(node.line || 0);
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
      if (name === 'ROUND' || name === 'RANDOM' || name === 'RND') return true;
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
    return new ReturnSignal(value);
  }

  private async executeIf(node: any): Promise<void> {
    const cond = await this.evaluateExpression(node.condition);
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
    for (const c of node.cases as { value: string; statements: any[] }[]) {
      const caseVal = c.value.replace(/^['"]|['"]$/g, '');
      if (String(value) === caseVal || String(value) === c.value) { 
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
    const start = await this.evaluateExpression(node.start) as number;
    const end = await this.evaluateExpression(node.end) as number;
    const step = node.step ? await this.evaluateExpression(node.step) as number : 1;
    this.variables.set(node.variable as string, start);
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
    do {
      if (this.aborted) throw new Error('Execution aborted by user');
      if (++this.currentIteration > this.maxIterations) this.runtimeError('Maximum iterations exceeded');
      for (const s of node.body as any[]) { const r = await this.executeNode(s); if (r instanceof ReturnSignal) throw r; }
    } while (!(await this.evaluateExpression(node.condition)));
  }

  private async executeWhile(node: any): Promise<void> {
    while (await this.evaluateExpression(node.condition)) {
      if (this.aborted) throw new Error('Execution aborted by user');
      if (++this.currentIteration > this.maxIterations) this.runtimeError('Maximum iterations exceeded');
      for (const s of node.body as any[]) { const r = await this.executeNode(s); if (r instanceof ReturnSignal) throw r; }
    }
  }

  private executeProcedureDeclaration(node: any): void { this.procedures.set(node.name as string, node); }
  private executeFunctionDeclaration(node: any): void { this.functions.set(node.name as string, node); }

  private async executeProcedureCall(node: any): Promise<unknown> {
    const proc = this.procedures.get(node.name as string);
    if (proc) {
      // Save only the variables that will be overwritten by parameters
      const savedVars = new Map<string, unknown>();
      const savedTypes = new Map<string, string>();
      const args = node.args as any[];
      const byRefArgs: { paramName: string; argName: string }[] = [];
      
      for (let i = 0; i < proc.params.length; i++) {
        const param = proc.params[i];
        const arg = args[i];
        if (param.byRef && arg && arg.type === 'Identifier') {
          byRefArgs.push({ paramName: param.name, argName: arg.name });
        }
        // Save existing value for this param name before overwriting
        if (this.variables.has(param.name)) savedVars.set(param.name, this.variables.get(param.name));
        if (this.variableTypes.has(param.name)) savedTypes.set(param.name, this.variableTypes.get(param.name)!);
        this.variables.set(param.name, i < args.length ? await this.evaluateExpression(arg) : null);
        this.variableTypes.set(param.name, param.type);
      }
      
      try { for (const s of proc.body as any[]) await this.executeNode(s); }
      catch (e) { if (!(e instanceof ReturnSignal)) throw e; }
      
      // Write back BYREF parameters
      for (const { paramName, argName } of byRefArgs) {
        const value = this.variables.get(paramName);
        this.variables.set(argName, value);
      }
      
      // Restore only the saved parameter variables (remove params, restore originals)
      for (const param of proc.params) {
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
      
      return null;
    }
    throw new Error(`Undefined procedure '${node.name}' at line ${node.line}`);
  }

  private async executeFunctionCall(node: any): Promise<unknown> {
    const nameUpper = (node.name as string).toUpperCase();
    switch (nameUpper) {
      case 'LENGTH': return String(await this.evaluateExpression(node.args[0])).length;
      case 'LCASE': return String(await this.evaluateExpression(node.args[0])).toLowerCase();
      case 'UCASE': return String(await this.evaluateExpression(node.args[0])).toUpperCase();
      case 'SUBSTRING': {
        // Cambridge IGCSE: SUBSTRING(String, StartPosition, Length)
        const s = String(await this.evaluateExpression(node.args[0]));
        const start = await this.evaluateExpression(node.args[1]) as number;
        const len = await this.evaluateExpression(node.args[2]) as number;
        if (start < 1 || start > s.length || len < 0) return '';
        const actualStart = start - 1;
        const actualEnd = Math.min(actualStart + len, s.length);
        return s.substring(actualStart, actualEnd);
      }
      case 'ROUND': {
        const v = await this.evaluateExpression(node.args[0]) as number;
        const p = await this.evaluateExpression(node.args[1]) as number;
        const f = Math.pow(10, p); return Math.round(v * f) / f;
      }
      case 'RANDOM': return Math.random();
      case 'EOF': return this.isFileEOF(String(await this.evaluateExpression(node.args[0])));
      case 'INT': return Math.trunc(await this.evaluateExpression(node.args[0]) as number);
      case 'RND': return Math.random();
      case 'NUM_TO_STRING': return String(await this.evaluateExpression(node.args[0]));
      case 'STRING_TO_NUM': {
        const str = String(await this.evaluateExpression(node.args[0]));
        const num = Number(str);
        if (isNaN(num)) this.runtimeError(`Cannot convert "${str}" to number`);
        return num;
      }
      case 'DIV': {
        const divisor = await this.evaluateExpression(node.args[1]) as number;
        if (divisor === 0) this.runtimeError('Division by zero');
        return Math.floor((await this.evaluateExpression(node.args[0]) as number) / divisor);
      }
      case 'MOD': {
        const modDivisor = await this.evaluateExpression(node.args[1]) as number;
        if (modDivisor === 0) this.runtimeError('Division by zero');
        return (await this.evaluateExpression(node.args[0]) as number) % modDivisor;
      }
    }
    const func = this.functions.get(node.name as string);
    if (func) {
      this.callDepth++;
      if (this.callDepth > this.maxCallDepth) {
        this.callDepth--;
        this.runtimeError('Maximum call depth exceeded (possible infinite recursion)');
      }
      // Save only the variables that will be overwritten by parameters
      const savedVars = new Map<string, unknown>();
      const savedTypes = new Map<string, string>();
      const args = node.args as any[];
      for (let i = 0; i < func.params.length; i++) {
        if (this.variables.has(func.params[i].name)) savedVars.set(func.params[i].name, this.variables.get(func.params[i].name));
        if (this.variableTypes.has(func.params[i].name)) savedTypes.set(func.params[i].name, this.variableTypes.get(func.params[i].name)!);
        this.variables.set(func.params[i].name, i < args.length ? await this.evaluateExpression(args[i]) : null);
        this.variableTypes.set(func.params[i].name, func.params[i].type);
      }
      let result: unknown = null;
      let hasReturned = false;
      try {
        for (const s of func.body as any[]) { 
          const stmtResult = await this.executeNode(s);
          if (stmtResult instanceof ReturnSignal) {
            result = stmtResult.value;
            hasReturned = true;
            break;
          }
        }
      } catch (e) {
        if (e instanceof ReturnSignal) { result = e.value; hasReturned = true; }
        else { this.callDepth--; throw e; }
      }
      // Restore only the saved parameter variables
      for (const param of func.params) {
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
      this.callDepth--;
      
      if (hasReturned) return result;
      // Function completed without RETURN statement
      this.runtimeError(`Function '${node.name}' did not return a value`);
    }
    const proc = this.procedures.get(node.name as string);
    if (proc) return this.executeProcedureCall(node);
    this.runtimeError(`Undefined function '${node.name}'`);
  }

  private executeFileOpenRead(node: any): void {
    const fn = this.resolveFilename(node.filename as string);
    if (this.openFiles.has(fn)) this.runtimeError(`File '${fn}' is already open`);
    if (!this.fileContents.has(fn)) this.fileContents.set(fn, []);
    this.openFiles.set(fn, 'read'); this.filePositions.set(fn, 0);
  }
  private executeFileOpenWrite(node: any): void {
    const fn = this.resolveFilename(node.filename as string);
    if (this.openFiles.has(fn)) this.runtimeError(`File '${fn}' is already open`);
    this.fileContents.set(fn, []); this.openFiles.set(fn, 'write'); this.filePositions.set(fn, 0);
  }
  private async executeFileRead(node: any): Promise<void> {
    const fn = this.resolveFilename(node.filename as string);
    if (this.openFiles.get(fn) !== 'read') this.runtimeError(`File '${fn}' is not open for reading`);
    const lines = this.fileContents.get(fn); const pos = this.filePositions.get(fn) ?? 0;
    if (!lines || pos >= lines.length) this.runtimeError(`End of file '${fn}' reached`);
    this.variables.set(node.variable as string, lines[pos]); this.filePositions.set(fn, pos + 1);
  }
  private async executeFileWrite(node: any): Promise<void> {
    const fn = this.resolveFilename(node.filename as string);
    if (this.openFiles.get(fn) !== 'write') this.runtimeError(`File '${fn}' is not open for writing`);
    const value = await this.evaluateExpression(node.value);
    const lines = this.fileContents.get(fn);
    if (lines) lines.push(String(value ?? ''));
  }
  private executeFileClose(node: any): void {
    const fn = this.resolveFilename(node.filename as string);
    if (!this.openFiles.has(fn)) this.runtimeError(`File '${fn}' is not open`);
    this.openFiles.delete(fn); this.filePositions.delete(fn);
  }
  private isFileEOF(fn: string): boolean {
    fn = this.resolveFilename(fn);
    const lines = this.fileContents.get(fn); const pos = this.filePositions.get(fn) ?? 0;
    return !lines || pos >= lines.length;
  }

  private resolveFilename(filename: string): string {
    const varValue = this.variables.get(filename);
    if (varValue !== undefined) return String(varValue);
    return filename;
  }

  private async evaluateExpression(node: any): Promise<unknown> {
    if (!node || node.type === 'Empty') return null;
    switch (node.type) {
      case 'Identifier': {
        if (this.variables.has(node.name)) return this.variables.get(node.name);
        if (this.constants.has(node.name)) return this.constants.get(node.name);
        throw this.runtimeError(`Undefined variable '${node.name}'`);
      }
      case 'NumberLiteral': return node.value;
      case 'RealLiteral': return node.value;
      case 'StringLiteral': return node.value;
      case 'CharLiteral': return node.value;
      case 'BooleanLiteral': return node.value;
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
      case 'FunctionCall': return this.executeFunctionCall(node);
      case 'ProcedureCall': return this.executeProcedureCall(node);
      case 'BinaryExpression': return this.evalBinary(node);
      case 'UnaryExpression': return this.evalUnary(node);
    }
    return null;
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
export class PseudocodeParser {
  private lexer = new Lexer('');
  private parser = new Parser([]);
  private interpreter = new Interpreter();

  public abort(): void { this.interpreter.abort(); }

  public parse(source: string): ASTNode {
    this.lexer = new Lexer(source);
    const tokens = this.lexer.tokenize();
    this.parser = new Parser(tokens);
    return this.parser.parse();
  }

  public async run(source: string, inputCallback?: (prompt?: string) => Promise<unknown>, onOutput?: (text: string) => void): Promise<string[]> {
    this.interpreter.reset();
    const ast = this.parse(source);
    if (inputCallback) this.interpreter.setInputCallback(inputCallback);
    if (onOutput) this.interpreter.setOnOutput(onOutput);
    return this.interpreter.execute(ast);
  }

  public checkSyntax(source: string): Array<{ line: number; message: string }> {
    this.lexer = new Lexer(source);
    const tokens = this.lexer.tokenize();
    this.parser = new Parser(tokens);
    return this.parser.checkSyntax();
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
}
