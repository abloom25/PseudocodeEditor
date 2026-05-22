'use client';

import { Separator } from '@/components/ui/separator';
import type { Syllabus, UIThemeColors } from '../types';
import { reference } from '../config';

interface ReferencePanelProps {
  syllabus: Syllabus;
  styles: UIThemeColors;
}

export function ReferencePanel({ syllabus, styles }: ReferencePanelProps) {
  const common = reference.common as {
    dataTypes: string[];
    functions: { name: string; desc: string }[];
    controlStructures: string[];
    declarations: string[];
    fileOperations: string[];
    functionsProcedures: string[];
  };

  const syllabusData = reference[syllabus] as {
    extraFunctions?: { name: string; desc: string }[];
    extraControlStructures?: string[];
    extraDeclarations?: string[];
    extraFunctionsProcedures?: string[];
    differences?: { keyword: string; diff: string }[];
  };

  return (
    <div className="flex-1 overflow-auto p-4 space-y-4 text-sm custom-scrollbar">
      <div>
        <h3 className={`font-semibold mb-2 ${styles.headerText}`}>Data Types</h3>
        <div className="grid grid-cols-2 gap-1">
          {common.dataTypes.map(dt => (
            <code key={dt} className={`${styles.refCodeBg} px-2 py-1 rounded text-blue-500`}>{dt}</code>
          ))}
        </div>
      </div>

      <Separator className={styles.separatorBg} />

      <div>
        <h3 className={`font-semibold mb-2 ${styles.headerText}`}>Built-in Functions</h3>
        <div className="space-y-1 font-mono text-xs">
          {[...common.functions, ...(syllabusData.extraFunctions || [])].map(fn => (
            <code key={fn.name} className={`block ${styles.refCodeBg} px-2 py-1 rounded text-cyan-500`}>{fn.name}</code>
          ))}
        </div>
      </div>

      <Separator className={styles.separatorBg} />

      <div>
        <h3 className={`font-semibold mb-2 ${styles.headerText}`}>Control Structures</h3>
        <div className="space-y-1 font-mono text-xs">
          {[...common.controlStructures, ...(syllabusData.extraControlStructures || [])].map(cs => (
            <code key={cs} className={`block ${styles.refCodeBg} px-2 py-1 rounded text-purple-500`}>{cs}</code>
          ))}
        </div>
      </div>

      <Separator className={styles.separatorBg} />

      <div>
        <h3 className={`font-semibold mb-2 ${styles.headerText}`}>Declarations &amp; Assignment</h3>
        <div className="space-y-1 font-mono text-xs">
          {[...common.declarations, ...(syllabusData.extraDeclarations || [])].map(d => (
            <code key={d} className={`block ${styles.refCodeBg} px-2 py-1 rounded text-amber-500`}>{d}</code>
          ))}
        </div>
      </div>

      <Separator className={styles.separatorBg} />

      <div>
        <h3 className={`font-semibold mb-2 ${styles.headerText}`}>File Operations</h3>
        <div className="space-y-1 font-mono text-xs">
          {common.fileOperations.map(op => (
            <code key={op} className={`block ${styles.refCodeBg} px-2 py-1 rounded text-rose-500`}>{op}</code>
          ))}
        </div>
      </div>

      <Separator className={styles.separatorBg} />

      <div>
        <h3 className={`font-semibold mb-2 ${styles.headerText}`}>Functions &amp; Procedures</h3>
        <div className="space-y-1 font-mono text-xs">
          {[...common.functionsProcedures, ...(syllabusData.extraFunctionsProcedures || [])].map(fp => (
            <code key={fp} className={`block ${styles.refCodeBg} px-2 py-1 rounded text-teal-500`}>{fp}</code>
          ))}
        </div>
      </div>

      {syllabus === 'alevel-9618' && syllabusData.differences && (
        <>
          <Separator className={styles.separatorBg} />
          <div>
            <h3 className={`font-semibold mb-2 ${styles.headerText}`}>A-Level 9618 Differences</h3>
            <div className="space-y-2 text-xs">
              {syllabusData.differences.map(diff => (
                <div key={diff.keyword} className={styles.headerText}>
                  <span className="font-semibold text-amber-400">{diff.keyword}</span>: {diff.diff}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
