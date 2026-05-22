# 项目上下文

### 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4
- **代码编辑器**: Monaco Editor (@monaco-editor/react)

## 目录结构

```
├── public/                 # 静态资源
├── scripts/                # 构建与启动脚本
│   ├── build.sh            # 构建脚本
│   ├── dev.sh              # 开发环境启动脚本
│   ├── prepare.sh          # 预处理脚本
│   └── start.sh            # 生产环境启动脚本
├── src/
│   ├── app/                # 页面路由与布局
│   │   ├── page.tsx        # 主页面 (Monaco Editor + 输出面板)
│   │   ├── layout.tsx      # 根布局
│   │   ├── globals.css     # 全局样式
│   │   └── api/
│   │       └── fetch-url/  # URL 内容获取 API
│   │           └── route.ts
│   ├── components/ui/      # Shadcn UI 组件库
│   ├── hooks/              # 自定义 Hooks
│   ├── lib/                # 工具库
│   │   ├── utils.ts        # 通用工具函数 (cn)
│   │   └── pseudocode/
│   │       └── parser.ts   # 伪代码解析器 (Lexer + Parser + Interpreter)
│   └── server.ts           # 自定义服务端入口
├── next.config.ts          # Next.js 配置
├── package.json            # 项目依赖管理
└── tsconfig.json           # TypeScript 配置
```

- 项目文件（如 app 目录、pages 目录、components 等）默认初始化到 `src/` 目录下。

## 包管理规范

**仅允许使用 pnpm** 作为包管理器，**严禁使用 npm 或 yarn**。
**常用命令**：
- 安装依赖：`pnpm add <package>`
- 安装开发依赖：`pnpm add -D <package>`
- 安装所有依赖：`pnpm install`
- 移除依赖：`pnpm remove <package>`

## 开发规范

### Hydration 问题防范

1. 严禁在 JSX 渲染逻辑中直接使用 typeof window、Date.now()、Math.random() 等动态数据。**必须使用 'use client' 并配合 useEffect + useState 确保动态内容仅在客户端挂载后渲染**；同时严禁非法 HTML 嵌套（如 <p> 嵌套 <div>）。
2. **禁止使用 head 标签**，优先使用 metadata，详见文档：https://nextjs.org/docs/app/api-reference/functions/generate-metadata
   1. 三方 CSS、字体等可在 `globals.css` 中顶部通过 `@import` 引入或使用 next/font
   2. preload, preconnect, dns-prefetch 通过 ReactDOM 的 preload、preconnect、dns-prefetch 方法引入
   3. json-ld 可阅读 https://nextjs.org/docs/app/guides/json-ld

## UI 设计与组件规范 (UI & Styling Standards)

- 模板默认预装核心组件库 `shadcn/ui`，位于`src/components/ui/`目录下
- Next.js 项目**必须默认**采用 shadcn/ui 组件、风格和规范，**除非用户指定用其他的组件和规范。**

## 伪代码解析器 (Pseudocode Parser)

本项目包含两个伪代码解析器，支持 Cambridge IGCSE 0478 和 A-Level 9618 规范。

### 核心文件
- `src/lib/pseudocode/parser.ts` - IGCSE 0478 解析器核心实现（Lexer + Parser + Interpreter + PseudocodeParser）
- `src/lib/pseudocode/alevel-parser.ts` - A-Level 9618 解析器（基于 IGCSE 版本修改）

### 架构
- **Lexer**: 词法分析，将源码转为 Token 流
- **Parser**: 语法分析，将 Token 流转为 AST
- **Interpreter**: 解释执行 AST，支持 ReturnSignal 控制流
- **PseudocodeParser**: 主入口类，串联三者

