import type { PseudocodeErrorCode } from './en';

export type DiagnosticExplanation = {
  reason: string;
  fix: string;
};

export const diagnosticExplanationsEn: Record<PseudocodeErrorCode, DiagnosticExplanation> = {
  'syntax.expected': {
    reason: 'The parser reached a token that cannot appear at this position in the required statement pattern.',
    fix: 'Compare the whole statement with the syllabus form and add, remove, or move the reported token.',
  },
  'syntax.unexpectedAssignment': {
    reason: 'An assignment must store a value in a variable, array element, record field, or other assignable target.',
    fix: 'Place a declared assignable target on the left of <-, for example Total <- 0.',
  },
  'syntax.unexpectedEnd': {
    reason: 'A declaration or control structure was opened but its required closing syntax was not found.',
    fix: 'Check matching ENDIF, NEXT, ENDWHILE, UNTIL, ENDPROCEDURE, ENDFUNCTION, ENDTYPE, or ENDCLASS keywords.',
  },
  'syntax.unexpectedToken': {
    reason: 'The reported token is not valid in the current expression or statement.',
    fix: 'Check punctuation, operators, and the order of keywords around the reported line.',
  },
  'syntax.unexpectedCharacter': {
    reason: 'The character is not part of the selected Cambridge pseudocode grammar.',
    fix: 'Replace typographic punctuation or a language-specific symbol with the syllabus spelling.',
  },
  'syntax.invalidLiteral': {
    reason: 'The literal does not match the required number, string, character, Boolean, or date format.',
    fix: 'Use the exact literal format for its declared data type.',
  },
  'syntax.invalidType': {
    reason: 'The named data type is unavailable or is not valid in this declaration context.',
    fix: 'Use a built-in type or a previously declared user-defined type supported by the selected syllabus.',
  },
  'syntax.unsupported': {
    reason: 'The construct belongs to another pseudocode dialect or syllabus mode.',
    fix: 'Use the replacement shown in the error and check that the selected syllabus matches the question.',
  },
  'syntax.outputExpression': {
    reason: 'OUTPUT must be followed by at least one value or expression.',
    fix: 'Add the value to display, for example OUTPUT "Result: ", Result.',
  },
  'syntax.returnOutsideFunction': {
    reason: 'RETURN produces a function result and is therefore invalid in the main program or a procedure.',
    fix: 'Move RETURN into a FUNCTION, or use OUTPUT/assignment when no function result is required.',
  },
  'syntax.returnFollower': {
    reason: 'The token immediately after RETURN cannot begin a valid return expression.',
    fix: 'Return one valid expression and end the statement before the next keyword.',
  },
  'syntax.arrayBound': {
    reason: 'Array bounds must be valid integer ranges known when the array is declared.',
    fix: 'Use integer literals or permitted previously declared integer constants, with the lower bound not above the upper bound.',
  },
  'syntax.structure': {
    reason: 'A loop, branch, function, or procedure does not follow the required opening and closing structure.',
    fix: 'Check the complete structure, including parentheses, THEN, NEXT variables, and syllabus-specific WHILE syntax.',
  },
  'syntax.generic': {
    reason: 'The statement cannot be parsed according to the selected syllabus grammar.',
    fix: 'Check the reported line and the preceding open structure against the relevant guide.',
  },
  'runtime.aborted': {
    reason: 'Execution was manually stopped before the program completed.',
    fix: 'Run again after checking long loops or pending INPUT statements.',
  },
  'runtime.divisionByZero': {
    reason: 'Division and MOD/DIV operations cannot use zero as the divisor.',
    fix: 'Validate the divisor before the operation and handle the zero case explicitly.',
  },
  'runtime.iterationLimit': {
    reason: 'The loop exceeded the safety limit, usually because its condition never becomes false.',
    fix: 'Trace the variables used by the condition and ensure every path moves the loop toward termination.',
  },
  'runtime.callDepth': {
    reason: 'Recursive calls exceeded the safety limit because no reachable base case stopped them.',
    fix: 'Add or correct the base case and ensure each recursive call moves toward it.',
  },
  'runtime.undefined': {
    reason: 'The identifier is used outside its scope or before it has been declared.',
    fix: 'Declare it in the correct scope and check spelling; identifiers are case-insensitive.',
  },
  'runtime.alreadyDeclared': {
    reason: 'Two declarations in the same scope use the same case-insensitive identifier.',
    fix: 'Remove the duplicate declaration or give one item a distinct name.',
  },
  'runtime.constantReassignment': {
    reason: 'A CONSTANT is fixed after declaration and cannot appear as an assignment target.',
    fix: 'Use a variable if the value needs to change.',
  },
  'runtime.assignmentTypeMismatch': {
    reason: 'The expression type does not match the declared type of the assignment target.',
    fix: 'Use a value of the declared type or an explicit supported conversion function.',
  },
  'runtime.typeMismatch': {
    reason: 'An operator, comparison, assignment, or return combines incompatible data types.',
    fix: 'Check the declared type of every operand and convert values explicitly where the syllabus permits it.',
  },
  'runtime.conversion': {
    reason: 'The source value cannot be represented by the requested target type.',
    fix: 'Validate the input format before converting it.',
  },
  'runtime.array': {
    reason: 'The array dimensions, bounds, index type, or element type do not match the operation.',
    fix: 'Check every index against the declared inclusive bounds and use the declared element type.',
  },
  'runtime.file': {
    reason: 'The file operation conflicts with the file mode, position, record type, or open state.',
    fix: 'Open the file in the required mode, perform valid operations, and close it when finished.',
  },
  'runtime.callable': {
    reason: 'A function or procedure is declared or called using the wrong form.',
    fix: 'Use CALL for procedures where required, use functions in expressions, and match the declaration syntax.',
  },
  'runtime.argument': {
    reason: 'The number, type, or BYREF requirements of arguments do not match the parameter list.',
    fix: 'Pass one compatible argument per parameter; BYREF arguments must be assignable variables of the required type.',
  },
  'runtime.pointer': {
    reason: 'The pointer is unset, has an incompatible pointed-to type, or is used with the wrong operator.',
    fix: 'Assign a valid address of the declared pointee type before dereferencing it.',
  },
  'runtime.record': {
    reason: 'The record type, field name, or assigned field value is incompatible with the declaration.',
    fix: 'Use an existing field and a value matching that field’s declared type.',
  },
  'runtime.class': {
    reason: 'The class operation violates constructor, inheritance, visibility, or method rules.',
    fix: 'Check NEW, SUPER, member visibility, method parameters, and the declared class hierarchy.',
  },
  'runtime.condition': {
    reason: 'A condition or CASE value has an invalid or incompatible type.',
    fix: 'Use BOOLEAN expressions for conditions and type-compatible values for CASE branches.',
  },
  'runtime.loop': {
    reason: 'The FOR control variable, limits, or STEP value does not satisfy loop rules.',
    fix: 'Use a declared INTEGER control variable, integer limits, and a non-zero STEP.',
  },
  'runtime.generic': {
    reason: 'Execution reached an operation that is invalid for the current program state.',
    fix: 'Inspect the reported line, current variable values, and the relevant syllabus rule.',
  },
};
