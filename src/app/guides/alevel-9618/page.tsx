import type { Metadata } from 'next';
import Link from 'next/link';
import {
  CodeExample,
  GuideSection,
  GuideShell,
  GuideText,
} from '@/components/GuideShell';

export const metadata: Metadata = {
  title: 'A Level 9618 Pseudocode Guide',
  description:
    'Cambridge A Level Computer Science 9618 pseudocode guide with strict syntax examples for arrays, records, functions, classes, pointers, sets, and file handling.',
  alternates: {
    canonical: '/guides/alevel-9618/',
  },
  openGraph: {
    title: 'Cambridge A Level 9618 Pseudocode Guide',
    description:
      'Learn strict A Level 9618 pseudocode syntax with runnable examples.',
    url: '/guides/alevel-9618/',
    siteName: 'Pseudocode Editor',
    type: 'article',
    images: ['/opengraph-image'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cambridge A Level 9618 Pseudocode Guide',
    description:
      'Learn strict A Level 9618 pseudocode syntax with runnable examples.',
    images: ['/opengraph-image'],
  },
};

export default function ALevelGuidePage() {
  return (
    <GuideShell
      eyebrowKey="guides.alevel.eyebrow"
      titleKey="guides.alevel.title"
      descriptionKey="guides.alevel.description"
      path="/guides/alevel-9618/"
    >
      <GuideSection titleKey="guides.alevel.constants.title">
        <p>
          <GuideText
            messageKey="guides.alevel.constants.text"
            values={{ equals: <code>=</code> }}
          />
        </p>
        <CodeExample>{`
TYPE StudentRecord
   DECLARE StudentID : STRING
   DECLARE Score : INTEGER
ENDTYPE

CONSTANT MaxStudents = 100
DECLARE Students : ARRAY[1:MaxStudents] OF StudentRecord

Students[1].StudentID <- "S001"
Students[1].Score <- 84
        `}</CodeExample>
      </GuideSection>

      <GuideSection titleKey="guides.alevel.parameters.title">
        <p>
          <GuideText
            messageKey="guides.alevel.parameters.text"
            values={{ byref: <code>BYREF</code> }}
          />
        </p>
        <CodeExample>{`
CONSTANT MaxItems = 10

PROCEDURE ClearScores(
   BYREF Scores : ARRAY[1:MaxItems] OF INTEGER
)
   DECLARE Index : INTEGER
   FOR Index <- 1 TO MaxItems
      Scores[Index] <- 0
   NEXT Index
ENDPROCEDURE
        `}</CodeExample>
      </GuideSection>

      <GuideSection titleKey="guides.alevel.functions.title">
        <p>
          <GuideText
            messageKey="guides.alevel.functions.text"
            values={{ boolean: <code>BOOLEAN</code> }}
          />
        </p>
        <CodeExample>{`
FUNCTION CalculateGrade(Score : INTEGER) RETURNS CHAR
   IF Score >= 80 THEN
      RETURN 'A'
   ELSE
      RETURN 'F'
   ENDIF
ENDFUNCTION

OUTPUT CalculateGrade(86)
        `}</CodeExample>
      </GuideSection>

      <GuideSection titleKey="guides.alevel.files.title">
        <p>
          <GuideText
            messageKey="guides.alevel.files.text"
            values={{
              seek: <code>SEEK</code>,
              getrecord: <code>GETRECORD</code>,
              putrecord: <code>PUTRECORD</code>,
            }}
          />
        </p>
        <CodeExample>{`
DECLARE Student : StudentRecord
OPENFILE "students.dat" FOR RANDOM
SEEK "students.dat", 1
GETRECORD "students.dat", Student
CLOSEFILE "students.dat"
OUTPUT Student.StudentID
        `}</CodeExample>
      </GuideSection>

      <GuideSection titleKey="guides.alevel.differences.title">
        <ul className="list-disc space-y-2 pl-6">
          <li><GuideText messageKey="guides.alevel.differences.constant" values={{ syntax: <code>CONSTANT name = value</code> }} /></li>
          <li><GuideText messageKey="guides.alevel.differences.while" values={{ whileKeyword: <code>WHILE</code>, doKeyword: <code>DO</code> }} /></li>
          <li><GuideText messageKey="guides.alevel.differences.call" values={{ call: <code>CALL</code> }} /></li>
          <li><GuideText messageKey="guides.alevel.differences.divMod" values={{ div: <code>DIV</code>, mod: <code>MOD</code> }} /></li>
          <li><GuideText messageKey="guides.alevel.differences.strings" values={{ mid: <code>MID</code>, left: <code>LEFT</code>, right: <code>RIGHT</code> }} /></li>
        </ul>
        <div className="flex flex-wrap gap-4">
          <Link className="font-semibold text-[#8ED0FF] hover:text-white" href="/">
            <GuideText messageKey="guides.alevel.openEditor" />
          </Link>
          <Link
            className="font-semibold text-[#8ED0FF] hover:text-white"
            href="/guides/igcse-0478/"
          >
            <GuideText messageKey="guides.alevel.readIgcse" />
          </Link>
        </div>
      </GuideSection>
    </GuideShell>
  );
}
