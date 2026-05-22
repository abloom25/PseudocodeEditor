'use client';

import { useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle, Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UIThemeColors } from '../types';

interface OutputPanelProps {
  output: string[];
  error: string | null;
  parseSuccess: boolean;
  waitingForInput: boolean;
  inputPrompt: string;
  inputValue: string;
  styles: UIThemeColors;
  copied: boolean;
  onCopy: () => void;
  onInputChange: (value: string) => void;
  onInputSubmit: () => void;
  onInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function OutputPanel({
  output,
  error,
  parseSuccess,
  waitingForInput,
  inputPrompt,
  inputValue,
  styles,
  copied,
  onCopy,
  onInputChange,
  onInputSubmit,
  onInputKeyDown,
}: OutputPanelProps) {
  const outputEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (outputEndRef.current) {
      outputEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [output, waitingForInput]);

  const getRunBtnBorderColor = () => {
    if (styles.runBtnBg.includes('emerald')) return 'border-emerald-500';
    if (styles.runBtnBg.includes('orange')) return 'border-orange-400';
    if (styles.runBtnBg.includes('pink')) return 'border-pink-400';
    if (styles.runBtnBg.includes('cyan')) return 'border-cyan-400';
    if (styles.runBtnBg.includes('indigo')) return 'border-indigo-400';
    return 'border-slate-400';
  };

  return (
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
            onClick={onCopy}
            className={`${styles.buttonText} ${styles.buttonHover} shrink-0`}
          >
            {copied ? (
              <>
                <Download className="w-4 h-4 mr-1" />
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
                  onChange={(e) => onInputChange(e.target.value)}
                  onKeyDown={onInputKeyDown}
                  className={`flex-1 bg-transparent border-b-2 outline-none ${styles.outputSuccessText} ${getRunBtnBorderColor()}`}
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
  );
}
