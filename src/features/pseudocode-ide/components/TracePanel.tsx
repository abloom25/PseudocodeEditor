'use client';

import { Table } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import type { UIThemeColors, TraceEntry, ArrayData } from '../types';

interface TracePanelProps {
  traceTable: TraceEntry[];
  arraysData: Record<string, ArrayData>;
  traceColumns: string[];
  styles: UIThemeColors;
  onExport: () => void;
}

export function TracePanel({ traceTable, arraysData, traceColumns, styles, onExport }: TracePanelProps) {
  const hasData = traceTable.length > 0 || Object.keys(arraysData).length > 0;

  if (!hasData) {
    return (
      <div className={`flex-1 flex items-center justify-center p-8 ${styles.outputDimText}`}>
        <p className="text-sm">Click Run to generate a trace table</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-2">
      {traceTable.length > 0 && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={onExport}
            className={`${styles.buttonText} ${styles.buttonHover}`}
          >
            <Table className="w-4 h-4 mr-1" />
            Export Excel
          </Button>
        </div>
      )}

      {Object.entries(arraysData).map(([name, arr]) => {
        if (!arr || arr.is2D === undefined || !arr.bounds?.[0]) return null;

        if (arr.is2D && arr.bounds[1]) {
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
        }

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
                        <td key={i} className={`px-3 py-1 text-center ${styles.headerText}`}>
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

      {traceTable.length > 0 && (
        <div className={`${styles.headerBg} rounded-lg border ${styles.outputLineBorder} overflow-x-auto`}>
          <div className={`px-3 py-2 font-semibold text-sm ${styles.headerText} border-b ${styles.outputLineBorder}`}>
            Trace Table <span className={styles.outputDimText}>({traceTable.length} rows)</span>
          </div>
          <div className="p-2">
            <table className="text-xs font-mono w-full">
              <thead>
                <tr>
                  <th className={`px-2 py-1 text-left ${styles.outputDimText}`}>Line</th>
                  {traceColumns.map(col => (
                    <th key={col} className={`px-2 py-1 text-left ${styles.outputDimText}`}>{col}</th>
                  ))}
                  <th className={`px-2 py-1 text-left ${styles.outputDimText}`}>Output</th>
                </tr>
              </thead>
              <tbody>
                {traceTable.map((entry, i) => (
                  <tr key={i} className={`border-t ${styles.outputLineBorder}`}>
                    <td className={`px-2 py-1 ${styles.outputDimText}`}>{entry.line || '-'}</td>
                    {traceColumns.map(col => (
                      <td key={col} className={`px-2 py-1 ${styles.headerText}`}>
                        {entry.variables[col] !== undefined ? String(entry.variables[col]) : ''}
                      </td>
                    ))}
                    <td className={`px-2 py-1 ${styles.outputSuccessText}`}>{entry.output || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
