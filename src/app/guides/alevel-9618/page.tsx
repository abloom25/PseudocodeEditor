import type { Metadata } from 'next';
import Link from 'next/link';
import {
  CodeExample,
  GuideSection,
  GuideShell,
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
      eyebrow="A Level Computer Science 9618"
      title="Cambridge A Level 9618 pseudocode guide"
      description="A strict syntax reference for the A-Level mode of the editor, including user-defined types, array parameters, subroutines, and file access."
      path="/guides/alevel-9618/"
    >
      <GuideSection title="Constants, records, and arrays">
        <p>
          A-Level constants use <code>=</code>. A previously declared integer
          constant can be used as an array bound.
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

      <GuideSection title="Array parameters and BYREF">
        <p>
          Use <code>BYREF</code> when a procedure must update the caller&apos;s
          variable or array.
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

      <GuideSection title="Functions and strict typing">
        <p>
          Functions declare a return type and must return a compatible value.
          Conditions must evaluate to <code>BOOLEAN</code>.
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

      <GuideSection title="Text and random files">
        <p>
          Text files support sequential reading and writing. Random files use
          records with <code>SEEK</code>, <code>GETRECORD</code>, and
          <code>PUTRECORD</code>.
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

      <GuideSection title="Important differences from IGCSE mode">
        <ul className="list-disc space-y-2 pl-6">
          <li>Constants use <code>CONSTANT name = value</code>.</li>
          <li><code>WHILE</code> does not use the <code>DO</code> keyword.</li>
          <li>Procedure calls require <code>CALL</code>.</li>
          <li><code>DIV</code> and <code>MOD</code> are infix operators.</li>
          <li>A-Level string functions include <code>MID</code>, <code>LEFT</code>, and <code>RIGHT</code>.</li>
        </ul>
        <div className="flex flex-wrap gap-4">
          <Link className="font-semibold text-[#8ED0FF] hover:text-white" href="/">
            Open the editor
          </Link>
          <Link
            className="font-semibold text-[#8ED0FF] hover:text-white"
            href="/guides/igcse-0478/"
          >
            Read the IGCSE 0478 guide
          </Link>
        </div>
      </GuideSection>
    </GuideShell>
  );
}