### 支持的语法 (严格遵循 IGCSE 0478 规范)
- 数据类型: INTEGER, REAL, CHAR, STRING, BOOLEAN
- 变量声明: DECLARE name : TYPE
- 常量声明: CONSTANT name ← value (仅支持字面量)
- 赋值: variable ← expression
- 数组声明: DECLARE arr : ARRAY[1:10] OF TYPE / ARRAY[1:3, 1:3] OF CHAR
- 输入/输出: INPUT, OUTPUT (多值逗号分隔，连接输出)
- 条件语句: IF...THEN...ELSE...ENDIF, CASE OF...ENDCASE
- 循环语句: FOR...TO...STEP...NEXT, WHILE...DO...ENDWHILE, REPEAT...UNTIL
- 函数/过程: FUNCTION...RETURNS...ENDFUNCTION, PROCEDURE...ENDPROCEDURE (均支持无参数形式)
- 过程调用: CALL ProcedureName(args) 或直接 ProcedureName(args)
- 返回语句: RETURN value
- 内置函数: LENGTH(), LCASE(), UCASE(), SUBSTRING(string, start, len), ROUND(), RANDOM(), DIV(), MOD(), EOF(), INT(), RND(), RANDOMIZE, NUM_TO_STRING(), STRING_TO_NUM()
- 文件操作: OPENFILE filename FOR READ/WRITE, READFILE, WRITEFILE, CLOSEFILE
- 算术运算: +, -, *, /, ^ (幂运算)
- 关系运算: =, <, <=, >, >=, <>
- 逻辑运算: AND, OR, NOT
- 注释: // 单行注释

### A-Level 9618 规范差异
- 常量声明: CONSTANT name = value (使用 = 而非 ←)
- WHILE 循环: WHILE condition ... ENDWHILE (无 DO 关键字)
- 过程调用: CALL ProcedureName(args) (CALL 关键字必须)
- CASE 范围: 支持 value1 TO value2 : ... 语法
- 内置函数: MID(string, start, len), LEFT(string, len), RIGHT(string, len), RAND(x), INT() (替代 IGCSE 的 SUBSTRING/RANDOM), NUM_TO_STRING(), STRING_TO_NUM()
- 类型检查: REAL 赋值给 INTEGER 报 Type mismatch 错误; 函数无 RETURN 也报运行时错误
- 使用示例: `import { ALevelParser } from '@/lib/pseudocode/alevel-parser'`

### 使用示例
```typescript
import { PseudocodeParser } from '@/lib/pseudocode/parser';

const parser = new PseudocodeParser();

// 解析代码
const ast = parser.parse(sourceCode);

// 运行代码
const output = await parser.run(sourceCode, inputCallback);

// 获取 Token 列表
const tokens = parser.getTokens(sourceCode);

// 设置虚拟文件内容（用于文件操作）
parser.setFileContent('data.txt', ['line1', 'line2']);
```

### 关键设计决策
- 严格遵循 Cambridge IGCSE Computer Science 0478 (2026-2028) 伪代码规范
- 函数返回通过 ReturnSignal 异常模式实现提前返回
- 表达式解析通过 isExprStart() 保护语句边界，防止表达式过度消费 token
- WRITEFILE 接受表达式而非仅标识符
- 虚拟文件系统模拟文件读写操作
- Interpreter 和 PseudocodeParser 类暴露 getAllFiles() 方法获取所有虚拟文件
- Interpreter 全异步架构，支持交互式 INPUT（暂停执行等待用户输入）
- Trace Table: 执行过程中记录变量变化、输出和行号，支持 getTraceTable() 获取
- 2D 数组可视化: 运行后自动展示 2D 数组网格图
- 数组数据转换: `convertArraysData()` 将 parser 的 `{dims, data}` 格式转为渲染所需的 `{bounds, is2D, elementType, data}` 格式
- CASE 语法: CASE OF identifier（符合 IGCSE 规范）
- 文件操作: OPENFILE filename FOR READ/WRITE（符合 IGCSE 规范）
- 过程调用: CALL ProcedureName(args)（符合 IGCSE 规范）
- DIV/MOD: 函数式语法 DIV(a, b) / MOD(a, b)（符合 IGCSE 规范）
- 内置函数名与标识符冲突处理: 仅当后跟 '(' 时识别为函数关键字，否则为标识符
- REAL 类型输出: 始终显示小数点 (如 314.0)
- 2D 数组: 支持 ARRAY[1:3, 1:3] OF CHAR 及索引访问

## 编辑器集成 (Monaco Editor)

