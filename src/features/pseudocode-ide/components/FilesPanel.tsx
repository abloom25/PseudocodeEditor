'use client';

import { useState, useRef } from 'react';
import { FileCode, Plus, Upload, Trash2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UIThemeColors } from '../types';

interface FilesPanelProps {
  virtualFiles: Record<string, string[]>;
  selectedFile: string | null;
  styles: UIThemeColors;
  onSelectFile: (filename: string) => void;
  onDeleteFile: (filename: string) => void;
  onClearAll: () => void;
  onAddFile: (name: string) => void;
  onUpdateFile: (filename: string, lines: string[]) => void;
  onUploadFiles: (files: FileList) => void;
}

export function FilesPanel({
  virtualFiles,
  selectedFile,
  styles,
  onSelectFile,
  onDeleteFile,
  onClearAll,
  onAddFile,
  onUpdateFile,
  onUploadFiles,
}: FilesPanelProps) {
  const [isAddingFile, setIsAddingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const newFileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleConfirmAdd = () => {
    const name = newFileName.trim();
    if (name && !virtualFiles[name]) {
      onAddFile(name);
    }
    setNewFileName('');
    setIsAddingFile(false);
  };

  return (
    <div className="flex flex-1 overflow-hidden">
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
                className={`h-6 px-2 text-xs ${styles.buttonText} ${styles.buttonHover}`}
                title="Add file"
              >
                <Plus className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className={`h-6 px-2 text-xs ${styles.buttonText} ${styles.buttonHover}`}
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
                onChange={(e) => { if (e.target.files) onUploadFiles(e.target.files); e.target.value = ''; }}
              />
              {Object.keys(virtualFiles).length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearAll}
                  className={`h-6 px-2 text-xs ${styles.buttonText} ${styles.buttonHover}`}
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
                  onClick={() => onSelectFile(filename)}
                  className={`flex-1 text-left px-2 py-1.5 rounded text-xs font-mono transition-colors ${
                    selectedFile === filename
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : `${styles.buttonText} ${styles.buttonHover}`
                  }`}
                >
                  📄 {filename}
                </button>
                <button
                  onClick={() => onDeleteFile(filename)}
                  className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity ${styles.buttonText} hover:text-red-400`}
                  title="Delete file"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </button>
              </div>
            ))}
            {isAddingFile && (
              <div className="flex items-center gap-1">
                <span className="text-xs opacity-50">📄</span>
                <input
                  ref={newFileInputRef}
                  type="text"
                  value={newFileName}
                  onChange={e => setNewFileName(e.target.value)}
                  onBlur={() => { if (newFileName.trim()) handleConfirmAdd(); else setIsAddingFile(false); }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { if (newFileName.trim()) handleConfirmAdd(); else setIsAddingFile(false); }
                    else if (e.key === 'Escape') { setIsAddingFile(false); setNewFileName(''); }
                  }}
                  placeholder="filename.txt"
                  className={`flex-1 px-1.5 py-1 rounded text-xs font-mono border border-emerald-500/50 ${styles.headerBg} ${styles.headerText} outline-none focus:ring-1 focus:ring-emerald-500`}
                  autoFocus
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
                  className={`${styles.buttonText} ${styles.buttonHover}`}
                  title="Copy content"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteFile(selectedFile)}
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
                  onUpdateFile(selectedFile, lines);
                }}
                spellCheck={false}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
