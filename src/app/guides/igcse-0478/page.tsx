import type { Metadata } from 'next';
import Link from 'next/link';
import {
  CodeExample,
  GuideSection,
  GuideShell,
  GuideText,
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
      eyebrowKey="guides.igcse.eyebrow"
      titleKey="guides.igcse.title"
      descriptionKey="guides.igcse.description"
      path="/guides/igcse-0478/"
    >
      <GuideSection titleKey="guides.igcse.variables.title">
        <p><GuideText messageKey="guides.igcse.variables.text" /></p>
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

      <GuideSection titleKey="guides.igcse.selection.title">
        <p>
          <GuideText
            messageKey="guides.igcse.selection.text"
            values={{
              endif: <code>ENDIF</code>,
              next: <code>NEXT</code>,
              endwhile: <code>ENDWHILE</code>,
              until: <code>UNTIL</code>,
            }}
          />
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

      <GuideSection titleKey="guides.igcse.subroutines.title">
        <p><GuideText messageKey="guides.igcse.subroutines.text" /></p>
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

      <GuideSection titleKey="guides.igcse.files.title">
        <p><GuideText messageKey="guides.igcse.files.text" /></p>
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

      <GuideSection titleKey="guides.igcse.continue.title">
        <p><GuideText messageKey="guides.igcse.continue.text" /></p>
        <div className="flex flex-wrap gap-4">
          <Link className="font-semibold text-[#8ED0FF] hover:text-white" href="/">
            <GuideText messageKey="guides.igcse.openEditor" />
          </Link>
          <Link
            className="font-semibold text-[#8ED0FF] hover:text-white"
            href="/guides/alevel-9618/"
          >
            <GuideText messageKey="guides.igcse.compare" />
          </Link>
        </div>
      </GuideSection>
    </GuideShell>
  );
}