### 自定义语言
- 注册了 `pseudocode` 语言到 Monaco Editor
- Monarch tokenizer 提供语法高亮（包含 IGCSE 和 A-Level 的所有关键字/内置函数）
- 自定义暗色主题 `pseudocode-dark`（基于 vs-dark）
- 自动补全：关键字、数据类型、内置函数、代码片段、**已声明的变量/函数/过程** — **根据 syllabus 动态过滤**
- **Hover 类型提示**：鼠标悬停在关键字、数据类型、内置函数、已声明标识符上时显示详细说明 — **根据 syllabus 动态调整**
- **Auto-indent**：IF/FOR/WHILE/REPEAT/PROCEDURE/FUNCTION 后自动缩进
- **Friendly Error Messages**：解析/运行错误转换为友好中文提示

### 代码片段
- IF-THEN-ENDIF / IF-THEN-ELSE-ENDIF
- FOR-TO-NEXT / WHILE-ENDWHILE(IGCSE 含 DO，A-Level 无 DO) / REPEAT-UNTIL
- FUNCTION / PROCEDURE / DECLARE / DECLARE ARRAY

### Hover 提示功能
为以下元素提供了详细的 hover 说明：
- **关键字**：DECLARE, CONSTANT, INPUT, OUTPUT, IF, ELSE, CASE, FOR, WHILE, REPEAT, PROCEDURE, FUNCTION, RETURN, ARRAY, 文件操作等
- **数据类型**：INTEGER, REAL, CHAR, STRING, BOOLEAN
- **内置函数（IGCSE）**：LENGTH, LCASE, UCASE, SUBSTRING, ROUND, RANDOM, DIV, MOD, EOF
- **内置函数（A-Level）**：LENGTH, LCASE, UCASE, MID, RIGHT, ROUND, RAND, INT, DIV, MOD, EOF
- 每个提示包含语法说明、用法示例和参数信息

### Syllabus 切换
- `syllabus` state 控制当前规范（`'igcse-0478'` | `'alevel-9618'`）
- 切换 syllabus 时自动重新注册 Monaco 补全/Hover provider（通过 `useEffect` + `providersRef`）
- Reference 标签页内容根据 syllabus 动态显示对应规范的参考信息

## 虚拟文件管理 (Virtual File Management)

### 功能说明
- **Files 标签页**：在右侧面板添加了 Files 标签页，用于管理和预览虚拟文件
- **文件列表**：显示所有当前打开的虚拟文件及其状态（READ/WRITE）
- **文件预览**：点击文件名可以预览文件内容
- **文件删除**：支持删除单个虚拟文件
- **清空文件**：支持一键清空所有虚拟文件
- **Reset 功能**：File 菜单中的 Reset 功能现在会清空编辑器和所有虚拟文件

### 核心实现
- 状态管理：`virtualFiles`（存储所有虚拟文件）、`selectedFile`（当前选中的文件）
- 文件操作：
  - `deleteVirtualFile(filename)`：删除单个文件
  - `clearAllVirtualFiles()`：清空所有文件
  - `resetCode()`：清空编辑器和所有虚拟文件
- 自动更新：在 `runCode` 执行后自动更新虚拟文件状态

## Coze 平台集成

### 工作区与项目结构

- **工作区根目录**：`/workspace/projects`
- **技术项目根目录**：`/workspace/projects/projects`（子目录）
- **根 `.coze`**：`/workspace/projects/.coze`
- **子项目 `.coze`**：`/workspace/projects/projects/.coze`

### 预览链路

- **preview_enable**：已启用
- **dev.build**：`bash projects/scripts/prepare.sh`（安装依赖）
- **dev.run**：`bash projects/scripts/dev.sh`（启动 Next.js 开发服务器，端口 5000）
- **启动方式**：`pnpm next dev`（标准 Next.js 开发服务器，不使用 custom server，Turbopack 兼容）
- **端口配置**：预览服务监听 `0.0.0.0:5000`

### 部署链路

- **deploy.profile.kind**：`service`
- **deploy.profile.flavor**：`web`
- **deploy.build**：`bash projects/scripts/build.sh`（pnpm install + next build + tsup 打包）
- **deploy.run**：`bash projects/scripts/start.sh`（启动打包后的服务，端口 5000）

### 运行时

- **project.requires**：`nodejs-24`
- **project_type**：`web`

### 脚本目录规范

所有脚本（`scripts/*.sh`）内部通过 `COZE_WORKSPACE_PATH/projects` 进入项目目录，确保构建和运行命令在正确位置执行。
