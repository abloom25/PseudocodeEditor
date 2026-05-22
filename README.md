# Pseudocode Editor

A browser-based pseudocode editor, runner, and debugging workspace for Cambridge IGCSE Computer Science 0478 and A Level Computer Science 9618.

Live site: https://pseudocode.site/

Pseudocode Editor helps students write Cambridge-style pseudocode with syntax highlighting, autocomplete, syllabus-aware references, execution output, trace tables, virtual file simulation, and array visualization in one place.

## Features

- Monaco Editor-based pseudocode editor
- Syntax highlighting for Cambridge-style pseudocode
- IGCSE 0478 and A Level 9618 syllabus modes
- Syllabus-aware autocomplete, hover documentation, and snippets
- Built-in pseudocode parser and interpreter
- Interactive `INPUT` support during execution
- Output panel with friendly error messages
- Trace table generation for variable changes and program flow
- Virtual file system for `OPENFILE`, `READFILE`, `WRITEFILE`, and `CLOSEFILE`
- 2D array visualization after execution
- Theme system with Nightlight as the default theme
- Static export support for GitHub Pages deployment

## Tech Stack

- Framework: Next.js 16 App Router
- UI: React 19, shadcn/ui, Radix UI
- Language: TypeScript 5
- Styling: Tailwind CSS 4
- Editor: Monaco Editor via `@monaco-editor/react`
- Spreadsheet export: `xlsx`
- Package manager: pnpm only

## Quick Start

This project uses pnpm only. Do not use npm or yarn.

```bash
pnpm install
```

Start the development server:

```bash
pnpm dev
```

Open the local development URL shown in the terminal.

Build the static site:

```bash
pnpm build
```

Run linting:

```bash
pnpm lint
```

Run TypeScript checking:

```bash
pnpm ts-check
```

## Project Structure

```text
public/
├── CNAME                         # Custom domain for GitHub Pages
└── pseudocode-editor-icon.png    # Social preview icon

src/
├── app/
│   ├── page.tsx                  # Main editor page
│   ├── layout.tsx                # Root layout and metadata
│   ├── globals.css               # Global styles and theme variables
│   ├── icon.png                  # App icon / favicon source
│   └── api/fetch-url/route.ts    # URL fetching API route
├── components/ui/                # shadcn/ui components
├── features/pseudocode-ide/
│   ├── components/               # Editor panels and IDE UI components
│   ├── config/                   # Themes, completions, references, hover docs
│   ├── monaco/                   # Monaco language, providers, and themes
│   ├── utils/                    # IDE utility functions
│   └── types.ts                  # IDE shared types
├── hooks/                        # Custom React hooks
├── lib/
│   ├── utils.ts                  # Shared utility helpers
│   └── pseudocode/
│       ├── parser.ts             # IGCSE 0478 parser/interpreter
│       └── alevel-parser.ts      # A Level 9618 parser/interpreter
└── server.ts                     # Custom server entry for non-static runtime use
```

## Pseudocode Support

The project includes two parser/interpreter implementations.

### IGCSE 0478

The IGCSE parser is implemented in `src/lib/pseudocode/parser.ts`.

Supported areas include:

- Data types: `INTEGER`, `REAL`, `CHAR`, `STRING`, `BOOLEAN`
- Variable declarations with `DECLARE`
- Constants with `CONSTANT name ← value`
- Assignment with `←`
- 1D and 2D arrays
- `INPUT` and `OUTPUT`
- `IF ... THEN ... ELSE ... ENDIF`
- `CASE OF ... ENDCASE`
- `FOR ... TO ... STEP ... NEXT`
- `WHILE ... DO ... ENDWHILE`
- `REPEAT ... UNTIL`
- `FUNCTION`, `PROCEDURE`, `RETURN`, and `CALL`
- File operations: `OPENFILE`, `READFILE`, `WRITEFILE`, `CLOSEFILE`
- Built-in functions such as `LENGTH`, `LCASE`, `UCASE`, `SUBSTRING`, `ROUND`, `RANDOM`, `DIV`, `MOD`, `EOF`, `INT`, `RND`, `NUM_TO_STRING`, and `STRING_TO_NUM`

### A Level 9618

The A Level parser is implemented in `src/lib/pseudocode/alevel-parser.ts`.

Differences include:

- Constants use `CONSTANT name = value`
- `WHILE` loops do not require `DO`
- Procedure calls require `CALL`
- `CASE` supports range syntax such as `value1 TO value2`
- A Level built-ins include `MID`, `LEFT`, `RIGHT`, `RAND`, `INT`, `NUM_TO_STRING`, and `STRING_TO_NUM`
- Additional runtime checks, such as reporting missing function returns

## Editor Experience

The editor registers a custom `pseudocode` language in Monaco Editor. The active syllabus controls the available completions, snippets, hover documentation, and reference content.

Main editor capabilities:

- Keyword and built-in function highlighting
- Code snippets for common pseudocode structures
- Autocomplete for declared variables, functions, and procedures
- Hover documentation for keywords, types, and built-in functions
- Automatic indentation for block structures
- Friendly error messages designed for learners
- Reference panel that changes with the selected syllabus

## Virtual Files

The interpreter includes a virtual file system so file operations can be tested in the browser without touching the user's local disk.

Supported workflow:

1. Open a virtual file with `OPENFILE`.
2. Read or write content with `READFILE` and `WRITEFILE`.
3. Close the file with `CLOSEFILE`.
4. Inspect generated file contents in the Files panel.

Files can also be manually added, previewed, deleted, or cleared from the UI.

## Trace Tables and Arrays

After running code, the editor can display execution data that helps with debugging and classroom-style tracing.

- Trace tables record variable changes, output events, and source line information.
- Final variable values are shown after execution.
- 2D arrays can be converted into a grid visualization for easier inspection.

## Reporting Bugs

If you find a bug, please open a GitHub Issue in this repository.

Before opening the issue:

1. Click the bug report option in the website.
2. Describe what went wrong.
3. Copy the generated debug information.
4. Paste the full debug information into the GitHub Issue.

Including the generated debug information is important because it contains the current code, selected syllabus, output, error details, and relevant runtime context needed to reproduce the issue.

## Deployment

The project is configured for static export and GitHub Pages deployment.

- Static export is enabled in `next.config.ts` with `output: 'export'`.
- GitHub Pages deployment is handled by `.github/workflows/deploy-gh-pages.yml`.
- The custom domain is configured through `public/CNAME`.
- The production domain is https://pseudocode.site/.

A push to the `main` branch triggers the GitHub Actions workflow and deploys the generated `out` directory to GitHub Pages.

## Development Notes

- Use pnpm for all dependency operations.
- Prefer existing shadcn/ui components for new UI work.
- Follow the existing theme system for visual changes.
- Keep parser behavior aligned with Cambridge IGCSE 0478 and A Level 9618 expectations.
- Avoid dynamic values such as `Date.now()` or `Math.random()` directly in JSX render output.
- Do not commit secrets, API keys, tokens, or private configuration.

## Useful Scripts

```bash
pnpm dev
pnpm build
pnpm lint
pnpm ts-check
```

## License

AGPL-3
