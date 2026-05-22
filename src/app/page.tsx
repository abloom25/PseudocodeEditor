'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { SyntaxHighlighter } from '@/features/pseudocode-ide/components';
import { getThemeStyles, resolveThemeName } from '@/features/pseudocode-ide/config/theme-styles';
import { convertArraysData, type ArrayData } from '@/features/pseudocode-ide/utils';
import { friendlyErrorMessage } from '@/features/pseudocode-ide/utils';
import { registerPseudocodeLanguage, registerPseudocodeProviders, registerPseudocodeThemes } from '@/features/pseudocode-ide/monaco';
import type { DesktopLayout, Syllabus } from '@/features/pseudocode-ide/types';
import { type ThemeName } from '@/features/pseudocode-ide/config/theme-styles';
import { useTheme } from 'next-themes';

import Editor, { type OnMount } from '@monaco-editor/react';
/* eslint-disable */
import type { editor as MonacoEditor, languages as MonacoLanguages } from 'monaco-editor';
type MonacoType = any;
/* eslint-enable */
import { PseudocodeParser, type TraceEntry } from '@/lib/pseudocode/parser';
import { ALevelParser } from '@/lib/pseudocode/alevel-parser';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Play, Terminal, Code, BookOpen, AlertCircle, CheckCircle, RotateCcw, FileCode, ChevronDown, Copy, Download, Upload, Check, Sun, Trash2, Table, Square, Plus, MessageCircleWarning } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';


