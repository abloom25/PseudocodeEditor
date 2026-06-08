'use client';

import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/components/LanguageProvider';
import type { Syllabus, UIThemeColors } from '../types';
import { reference } from '../config';

interface ReferencePanelProps {
  syllabus: Syllabus;
  styles: UIThemeColors;
}

export function ReferencePanel({ syllabus, styles }: ReferencePanelProps) {
  const { t } = useLanguage();
  const common = reference.common as {
    dataTypes: string[];
    functions: { name: string; desc: string }[];
    controlStructures: string[];
    declarations: string[];
    fileOperations: string[];
    functionsProcedures: string[];
  };

  const syllabusData = reference[syllabus] as {
    extraDataTypes?: string[];
    extraFunctions?: { name: string; desc: string }[];
    extraControlStructures?: string[];
    extraDeclarations?: string[];
    extraFileOperations?: string[];
    extraFunctionsProcedures?: string[];
    differences?: { keyword: string; diff: string }[];
  };

  return (
    <div className="flex-1 overflow-auto p-4 space-y-4 text-sm custom-scrollbar">
      <div>
        <h3 className={`font-semibold mb-2 ${styles.headerText}`}>{t('dataTypes')}</h3>
        <div className="grid grid-cols-2 gap-1">
          {[...common.dataTypes, ...(syllabusData.extraDataTypes || [])].map(dt => (
            <code key={dt} className={`${styles.refCodeBg} px-2 py-1 rounded text-blue-500`}>{dt}</code>
          ))}
        </div>
      </div>

      <Separator className={styles.separatorBg} />

      <div>
        <h3 className={`font-semibold mb-2 ${styles.headerText}`}>{t('builtInFunctions')}</h3>
        <div className="space-y-1 font-mono text-xs">
          {[...common.functions, ...(syllabusData.extraFunctions || [])].map(fn => (
            <code key={fn.name} className={`block ${styles.refCodeBg} px-2 py-1 rounded text-cyan-500`}>{fn.name}</code>
          ))}
        </div>
      </div>

      <Separator className={styles.separatorBg} />

      <div>
        <h3 className={`font-semibold mb-2 ${styles.headerText}`}>{t('controlStructures')}</h3>
        <div className="space-y-1 font-mono text-xs">
          {[...common.controlStructures, ...(syllabusData.extraControlStructures || [])].map(cs => (
            <code key={cs} className={`block ${styles.refCodeBg} px-2 py-1 rounded text-purple-500`}>{cs}</code>
          ))}
        </div>
      </div>

      <Separator className={styles.separatorBg} />

      <div>
        <h3 className={`font-semibold mb-2 ${styles.headerText}`}>{t('declarationsAssignment')}</h3>
        <div className="space-y-1 font-mono text-xs">
          {[...common.declarations, ...(syllabusData.extraDeclarations || [])].map(d => (
            <code key={d} className={`block ${styles.refCodeBg} px-2 py-1 rounded text-amber-500`}>{d}</code>
          ))}
        </div>
      </div>

      <Separator className={styles.separatorBg} />

      <div>
        <h3 className={`font-semibold mb-2 ${styles.headerText}`}>{t('fileOperations')}</h3>
        <div className="space-y-1 font-mono text-xs">
          {[...common.fileOperations, ...(syllabusData.extraFileOperations || [])].map(op => (
            <code key={op} className={`block ${styles.refCodeBg} px-2 py-1 rounded text-rose-500`}>{op}</code>
          ))}
        </div>
      </div>

      <Separator className={styles.separatorBg} />

      <div>
        <h3 className={`font-semibold mb-2 ${styles.headerText}`}>{t('functionsProcedures')}</h3>
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
            <h3 className={`font-semibold mb-2 ${styles.headerText}`}>{t('alevelDifferences')}</h3>
            <div className="space-y-2 text-xs">
              {syllabusData.differences.map(diff => (
                <div key={diff.keyword} className={styles.headerText}>
                  <span className="font-semibold text-amber-400">{diff.keyword}</span>:{' '}
                  {referenceDifference(diff.keyword, t)}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function referenceDifference(keyword: string, t: ReturnType<typeof useLanguage>['t']): string {
  switch (keyword) {
    case 'CONSTANT':
      return t('usesInsteadOf', { value: '=', other: '<-' });
    case 'WHILE':
      return t('whileNoDo');
    case 'CALL':
      return t('callRequired');
    case 'CASE':
      return t('caseRanges');
    case 'MID()':
      return t('reference.diff.mid');
    case 'RAND(x)':
      return t('reference.diff.rand');
    case 'INT(x)':
      return t('reference.diff.int');
    case 'TYPE':
      return t('reference.diff.type');
    case 'DEFINE/SET':
      return t('reference.diff.set');
    case '. (点号)':
      return t('reference.diff.field');
    case '^ (脱字符)':
      return t('reference.diff.pointer');
    case 'APPEND':
      return t('reference.diff.append');
    case 'RANDOM/SEEK/GETRECORD/PUTRECORD':
      return t('reference.diff.randomFile');
    case 'CLASS':
      return t('reference.diff.class');
    case 'NEW/SUPER/INHERITS':
      return t('reference.diff.inheritance');
    default:
      return keyword;
  }
}
