import type { Metadata } from 'next';
import Link from 'next/link';
import {
  CodeExample,
  GuideSection,
  GuideShell,
} from '@/components/GuideShell';

export const metadata: Metadata = {
  title: 'IGCSE 0478 Pseudocode Guide',
  description:
    'Cambridge IGCSE Computer Science 0478 pseudocode syntax guide with runnable examples for variables, arrays, IF, CASE, loops, functions, procedures, and files.',
  alternates: {
    canonical: '/guides/igcse-0478/',
  },
  openGraph: {
    title: 'Cambridge IGCSE 0478 Pseudocode Guide',
    description:
      'Learn IGCSE 0478 pseudocode syntax through practical, runnable examples.',
    url: '/guides/igcse-0478/',
    siteName: 'Pseudocode Editor',
    type: 'article',
    images: ['/opengraph-image'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cambridge IGCSE 0478 Pseudocode Guide',
    description:
      'Learn IGCSE 0478 pseudocode syntax through practical, runnable examples.',
    images: ['/opengraph-image'],
  },
};

export default function IgcseGuidePage() {
  return (
    <GuideShell
      eyebrow="IGCSE Computer Science 0478"
      title="Cambridge IGCSE 0478 pseudocode guide"
      description="A practical reference for the IGCSE mode of the editor, covering the core syntax used to write, trace, and test algorithms."
      path="/guides/igcse-0478/"
    >
      <GuideSection title="Variables, constants, and arrays">
        <p>
          Declare every variable before use. Arrays may have one or two
          dimensions, and their bounds are inclusive.
        </p>
        <CodeExample>{`
DECLARE Name : STRING
DECLARE Score : INTEGER
CONSTANT PassMark <- 50
DECLARE Results : ARRAY[1:30] OF INTEGER

INPUT Score
Results[1] <- Score
OUTPUT "First score: ", Results[1]
        `}</CodeExample>
      </GuideSection>

      <GuideSection title="Selection and iteration">
        <p>
          Use <code>ENDIF</code>, <code>NEXT</code>, <code>ENDWHILE</code>,
          and <code>UNTIL</code> to close control structures.
        </p>
        <CodeExample>{`
DECLARE Index : INTEGER
DECLARE Total : INTEGER
Total <- 0

FOR Index <- 1 TO 10
   Total <- Total + Index
NEXT Index

IF Total >= 50 THEN
   OUTPUT "Target reached"
ELSE
   OUTPUT "Below target"
ENDIF
        `}</CodeExample>
      </GuideSection>

      <GuideSection title="Procedures and functions">
        <p>
          Procedures perform a task. Functions return a value that can be used
          inside an expression.
        </p>
        <CodeExample>{`
FUNCTION IsPass(Score : INTEGER) RETURNS BOOLEAN
   RETURN Score >= 50
ENDFUNCTION

PROCEDURE ShowResult(Score : INTEGER)
   IF IsPass(Score) THEN
      OUTPUT "Pass"
   ELSE
      OUTPUT "Fail"
   ENDIF
ENDPROCEDURE

CALL ShowResult(72)
        `}</CodeExample>
      </GuideSection>

      <GuideSection title="Text file handling">
        <p>
          The editor uses virtual files, so file algorithms can be practised
          without accessing files on your computer.
        </p>
        <CodeExample>{`
DECLARE Line : STRING
OPENFILE "names.txt" FOR READ
WHILE NOT EOF("names.txt") DO
   READFILE "names.txt", Line
   OUTPUT Line
ENDWHILE
CLOSEFILE "names.txt"
        `}</CodeExample>
      </GuideSection>

      <GuideSection title="Continue practising">
        <p>
          Run these examples in IGCSE mode, then use the trace table to inspect
          each variable change.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link className="font-semibold text-[#8ED0FF] hover:text-white" href="/">
            Open the editor
          </Link>
          <Link
            className="font-semibold text-[#8ED0FF] hover:text-white"
            href="/guides/alevel-9618/"
          >
            Compare A Level 9618 syntax
          </Link>
        </div>
      </GuideSection>
    </GuideShell>
  );
}