export default function PseudocodePage() {
  const [code, setCode] = useState<string>('');
  const [output, setOutput] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [parseSuccess, setParseSuccess] = useState(false);
  const [astJson, setAstJson] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  const [leftWidth, setLeftWidth] = useState(55); // 百分比
  const [isResizing, setIsResizing] = useState(false);
  const [copied, setCopied] = useState(false);
  const { theme, setTheme } = useTheme(); // 使用 next-themes
  const [saved, setSaved] = useState(false); // 保存状态
  // 文件预览相关状态
  const [virtualFiles, setVirtualFiles] = useState<Record<string, string[]>>({});
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  // 添加文件状态
  const [isAddingFile, setIsAddingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const newFileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [syllabus, setSyllabusState] = useState<Syllabus>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pseudocode-ide-syllabus');
      if (saved === 'igcse-0478' || saved === 'alevel-9618') return saved;
    }
    return 'igcse-0478';
  });
  const [showSyllabusDialog, setShowSyllabusDialog] = useState(false);
  const [showBugDialog, setShowBugDialog] = useState(false);
  const [bugDescription, setBugDescription] = useState('');
  const [bugCopied, setBugCopied] = useState(false);
  const setSyllabus = useCallback((value: 'igcse-0478' | 'alevel-9618') => {
    setSyllabusState(value);
    localStorage.setItem('pseudocode-ide-syllabus', value);
  }, []);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pseudocode-ide-syllabus');
      if (!saved) {
        setShowSyllabusDialog(true);
      }
    }
  }, []);
  useEffect(() => {
    if (isAddingFile) {
      setTimeout(() => newFileInputRef.current?.focus(), 0);
    }
  }, [isAddingFile]);
  // 交互式输入状态
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [inputPrompt, setInputPrompt] = useState('');
  const [inputValue, setInputValue] = useState('');
  const inputResolveRef = useRef<((value: string) => void) | null>(null);
  const outputEndRef = useRef<HTMLDivElement | null>(null);
  // Trace Table 状态
  const [traceTable, setTraceTable] = useState<TraceEntry[]>([]);
  const [arraysData, setArraysData] = useState<Record<string, ArrayData>>({});
  const [finalVariables, setFinalVariables] = useState<Record<string, unknown>>({});
  const [finalVariableTypes, setFinalVariableTypes] = useState<Record<string, string>>({});
  
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<MonacoType | null>(null);
  const parser = useRef<PseudocodeParser | ALevelParser>(new PseudocodeParser());
  
  // Switch parser when syllabus changes
  useEffect(() => {
    parser.current = syllabus === 'alevel-9618' ? new ALevelParser() : new PseudocodeParser();
  }, [syllabus]);
  const syntaxCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mobile responsive state
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState<'editor' | 'panel'>('editor');
  const [desktopLayout, setDesktopLayout] = useState<DesktopLayout>('side-by-side');

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Real-time syntax check: debounce 1.5s after code change
  useEffect(() => {
    if (!monacoRef.current || !editorRef.current) return;
    if (syntaxCheckTimer.current) clearTimeout(syntaxCheckTimer.current);
    syntaxCheckTimer.current = setTimeout(() => {
      const p = syllabus === 'alevel-9618' ? new ALevelParser() : new PseudocodeParser();
      const errors = p.checkSyntax(code);
      const model = editorRef.current?.getModel();
      if (model && monacoRef.current) {
        if (errors.length === 0) {
          monacoRef.current.editor.setModelMarkers(model, 'pseudocode', []);
        } else {
          const markers = errors.map(err => ({
            severity: monacoRef.current!.MarkerSeverity.Error,
            message: friendlyErrorMessage(err.message),
            startLineNumber: err.line,
            startColumn: 1,
            endLineNumber: err.line,
            endColumn: model.getLineMaxColumn(err.line),
          }));
          monacoRef.current.editor.setModelMarkers(model, 'pseudocode', markers);
        }
      }
    }, 1500);
    return () => {
      if (syntaxCheckTimer.current) clearTimeout(syntaxCheckTimer.current);
    };
  }, [code]);

  // Calculate trace table columns from trace data
  const traceColumns = useMemo(() => {
    if (traceTable.length === 0) return [];
    const varSet = new Set<string>();
    for (const entry of traceTable) {
      for (const key of Object.keys(entry.variables)) {
        varSet.add(key);
      }
    }
    return Array.from(varSet);
  }, [traceTable]);

  // 复制日志功能
  const handleCopyLogs = async () => {
    if (output.length === 0) return;
    const logText = output.join('\n');
    try {
      await navigator.clipboard.writeText(logText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy logs:', err);
    }
  };

  // 导出伪代码功能
  const handleExportCode = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pseudocode.pseudo';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 导入伪代码功能
  const handleImportCode = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setCode(content);
      }
    };
    reader.readAsText(file);
    
    // 清空 input 以便再次选择同一个文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 处理面板大小调整
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    const container = document.getElementById('main-container');
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    if (desktopLayout === 'stacked') {
      const newTopHeight = ((e.clientY - containerRect.top) / containerRect.height) * 100;
      setLeftWidth(Math.max(20, Math.min(80, newTopHeight)));
    } else {
      const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      setLeftWidth(Math.max(20, Math.min(80, newLeftWidth)));
    }
  }, [isResizing, desktopLayout]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
      return () => {
        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  useEffect(() => {
    setMounted(true);
    // Restore saved code from localStorage
    try {
      const saved = localStorage.getItem('pseudocode-editor-code');
      if (saved) setCode(saved);
    } catch {
      // localStorage not available
    }
  }, []);

  // 当主题变化时更新 Monaco 的主题
  const currentTheme = resolveThemeName(theme);

  useEffect(() => {
    if (mounted && monacoRef.current) {
      monacoRef.current.editor.setTheme(`pseudocode-${currentTheme}`);
    }
  }, [currentTheme, mounted]);

  // 根据 syllabus 动态注册/重新注册自动补全和 Hover 提示
  const providersRef = useRef<{ dispose: () => void } | null>(null);

  const generateBugReport = useCallback(() => {
    const code = editorRef.current?.getValue() || '';
    const syllabusLabel = syllabus === 'igcse-0478' ? 'Cambridge IGCSE 0478' : 'Cambridge A-Level 9618';
    const now = new Date().toISOString();
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A';

    // Collect AST
    let ast: unknown = null;
    try {
      ast = parser.current.parse(code);
    } catch {
      ast = null;
    }

    // Collect trace table
    let traceTable: unknown = null;
    try {
      const tt = parser.current.getTraceTable();
      if (tt && tt.length > 0) traceTable = tt;
    } catch {
      traceTable = null;
    }

    // Collect virtual files
    let files: Record<string, string> | null = null;
    try {
      const allFiles = parser.current.getAllFiles();
      if (allFiles && Object.keys(allFiles).length > 0) {
        files = Object.fromEntries(Object.entries(allFiles).map(([k, v]) => [k, (v as string[]).join('\n')]));
      }
    } catch {
      files = null;
    }

    const report: Record<string, unknown> = {
      type: 'pseudocode-ide-bug-report',
      version: 1,
      timestamp: now,
      environment: {
        syllabus: syllabusLabel,
        theme: currentTheme,
        layout: desktopLayout,
        browser: ua,
        url: typeof window !== 'undefined' ? window.location.href : 'N/A',
      },
      code: code || null,
      output: output && output.length > 0 ? output : null,
      error: error || null,
      ast,
      traceTable,
      files,
      description: bugDescription.trim() || null,
    };

    // Remove null fields for cleaner JSON
    for (const key of Object.keys(report)) {
      if (report[key] === null) delete report[key];
    }

    return JSON.stringify(report, null, 2);
  }, [syllabus, currentTheme, desktopLayout, output, error, bugDescription]);

  const copyBugReport = useCallback(async () => {
    const report = generateBugReport();
    try {
      await navigator.clipboard.writeText(report);
      setBugCopied(true);
      setTimeout(() => setBugCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = report;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setBugCopied(true);
      setTimeout(() => setBugCopied(false), 2000);
    }
  }, [generateBugReport]);

  const downloadBugReport = useCallback(() => {
    const report = generateBugReport();
    const blob = new Blob([report], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bug-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [generateBugReport]);

  const handleEditorMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    registerPseudocodeLanguage(monaco);
    registerPseudocodeThemes(monaco);
    // 注册自动补全和 Hover 提示
    if (providersRef.current) {
      providersRef.current.dispose();
    }
    providersRef.current = registerPseudocodeProviders(monaco, syllabus);
    monaco.editor.setTheme(`pseudocode-${currentTheme}`);
  }, [currentTheme, syllabus]);

  useEffect(() => {
    if (!monacoRef.current) return;
    // 先释放旧的 provider
    if (providersRef.current) {
      providersRef.current.dispose();
      providersRef.current = null;
    }
    providersRef.current = registerPseudocodeProviders(monacoRef.current, syllabus);
  }, [syllabus]);

  // 运行代码
  const clearEditorMarkers = useCallback(() => {
    if (monacoRef.current && editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        monacoRef.current.editor.setModelMarkers(model, 'pseudocode', []);
      }
    }
  }, []);

  const showEditorError = useCallback((message: string) => {
    if (!monacoRef.current || !editorRef.current) return;
    const model = editorRef.current.getModel();
    if (!model) return;
    const lineMatch = message.match(/at line (\d+)/);
    if (lineMatch) {
      const line = parseInt(lineMatch[1], 10);
      monacoRef.current.editor.setModelMarkers(model, 'pseudocode', [
        {
          severity: monacoRef.current.MarkerSeverity.Error,
          message: friendlyErrorMessage(message),
          startLineNumber: line,
          startColumn: 1,
          endLineNumber: line,
          endColumn: model.getLineMaxColumn(line),
        }
      ]);
      editorRef.current.revealLineInCenter(line);
    }
  }, []);

  const runCode = async () => {
    setIsRunning(true);
    setError(null);
    setOutput([]);
    setParseSuccess(false);
    clearEditorMarkers();
    setTraceTable([]);
    setArraysData({});
    setFinalVariables({});
    setFinalVariableTypes({});
    if (isMobile) setMobileView('panel');

    try {
      const result = await parser.current.run(
        code,
        async (prompt?: string) => {
          // 显示输入提示和输入框
          const promptText = prompt ?? 'Enter input:';
          setInputPrompt(promptText);
          setWaitingForInput(true);
          setInputValue('');
          
          // 等待用户输入
          const userInput = await new Promise<string>((resolve) => {
            inputResolveRef.current = resolve;
          });
          
          setWaitingForInput(false);
          return userInput;
        },
        (text: string) => {
          // 实时流式输出每一行
          setOutput(prev => [...prev, text]);
        }
      );

      // 不再覆盖输出，因为 onOutput 已经实时流式输出，且包含用户输入回显
      setParseSuccess(true);
      setAstJson(JSON.stringify(parser.current.parse(code), null, 2));
      // 更新虚拟文件状态
      setVirtualFiles(parser.current.getAllFiles());
      // 更新追踪表
      setTraceTable(parser.current.getTraceTable());
      setFinalVariables(parser.current.getVariables());
      setFinalVariableTypes(parser.current.getVariableTypes());
      setArraysData(convertArraysData(parser.current.getArrays(), parser.current.getVariableTypes()));
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(friendlyErrorMessage(errMsg));
      setParseSuccess(false);
      showEditorError(errMsg);
    } finally {
      setIsRunning(false);
      setWaitingForInput(false);
    }
  };

  // 停止执行
  const stopCode = () => {
    parser.current.abort();
    // 如果正在等待用户输入，拒绝 Promise 让 run() 尽快退出
    if (inputResolveRef.current) {
      inputResolveRef.current('');
      inputResolveRef.current = null;
    }
    setWaitingForInput(false);
  };

  // 导出 Trace Table 为 Excel
  const exportTraceTable = () => {
    if (traceTable.length === 0) return;
    const headers = ['Line', ...traceColumns, 'Output'];
    const rows = traceTable.map(entry => [
      entry.line || '-',
      ...traceColumns.map(col => entry.variables[col] !== undefined ? String(entry.variables[col]) : ''),
      entry.output || ''
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    // 设置列宽
    ws['!cols'] = headers.map((h, i) => ({ wch: i === 0 ? 6 : Math.max(h.length + 4, 12) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Trace Table');
    XLSX.writeFile(wb, 'trace_table.xlsx');
  };

  // 处理用户提交输入
  const handleInputSubmit = () => {
    if (inputResolveRef.current) {
      const value = inputValue;
      // 将用户输入回显到输出中（只显示值，类似终端）
      setOutput(prev => [...prev, value]);
      inputResolveRef.current(value);
      inputResolveRef.current = null;
    }
  };

  // 处理输入框按键
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleInputSubmit();
    }
  };

  // 自动滚动到底部
  useEffect(() => {
    if (outputEndRef.current) {
      outputEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [output, waitingForInput]);

  // 重置代码
  const resetCode = () => {
    setCode('');
    setOutput([]);
    setError(null);
    setParseSuccess(false);
    setVirtualFiles({});
    setSelectedFile(null);
    setWaitingForInput(false);
    setInputPrompt('');
    setInputValue('');
    if (inputResolveRef.current) {
      inputResolveRef.current('');
      inputResolveRef.current = null;
    }
  };

  // 删除单个虚拟文件
  const deleteVirtualFile = (filename: string) => {
    setVirtualFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[filename];
      return newFiles;
    });
    if (selectedFile === filename) {
      setSelectedFile(null);
    }
  };

  // 清空所有虚拟文件
  const clearAllVirtualFiles = () => {
    setVirtualFiles({});
    setSelectedFile(null);
  };

  // 添加虚拟文件（内联输入完成后调用）
  const confirmAddFile = () => {
    const name = newFileName.trim();
    if (name && !virtualFiles[name]) {
      setVirtualFiles(prev => ({ ...prev, [name]: [] }));
      parser.current.setFileContent(name, []);
      setSelectedFile(name);
    }
    setNewFileName('');
    setIsAddingFile(false);
  };

  // 取消添加文件
  const cancelAddFile = () => {
    setNewFileName('');
    setIsAddingFile(false);
  };

  // 上传文件处理
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const newFiles = { ...virtualFiles };
    let loaded = 0;

    fileArray.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const lines = content.split(/\r?\n/);
        newFiles[file.name] = lines;
        parser.current.setFileContent(file.name, lines);
        loaded++;

        // 所有文件读取完成后更新 state
        if (loaded === fileArray.length) {
          setVirtualFiles(newFiles);
          setSelectedFile(file.name);
        }
      };
      reader.readAsText(file);
    });

    // 清空 input 值，允许重复上传同名文件
    e.target.value = '';
  };

  // 保存代码功能
  const saveCode = () => {
    try {
      localStorage.setItem('pseudocode-editor-code', code);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // localStorage not available
    }
  };

  // 主题切换
  const setThemeByName = (themeName: ThemeName) => {
    setTheme(themeName);
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(`pseudocode-${themeName}`);
    }
  };

  const styles = getThemeStyles(currentTheme);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center">
        <div className="text-slate-500">Loading editor...</div>
      </div>
    );
  }

  return (
    <>
      {/* Syllabus selection dialog for first visit */}
      <Dialog open={showSyllabusDialog} onOpenChange={(open) => { if (!open) setShowSyllabusDialog(false); }}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Welcome to Pseudocode IDE</DialogTitle>
            <DialogDescription>
              Choose your syllabus to get started. You can change this later from the top menu.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            <button
              onClick={() => { setSyllabus('igcse-0478'); setShowSyllabusDialog(false); }}
              className="flex flex-col items-start gap-1 rounded-lg border p-4 text-left transition-colors hover:bg-purple-500/10 hover:border-purple-500/50"
            >
              <span className="font-semibold text-base">Cambridge IGCSE 0478</span>
              <span className="text-sm text-muted-foreground">Computer Science — O Level pseudocode standard</span>
            </button>
            <button
              onClick={() => { setSyllabus('alevel-9618'); setShowSyllabusDialog(false); }}
              className="flex flex-col items-start gap-1 rounded-lg border p-4 text-left transition-colors hover:bg-blue-500/10 hover:border-blue-500/50"
            >
              <span className="font-semibold text-base">Cambridge A-Level 9618</span>
              <span className="text-sm text-muted-foreground">Computer Science — A Level pseudocode standard</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
      <div 
      className={`h-screen flex flex-col overflow-hidden ${styles.bg} ${styles.text}`}
      data-theme={theme}
    >
      {/* 顶部标题栏 */}
      <div className={`h-12 border-b flex items-center px-2 md:px-4 shrink-0 ${styles.headerBg} ${styles.headerBorder}`}>
        <FileCode className="w-5 h-5 mr-1 md:mr-2 text-purple-400 shrink-0" />
        <h1 className={`text-sm md:text-lg font-semibold ${styles.headerText} truncate`}>
          <span className="hidden sm:inline">Pseudocode Editor</span>
          <span className="sm:hidden">Pseudo IDE</span>
        </h1>
        <div className="ml-1 md:ml-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className={`${styles.buttonText} ${styles.buttonHover}`}>
                <BookOpen className="w-4 h-4 mr-0 md:mr-1" />
                <span className="hidden md:inline text-xs">{syllabus === 'igcse-0478' ? 'IGCSE 0478' : 'A-Level 9618'}</span>
                <ChevronDown className="w-3 h-3 ml-0 md:ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className={`w-56 ${styles.dropdownBg} ${styles.dropdownBorder}`}>
              <DropdownMenuItem 
                onClick={() => setSyllabus('igcse-0478')}
                className={`${styles.dropdownItemText} ${styles.dropdownItemHover} cursor-pointer ${syllabus === 'igcse-0478' ? (theme === 'light' ? 'bg-slate-100' : 'bg-slate-800') : ''}`}
              >
                Cambridge IGCSE 0478
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSyllabus('alevel-9618')}
                className={`${styles.dropdownItemText} ${styles.dropdownItemHover} cursor-pointer ${syllabus === 'alevel-9618' ? (theme === 'light' ? 'bg-slate-100' : 'bg-slate-800') : ''}`}
              >
                Cambridge A-Level 9618
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* 示例选择器 */}
        {/* 文件菜单 */}
        <div className="ml-1 md:ml-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className={`${styles.buttonText} styles.buttonHover`}>
                <FileCode className="w-4 h-4 mr-0 md:mr-1" />
                <span className="hidden md:inline">File</span>
                <ChevronDown className="w-3 h-3 ml-0 md:ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className={`w-48 ${styles.dropdownBg} ${styles.dropdownBorder}`}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pseudo,.txt,text/plain"
                onChange={handleImportCode}
                className="hidden"
              />
              <DropdownMenuItem 
                onClick={saveCode}
                className={`${styles.dropdownItemText} ${styles.dropdownItemHover} cursor-pointer`}
              >
                {saved ? <Check className="w-4 h-4 mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                {saved ? 'Saved!' : 'Save'}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => fileInputRef.current?.click()}
                className={`${styles.dropdownItemText} ${styles.dropdownItemHover} cursor-pointer`}
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleExportCode}
                className={`${styles.dropdownItemText} ${styles.dropdownItemHover} cursor-pointer`}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={resetCode}
                className={`${styles.dropdownItemText} ${styles.dropdownItemHover} cursor-pointer`}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* 视图菜单 */}
        <div className="ml-1 md:ml-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className={`${styles.buttonText} styles.buttonHover`}>
                <Sun className="w-4 h-4 mr-0 md:mr-1" />
                <span className="hidden md:inline">View</span>
                <ChevronDown className="w-3 h-3 ml-0 md:ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className={`w-48 ${styles.dropdownBg} ${styles.dropdownBorder}`}>
              <DropdownMenuItem 
                onClick={() => setThemeByName('nightlight')}
                className={`${styles.dropdownItemText} ${styles.dropdownItemHover} cursor-pointer ${currentTheme === 'nightlight' ? 'bg-[#223A6A]' : ''}`}
              >
                🌌 Nightlight
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setThemeByName('dark')}
                className={`${styles.dropdownItemText} ${styles.dropdownItemHover} cursor-pointer ${currentTheme === 'dark' ? 'bg-slate-800' : ''}`}
              >
                🌙 Slate Dark
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setThemeByName('light')}
                className={`${styles.dropdownItemText} ${styles.dropdownItemHover} cursor-pointer ${currentTheme === 'light' ? 'bg-slate-100' : ''}`}
              >
                ☀️ Slate Light
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setThemeByName('monokai')}
                className={`${styles.dropdownItemText} ${styles.dropdownItemHover} cursor-pointer ${currentTheme === 'monokai' ? 'bg-slate-800' : ''}`}
              >
                🎨 Monokai
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setThemeByName('dracula')}
                className={`${styles.dropdownItemText} ${styles.dropdownItemHover} cursor-pointer ${currentTheme === 'dracula' ? 'bg-slate-800' : ''}`}
              >
                🧛 Dracula
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setThemeByName('solarized-dark')}
                className={`${styles.dropdownItemText} ${styles.dropdownItemHover} cursor-pointer ${currentTheme === 'solarized-dark' ? 'bg-slate-800' : ''}`}
              >
                🌅 Solarized Dark
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setThemeByName('solarized-light')}
                className={`${styles.dropdownItemText} ${styles.dropdownItemHover} cursor-pointer ${currentTheme === 'solarized-light' ? 'bg-slate-100' : ''}`}
              >
                🌄 Solarized Light
              </DropdownMenuItem>
              <DropdownMenuSeparator className={`${styles.dropdownBorder}`} />
              <div className={`px-2 py-1.5 text-xs font-semibold ${styles.outputDimText}`}>Layout</div>
              <DropdownMenuItem
                onClick={() => setDesktopLayout('side-by-side')}
                className={`${styles.dropdownItemText} ${styles.dropdownItemHover} cursor-pointer ${desktopLayout === 'side-by-side' ? (theme === 'light' ? 'bg-slate-100' : 'bg-slate-800') : ''}`}
              >
                ◀▶ Side by Side
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setDesktopLayout('stacked')}
                className={`${styles.dropdownItemText} ${styles.dropdownItemHover} cursor-pointer ${desktopLayout === 'stacked' ? (theme === 'light' ? 'bg-slate-100' : 'bg-slate-800') : ''}`}
              >
                ▲▼ Stacked
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setDesktopLayout('editor-only')}
                className={`${styles.dropdownItemText} ${styles.dropdownItemHover} cursor-pointer ${desktopLayout === 'editor-only' ? (theme === 'light' ? 'bg-slate-100' : 'bg-slate-800') : ''}`}
              >
                📝 Editor Only
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setDesktopLayout('panel-only')}
                className={`${styles.dropdownItemText} ${styles.dropdownItemHover} cursor-pointer ${desktopLayout === 'panel-only' ? (theme === 'light' ? 'bg-slate-100' : 'bg-slate-800') : ''}`}
              >
                📊 Panel Only
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex-1" />
        <Button
          variant="ghost"
          size="sm"
          className={`${styles.buttonText} ${styles.buttonHover}`}
          onClick={() => { setBugDescription(''); setBugCopied(false); setShowBugDialog(true); }}
          title="Report a Bug"
        >
          <MessageCircleWarning className="w-4 h-4 mr-0 md:mr-1" />
          <span className="hidden md:inline text-xs">Bug</span>
        </Button>
        {isRunning ? (
          <Button onClick={stopCode} size="sm" className="bg-red-600 hover:bg-red-700 text-white ml-1 md:ml-2">
            <Square className="w-4 h-4 mr-0 md:mr-1" />
            <span className="hidden sm:inline">Stop</span>
          </Button>
        ) : (
          <Button onClick={runCode} size="sm" className={`${styles.runBtnBg} styles.runBtnHover ml-1 md:ml-2`}>
            <Play className="w-4 h-4 mr-0 md:mr-1" />
            <span className="hidden sm:inline">Run</span>
          </Button>
        )}
      </div>

      {/* 主体 */}
      <div id="main-container" className={`flex-1 overflow-hidden ${
        isMobile ? 'flex flex-col' :
        desktopLayout === 'stacked' ? 'flex flex-col' :
        'flex'
      }`}>
        {/* 编辑器区域 */}
        <div 
          className={`flex flex-col overflow-hidden ${
            isMobile ? (mobileView === 'editor' ? 'flex-1' : 'hidden') :
            desktopLayout === 'editor-only' ? 'flex-1' :
            desktopLayout === 'panel-only' ? 'hidden' :
            ''
          }`}
          style={isMobile || desktopLayout === 'editor-only' ? undefined : 
            desktopLayout === 'stacked' ? { height: `${leftWidth}%` } :
            { width: `${leftWidth}%` }
          }
        >
          <div className={`h-7 md:h-8 border-b flex items-center px-2 md:px-3 shrink-0 ${styles.headerBg} ${styles.headerBorder}`}>
            <span className={`text-xs font-mono ${styles.outputDimText}`}>main.pseudo</span>
          </div>
          <div className="flex-1">
            <Editor
              height="100%"
              language="pseudocode"
              theme={`pseudocode-${currentTheme}`}
              value={code}
              onChange={(value) => setCode(value ?? '')}
              onMount={handleEditorMount}
              options={{
                fontSize: isMobile ? 13 : 14,
                lineHeight: isMobile ? 20 : 22,
                fontFamily: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Consolas', monospace",
                fontLigatures: true,
                minimap: { enabled: !isMobile, maxColumn: 80 },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                padding: { top: isMobile ? 8 : 12 },
                renderLineHighlight: 'all',
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                bracketPairColorization: { enabled: true },
                autoClosingBrackets: 'always',
                autoClosingQuotes: 'always',
                autoClosingOvertype: 'always',
                autoSurround: 'languageDefined',
                tabSize: 4,
                insertSpaces: true,
                automaticLayout: true,
                folding: true, // 启用代码折叠
                foldingHighlight: true,
                selectOnLineNumbers: true,
                occurrencesHighlight: 'singleFile' as const, // 变量引用高亮
                lineNumbersMinChars: 3,
                fixedOverflowWidgets: true,
              }}
            />
          </div>
        </div>

        {/* 可拖动的分隔条 */}
        {!isMobile && desktopLayout !== 'editor-only' && desktopLayout !== 'panel-only' && (
        <div
          className={`${
            desktopLayout === 'stacked' ? 'h-1 cursor-row-resize' : 'w-1 cursor-col-resize'
          } transition-colors ${styles.dividerBg} styles.dividerHover ${isResizing ? styles.dividerHover : ''}`}
          onMouseDown={handleResizeStart}
        />
        )}

        {/* 输出面板 */}
        <div 
          className={`flex flex-col ${
            isMobile ? (mobileView === 'panel' ? 'flex-1 border-t' : 'hidden') :
            desktopLayout === 'panel-only' ? 'flex-1' :
            desktopLayout === 'editor-only' ? 'hidden' :
            desktopLayout === 'stacked' ? 'border-t' : 'border-l min-w-[280px] md:min-w-[320px]'
          } ${styles.outputBg} ${styles.outputBorder}`}
          style={isMobile || desktopLayout === 'panel-only' ? undefined :
            desktopLayout === 'stacked' ? { height: `${100 - leftWidth}%` } :
            { width: `${100 - leftWidth}%` }
          }
        >
          <Tabs defaultValue="output" className="flex flex-col h-full">
            <div className={`border-b px-1 md:px-2 shrink-0 ${styles.outputBorder}`}>
              <TabsList className="bg-transparent h-9 md:h-10">
                <TabsTrigger value="output" className={`${styles.tabActiveBg} ${styles.tabActiveText} ${styles.tabText} ${styles.tabHoverText}`}>
                  <Terminal className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">Output</span>
                </TabsTrigger>
                <TabsTrigger value="ast" className={`${styles.tabActiveBg} data-[state=active]:text-purple-500 ${styles.tabText} ${styles.tabHoverText}`}>
                  <Code className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">AST</span>
                </TabsTrigger>
                <TabsTrigger value="reference" className={`${styles.tabActiveBg} data-[state=active]:text-blue-500 ${styles.tabText} ${styles.tabHoverText}`}>
                  <BookOpen className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">Reference</span>
                </TabsTrigger>
                <TabsTrigger value="files" className={`${styles.tabActiveBg} data-[state=active]:text-emerald-500 ${styles.tabText} ${styles.tabHoverText}`}>
                  <FileCode className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">Files</span>
                  {Object.keys(virtualFiles).length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-emerald-500 text-white">
                      {Object.keys(virtualFiles).length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="trace" className={`${styles.tabActiveBg} data-[state=active]:text-amber-500 ${styles.tabText} ${styles.tabHoverText}`}>
                  <Table className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">Trace</span>
                  {traceTable.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-amber-500 text-white">
                      {traceTable.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="output" className="h-full m-0 p-0 flex flex-col">
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className={`px-4 py-2 border-b shrink-0 min-h-[36px] flex items-center justify-between ${styles.outputLineBorder}`}>
                    <div className="flex-1">
                      {error && (
                        <div className={`flex items-center gap-2 text-sm ${styles.outputErrorText}`}>
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{error}</span>
                        </div>
                      )}
                      {parseSuccess && !error && output.length > 0 && (
                        <div className={`flex items-center gap-2 text-sm ${styles.outputSuccessText}`}>
                          <CheckCircle className="w-4 h-4 shrink-0" />
                          <span>Code executed successfully!</span>
                        </div>
                      )}
                    </div>
                    {output.length > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleCopyLogs}
                        className={`${styles.buttonText} styles.buttonHover shrink-0`}
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 mr-1" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  <div className="flex-1 overflow-auto p-4 font-mono text-sm custom-scrollbar">
                    {output.length === 0 && !waitingForInput ? (
                      <p className={styles.outputDimText}>Click &quot;Run&quot; to execute the code...</p>
                    ) : (
                      <>
                        {output.map((line, i) => (
                          <div key={i} className={`${styles.outputSuccessText} leading-6`}>{line}</div>
                        ))}
                        {waitingForInput && (
                          <div className="flex items-center gap-2 mt-1 leading-6">
                            <span className={styles.outputDimText}>{inputPrompt}</span>
                            <input
                              type="text"
                              value={inputValue}
                              onChange={(e) => setInputValue(e.target.value)}
                              onKeyDown={handleInputKeyDown}
                              className={`flex-1 bg-transparent border-b-2 outline-none ${styles.outputSuccessText} ${styles.runBtnBg === 'bg-emerald-600' ? 'border-emerald-500' : styles.runBtnBg === 'bg-orange-500' ? 'border-orange-400' : styles.runBtnBg === 'bg-pink-500' ? 'border-pink-400' : styles.runBtnBg === 'bg-cyan-500' ? 'border-cyan-400' : styles.runBtnBg === 'bg-indigo-500' ? 'border-indigo-400' : 'border-slate-400'}`}
                              placeholder="Type and press Enter..."
                              autoFocus
                            />
                          </div>
                        )}
                      </>
                    )}
                    <div ref={outputEndRef} />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="ast" className="h-full m-0 p-0 flex flex-col">
                <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                  <pre className={`font-mono text-xs ${styles.outputDimText} whitespace-pre-wrap`}>
                    {astJson ? (
                      <SyntaxHighlighter code={astJson} theme={theme || 'dark'} />
                    ) : (
                      'Click "Run" to see the AST...'
                    )}
                  </pre>
                </div>
              </TabsContent>

              <TabsContent value="reference" className="h-full m-0 p-0 flex flex-col">
                <div className="flex-1 overflow-auto p-4 space-y-4 text-sm custom-scrollbar">
                  <div>
                    <h3 className={`font-semibold mb-2 ${styles.headerText}`}>Data Types</h3>
                    <div className="grid grid-cols-2 gap-1">
                      <code className={`${styles.refCodeBg} px-2 py-1 rounded text-blue-500`}>INTEGER</code>
                      <code className={`${styles.refCodeBg} px-2 py-1 rounded text-blue-500`}>REAL</code>
                      <code className={`${styles.refCodeBg} px-2 py-1 rounded text-blue-500`}>CHAR</code>
                      <code className={`${styles.refCodeBg} px-2 py-1 rounded text-blue-500`}>STRING</code>
                      <code className={`${styles.refCodeBg} px-2 py-1 rounded text-blue-500`}>BOOLEAN</code>
                    </div>
                  </div>
                  <Separator className={styles.separatorBg} />
                  <div>
                    <h3 className={`font-semibold mb-2 ${styles.headerText}`}>Built-in Functions</h3>
                    <div className="space-y-1 font-mono text-xs">
                      <code className={`block ${styles.refCodeBg} px-2 py-1 rounded text-cyan-500`}>LENGTH(string)</code>
                      <code className={`block ${styles.refCodeBg} px-2 py-1 rounded text-cyan-500`}>LCASE(string)</code>
                      <code className={`block ${styles.refCodeBg} px-2 py-1 rounded text-cyan-500`}>UCASE(string)</code>
                      <code className={`block ${styles.refCodeBg} px-2 py-1 rounded text-cyan-500`}>ROUND(number, places)</code>
                      <code className={`block ${styles.refCodeBg} px-2 py-1 rounded text-cyan-500`}>DIV(a, b)</code>
                      <code className={`block ${styles.refCodeBg} px-2 py-1 rounded text-cyan-500`}>MOD(a, b)</code>
                      {syllabus === 'igcse-0478' ? (
                        <>
                          <code className={`block ${styles.refCodeBg} px-2 py-1 rounded text-cyan-500`}>SUBSTRING(string, start, length)</code>
                          <code className={`block ${styles.refCodeBg} px-2 py-1 rounded text-cyan-500`}>RANDOM()</code>
                        </>
                      ) : (
                        <>
                          <code className={`block ${styles.refCodeBg} px-2 py-1 rounded text-cyan-500`}>MID(string, start, length)</code>
                          <code className={`block ${styles.refCodeBg} px-2 py-1 rounded text-cyan-500`}>RIGHT(string, length)</code>
                          <code className={`block ${styles.refCodeBg} px-2 py-1 rounded text-cyan-500`}>RAND(x)</code>
                          <code className={`block ${styles.refCodeBg} px-2 py-1 rounded text-cyan-500`}>INT(x)</code>
                        </>
                      )}
                    </div>
                  </div>
                  <Separator className={styles.separatorBg} />
                  <div>
                    <h3 className={`font-semibold mb-2 ${styles.headerText}`}>Control Structures</h3>
                    <div className="space-y-1 font-mono text-xs">
                      <code className={`block ${styles.refCodeBg} px-2 py-1 rounded text-purple-500`}>IF condition THEN ... ENDIF</code>
                      <code className={`block ${styles.refCodeBg} px-2 py-1 rounded text-purple-500`}>IF condition THEN ... ELSE ... ENDIF</code>
                      <code className={`block ${styles.refCodeBg} px-2 py-1 rounded text-purple-500`}>CASE OF variable ... ENDCASE</code>
                      {syllabus === 'alevel-9618' && (
                        <code className={`block ${styles.refCodeBg} px-2 py-1 rounded text-purple-500`}>  value1 : ... | value1 TO value2 : ...</code>
                      )}
                      <code className={`block ${styles.refCodeBg} px-2 py-1 rounded text-purple-500`}>FOR i &lt;- 1 TO 10 ... NEXT i</code>
                      {syllabus === 'igcse-0478' ? (
                        <code className={`block ${styles.refCodeBg} px-2 py-1 rounded text-purple-500`}>WHILE condition DO ... ENDWHILE</code>
                      ) : (
                        <code className={`block ${styles.refCodeBg} px-2 py-1 rounded text-purple-500`}>WHILE condition ... ENDWHILE</code>
                      )}
                      <code className={`block ${styles.refCodeBg} px-2 py-1 rounded text-purple-500`}>REPEAT ... UNTIL condition</code>
                    </div>
                  </div>
                  <Separator className={styles.separatorBg} />
                  <div>
                    <h3 className={`font-semibold mb-2 ${styles.headerText}`}>Declarations &amp; Assignment</h3>
                    <div className="space-y-1 font-mono text-xs">
                      <code className={`block ${styles.refCodeBg} px-2 py-1 rounded text-amber-500`}>DECLARE name : INTEGER</code>
                      {syllabus === 'igcse-0478' ? (
                        <code className={`block ${styles.refCodeBg} px-2 py-1 rounded text-amber-500`}>CONSTANT name &lt;- value</code>
                      ) : (
                        <code className={`block ${styles.refCodeBg} px-2 py-1 rounded text-amber-500`}>CONSTANT name = value</code>
                      )}
                      <code className={`block ${styles.refCodeBg} px-2 py-1 rounded text-amber-500`}>variable &lt;- expression</code>
                      <code className={`block ${styles.refCodeBg} px-2 py-1 rounded text-amber-500`}>DECLARE arr : ARRAY[1:10] OF STRING</code>
                    </div>
                  </div>
                  <Separator className={styles.separatorBg} />
                  <div>
                    <h3 className={`font-semibold mb-2 ${styles.headerText}`}>File Operations</h3>
                    <div className="space-y-1 font-mono text-xs">
                      <code className={`block ${styles.refCodeBg} px-2 py-1 rounded text-rose-500`}>OPENFILE filename FOR READ</code>
                      <code className={`block ${styles.refCodeBg} px-2 py-1 rounded text-rose-500`}>OPENFILE filename FOR WRITE</code>
                      <code className={`block ${styles.refCodeBg} px-2 py-1 rounded text-rose-500`}>READFILE filename, variable</code>
                      <code className={`block ${styles.refCodeBg} px-2 py-1 rounded text-rose-500`}>WRITEFILE filename, value</code>
                      <code className={`block ${styles.refCodeBg} px-2 py-1 rounded text-rose-500`}>CLOSEFILE filename</code>
                      <code className={`block ${styles.refCodeBg} px-2 py-1 rounded text-rose-500`}>EOF(filename) → BOOLEAN</code>
                    </div>
                  </div>
                  <Separator className={styles.separatorBg} />
                  <div>
                    <h3 className={`font-semibold mb-2 ${styles.headerText}`}>Functions &amp; Procedures</h3>
                    <div className="space-y-1 font-mono text-xs">
                      <code className={`block ${styles.refCodeBg} px-2 py-1 rounded text-teal-500`}>FUNCTION Name(params) RETURNS type</code>
                      <code className={`block ${styles.refCodeBg} px-2 py-1 rounded text-teal-500`}>  RETURN value</code>
                      <code className={`block ${styles.refCodeBg} px-2 py-1 rounded text-teal-500`}>ENDFUNCTION</code>
                      <code className={`block ${styles.refCodeBg} px-2 py-1 rounded text-teal-500`}>PROCEDURE Name(params)</code>
                      <code className={`block ${styles.refCodeBg} px-2 py-1 rounded text-teal-500`}>ENDPROCEDURE</code>
                      <code className={`block ${styles.refCodeBg} px-2 py-1 rounded text-teal-500`}>CALL ProcedureName(args)</code>
                      {syllabus === 'igcse-0478' && (
                        <code className={`block ${styles.refCodeBg} px-2 py-1 rounded text-teal-500`}>ProcedureName(args)</code>
                      )}
                    </div>
                  </div>
                  {syllabus === 'alevel-9618' && (
                    <>
                      <Separator className={styles.separatorBg} />
                      <div>
                        <h3 className={`font-semibold mb-2 ${styles.headerText}`}>A-Level 9618 Differences</h3>
                        <div className="space-y-2 text-xs">
                          <div className={`${styles.headerText}`}>
                            <span className="font-semibold text-amber-400">CONSTANT</span> uses <code>=</code> instead of <code>&lt;-</code>
                          </div>
                          <div className={`${styles.headerText}`}>
                            <span className="font-semibold text-amber-400">WHILE</span> does not use <code>DO</code>
                          </div>
                          <div className={`${styles.headerText}`}>
                            <span className="font-semibold text-amber-400">CALL</span> keyword required for procedure calls
                          </div>
                          <div className={`${styles.headerText}`}>
                            <span className="font-semibold text-amber-400">CASE</span> supports <code>TO</code> for ranges: <code>1 TO 5 : ...</code>
                          </div>
                          <div className={`${styles.headerText}`}>
                            <span className="font-semibold text-amber-400">MID()</span> replaces SUBSTRING(), <span className="font-semibold text-amber-400">RIGHT()</span> extracts right characters
                          </div>
                          <div className={`${styles.headerText}`}>
                            <span className="font-semibold text-amber-400">RAND(x)</span> returns 0 to x, <span className="font-semibold text-amber-400">INT(x)</span> floors to integer
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="files" className="h-full m-0 p-0 flex flex-col">
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* 文件列表和内容区域 */}
                  <div className="flex flex-1 overflow-hidden">
                    {/* 文件列表 */}
                    <div className={`w-48 border-r shrink-0 flex flex-col ${styles.outputBorder}`}>
                      <div className={`p-3 border-b ${styles.headerBg} ${styles.outputLineBorder}`}>
                        <div className="flex items-center justify-between">
                          <h3 className={`text-sm font-semibold ${styles.headerText}`}>
                            <FileCode className="w-4 h-4 inline mr-1" />
                            Virtual Files
                          </h3>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setIsAddingFile(true); setNewFileName(''); }}
                              className={`h-6 px-2 text-xs ${styles.buttonText} styles.buttonHover`}
                              title="Add file"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                              className={`h-6 px-2 text-xs ${styles.buttonText} styles.buttonHover`}
                              title="Upload file"
                            >
                              <Upload className="w-3 h-3" />
                            </Button>
                            <input
                              ref={fileInputRef}
                              type="file"
                              className="hidden"
                              multiple
                              accept=".txt,.csv,.dat,.tsv,.log,.text"
                              onChange={handleFileUpload}
                            />
                            {Object.keys(virtualFiles).length > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearAllVirtualFiles}
                                className={`h-6 px-2 text-xs ${styles.buttonText} styles.buttonHover`}
                                title="Clear all files"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 overflow-auto p-2 custom-scrollbar">
                        <div className="space-y-1">
                          {Object.keys(virtualFiles).map((filename) => (
                            <div key={filename} className="flex items-center gap-1 group">
                              <button
                                onClick={() => setSelectedFile(filename)}
                                className={`flex-1 text-left px-2 py-1.5 rounded text-xs font-mono transition-colors ${
                                  selectedFile === filename
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : `${styles.buttonText} styles.buttonHover`
                                }`}
                              >
                                📄 {filename}
                              </button>
                              <button
                                onClick={() => deleteVirtualFile(filename)}
                                className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity ${styles.buttonText} hover:text-red-400`}
                                title="Delete file"
                              >
                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                </svg>
                              </button>
                            </div>
                          ))}
                          {/* Inline new file input */}
                          {isAddingFile && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs opacity-50">📄</span>
                              <input
                                ref={newFileInputRef}
                                type="text"
                                value={newFileName}
                                onChange={e => setNewFileName(e.target.value)}
                                onBlur={() => {
                                  if (newFileName.trim()) {
                                    confirmAddFile();
                                  } else {
                                    setIsAddingFile(false);
                                  }
                                }}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    if (newFileName.trim()) {
                                      confirmAddFile();
                                    } else {
                                      setIsAddingFile(false);
                                    }
                                  } else if (e.key === 'Escape') {
                                    setIsAddingFile(false);
                                    setNewFileName('');
                                  }
                                }}
                                placeholder="filename.txt"
                                className={`flex-1 px-1.5 py-1 rounded text-xs font-mono border border-emerald-500/50 ${styles.headerBg} ${styles.headerText} outline-none focus:ring-1 focus:ring-emerald-500`}
                              />
                            </div>
                          )}
                        </div>
                        {Object.keys(virtualFiles).length === 0 && !isAddingFile && (
                          <p className={`text-xs text-center mt-2 ${styles.outputDimText}`}>
                            No files yet. Click + to add.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* 文件内容预览 */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                      {!selectedFile ? (
                        <div className={`flex-1 flex items-center justify-center ${styles.outputDimText}`}>
                          <p className="text-sm">Select a file to preview</p>
                        </div>
                      ) : (
                        <>
                          <div className={`px-4 py-2 border-b shrink-0 flex items-center justify-between ${styles.headerBg} ${styles.outputLineBorder}`}>
                            <span className={`text-sm font-semibold ${styles.headerText}`}>
                              📄 {selectedFile}
                            </span>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const content = virtualFiles[selectedFile]?.join('\n') || '';
                                  navigator.clipboard.writeText(content);
                                }}
                                className={`${styles.buttonText} styles.buttonHover`}
                                title="Copy content"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteVirtualFile(selectedFile!)}
                                className={`${styles.buttonText} hover:text-red-400`}
                                title="Delete file"
                              >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                </svg>
                              </Button>
                            </div>
                          </div>
                          <div className="flex-1 flex overflow-hidden font-mono text-xs">
                            <div className={`w-10 shrink-0 overflow-hidden text-right pr-2 pt-4 pb-4 select-none ${styles.outputDimText}`} aria-hidden="true">
                              {(virtualFiles[selectedFile] || ['']).map((_, i) => (
                                <div key={i} className="leading-[1.625rem] h-[1.625rem]">{i + 1}</div>
                              ))}
                            </div>
                            <textarea
                              className={`flex-1 resize-none bg-transparent outline-none ${styles.headerText} font-mono text-xs pt-4 pb-4 pr-4 leading-[1.625rem] custom-scrollbar`}
                              value={virtualFiles[selectedFile]?.join('\n') || ''}
                              placeholder="Start typing..."
                              onChange={(e) => {
                                const text = e.target.value;
                                const lines = text ? text.split('\n') : [];
                                setVirtualFiles(prev => ({...prev, [selectedFile!]: lines}));
                                if (parser.current) {
                                  parser.current.setFileContent(selectedFile!, text);
                                }
                              }}
                              onScroll={(e) => {
                                const gutter = (e.target as HTMLTextAreaElement).previousElementSibling;
                                if (gutter) gutter.scrollTop = (e.target as HTMLTextAreaElement).scrollTop;
                              }}
                              spellCheck={false}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Trace Table Tab */}
              <TabsContent value="trace" className="h-full m-0 p-0 flex flex-col">
                <div className="flex-1 overflow-auto custom-scrollbar min-h-0">
                  {traceTable.length === 0 && Object.keys(arraysData).length === 0 ? (
                    <div className={`flex-1 flex items-center justify-center p-8 ${styles.outputDimText}`}>
                      <p className="text-sm">Click Run to generate a trace table</p>
                    </div>
                  ) : (
                    <div className="space-y-4 p-2">
                      {/* 2D Array Visualizer */}
                      {Object.entries(arraysData).map(([name, arr]) => {
                        if (!arr || !arr.is2D || !arr.bounds?.[0] || !arr.bounds?.[1]) return null;
                        const rows = arr.bounds[0][1] - arr.bounds[0][0] + 1;
                        const cols = arr.bounds[1][1] - arr.bounds[1][0] + 1;
                        const lowerR = arr.bounds[0][0];
                        const lowerC = arr.bounds[1][0];
                        return (
                          <div key={name} className={`${styles.headerBg} rounded-lg border ${styles.outputLineBorder}`}>
                            <div className={`px-3 py-2 font-semibold text-sm ${styles.headerText} border-b ${styles.outputLineBorder}`}>
                              {name} <span className={styles.outputDimText}>({arr.elementType})</span>
                            </div>
                            <div className="p-2 overflow-x-auto">
                              <table className="text-xs font-mono">
                                <thead>
                                  <tr>
                                    <th className={`px-2 py-1 ${styles.outputDimText}`}></th>
                                    {Array.from({ length: cols }, (_, c) => (
                                      <th key={c} className={`px-3 py-1 text-center ${styles.outputDimText}`}>{lowerC + c}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {Array.from({ length: rows }, (_, r) => (
                                    <tr key={r}>
                                      <td className={`px-2 py-1 text-center font-semibold ${styles.outputDimText}`}>{lowerR + r}</td>
                                      {Array.from({ length: cols }, (_, c) => {
                                        const key = `${lowerR + r},${lowerC + c}`;
                                        const val = arr.data?.[key];
                                        return (
                                          <td key={c} className={`px-3 py-1 text-center border ${styles.outputLineBorder} ${val !== undefined ? styles.headerText : styles.outputDimText}`}>
                                            {val !== undefined ? String(val) : '-'}
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })}
                      {/* 1D Array Visualizer */}
                      {Object.entries(arraysData).map(([name, arr]) => {
                        if (!arr || arr.is2D || !arr.bounds?.[0]) return null;
                        const size = arr.bounds[0][1] - arr.bounds[0][0] + 1;
                        const lower = arr.bounds[0][0];
                        return (
                          <div key={name} className={`${styles.headerBg} rounded-lg border ${styles.outputLineBorder}`}>
                            <div className={`px-3 py-2 font-semibold text-sm ${styles.headerText} border-b ${styles.outputLineBorder}`}>
                              {name} <span className={styles.outputDimText}>({arr.elementType})</span>
                            </div>
                            <div className="p-2 overflow-x-auto">
                              <table className="text-xs font-mono">
                                <thead>
                                  <tr>
                                    {Array.from({ length: size }, (_, i) => (
                                      <th key={i} className={`px-3 py-1 text-center ${styles.outputDimText} border-b ${styles.outputLineBorder}`}>{lower + i}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    {Array.from({ length: size }, (_, i) => {
                                      const key = `${lower + i}`;
                                      const val = arr.data?.[key];
                                      return (
                                        <td key={i} className={`px-3 py-1 text-center ${val !== undefined ? styles.headerText : styles.outputDimText}`}>
                                          {val !== undefined ? String(val) : '-'}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })}
                      {/* Trace Table */}
                      {traceTable.length > 0 && (
                        <div className={`${styles.headerBg} rounded-lg border ${styles.outputLineBorder}`}>
                          <div className={`px-3 py-2 font-semibold text-sm ${styles.headerText} border-b ${styles.outputLineBorder} flex items-center justify-between`}>
                            Trace Table
                            <button
                              onClick={exportTraceTable}
                              className={`p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 ${styles.outputDimText} hover:text-blue-400 transition-colors`}
                              title="Export to Excel"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs font-mono">
                              <thead className={`sticky top-0 ${styles.headerBg} border-b ${styles.outputLineBorder}`}>
                                <tr>
                                  <th className={`px-3 py-2 text-left font-semibold ${styles.headerText} border-r ${styles.outputLineBorder}`}>Line</th>
                                  {traceColumns.map(col => (
                                    <th key={col} className={`px-3 py-2 text-left font-semibold ${styles.headerText} border-r ${styles.outputLineBorder}`}>{col}</th>
                                  ))}
                                  <th className={`px-3 py-2 text-left font-semibold ${styles.headerText}`}>Output</th>
                                </tr>
                              </thead>
                              <tbody>
                                {traceTable.map((entry, i) => (
                                  <tr key={i} className={`border-b ${styles.outputLineBorder} ${i % 2 === 0 ? '' : 'bg-black/5 dark:bg-white/5'}`}>
                                    <td className={`px-3 py-1.5 ${styles.outputDimText} border-r ${styles.outputLineBorder}`}>{entry.line || '-'}</td>
                                    {traceColumns.map(col => (
                                      <td key={col} className={`px-3 py-1.5 ${styles.headerText} border-r ${styles.outputLineBorder}`}>
                                        {entry.variables[col] !== undefined ? String(entry.variables[col]) : ''}
                                      </td>
                                    ))}
                                    <td className={`px-3 py-1.5 ${entry.output ? 'text-green-400' : styles.outputDimText}`}>
                                      {entry.output || ''}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Mobile bottom nav */}
      {isMobile && (
        <div className={`h-14 border-t flex items-center justify-around shrink-0 ${styles.headerBg} ${styles.headerBorder}`}>
          <button
            onClick={() => setMobileView('editor')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 ${mobileView === 'editor' ? 'text-purple-400' : styles.outputDimText}`}
          >
            <Code className="w-5 h-5" />
            <span className="text-[10px]">Editor</span>
          </button>
          <button
            onClick={isRunning ? stopCode : runCode}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 ${isRunning ? 'text-red-400' : 'text-green-400'}`}
          >
            {isRunning ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            <span className="text-[10px]">{isRunning ? 'Stop' : 'Run'}</span>
          </button>
          <button
            onClick={() => setMobileView('panel')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 ${mobileView === 'panel' ? 'text-purple-400' : styles.outputDimText}`}
          >
            <Terminal className="w-5 h-5" />
            <span className="text-[10px]">Panel</span>
          </button>
        </div>
      )}
    </div>

    {/* Bug Report Dialog */}
    <Dialog open={showBugDialog} onOpenChange={setShowBugDialog}>
      <DialogContent className={`sm:max-w-lg ${styles.outputBg} ${styles.outputBorder} ${styles.text}`}>
        <DialogHeader>
          <DialogTitle className={styles.headerText}>Report a Bug</DialogTitle>
          <DialogDescription className={styles.outputDimText}>
            Describe the issue. Your code and output will be automatically included.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div>
            <label className={`text-sm font-medium mb-1.5 block ${styles.headerText}`}>What went wrong?</label>
            <Textarea
              value={bugDescription}
              onChange={(e) => setBugDescription(e.target.value)}
              placeholder="Describe the bug: what did you expect to happen, and what actually happened?"
              rows={4}
              className={`resize-none ${styles.headerBg} ${styles.outputLineBorder} ${styles.headerText} placeholder:text-current placeholder:opacity-50`}
            />
          </div>
          <div className={`text-xs ${styles.outputDimText} space-y-1`}>
            <p>The following will be automatically included:</p>
            <ul className="list-disc list-inside space-y-0.5 ml-1">
              <li>Current code in the editor</li>
              <li>Output and error messages</li>
              {Object.keys(virtualFiles).length > 0 && <li>Virtual files ({Object.keys(virtualFiles).length} file{Object.keys(virtualFiles).length > 1 ? 's' : ''})</li>}
              <li>Syllabus, theme, and browser info</li>
            </ul>
          </div>
          <div className={`text-xs rounded-md p-3 max-h-40 overflow-auto font-mono border ${styles.headerBg} ${styles.headerText} ${styles.outputLineBorder}`}>
            <pre className="whitespace-pre-wrap break-all">{generateBugReport().slice(0, 800)}{generateBugReport().length > 800 ? '\n...(truncated preview)' : ''}</pre>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={downloadBugReport}
            className={`${styles.buttonText} ${styles.buttonHover} ${styles.outputLineBorder}`}
          >
            <Download className="w-4 h-4 mr-1.5" />
            Download
          </Button>
          <Button
            size="sm"
            onClick={copyBugReport}
            className={bugCopied ? 'bg-green-600 hover:bg-green-700 text-white' : `${styles.runBtnBg} ${styles.runBtnHover} ${styles.runBtnText}`}
          >
            {bugCopied ? <Check className="w-4 h-4 mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />}
            {bugCopied ? 'Copied!' : 'Copy to Clipboard'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}

