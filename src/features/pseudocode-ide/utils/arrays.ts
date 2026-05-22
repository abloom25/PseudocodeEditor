import type { ArrayData } from '../types';

export function convertArraysData(
  rawArrays: Record<string, { dims: { lower: number; upper: number }[]; data: unknown[] }>,
  variableTypes: Record<string, string>
): Record<string, ArrayData> {
  const result: Record<string, ArrayData> = {};
  for (const [name, arr] of Object.entries(rawArrays)) {
    const bounds = arr.dims.map(d => [d.lower, d.upper]);
    const is2D = arr.dims.length >= 2;
    const typeStr = variableTypes[name] || '';
    const elementType = typeStr.startsWith('ARRAY_OF_') ? typeStr.slice(9) : typeStr;
    const dataObj: Record<string, unknown> = {};

    if (is2D) {
      const rowLower = arr.dims[0].lower;
      const rowUpper = arr.dims[0].upper;
      const colLower = arr.dims[1].lower;
      const colUpper = arr.dims[1].upper;
      let idx = 0;
      for (let r = rowLower; r <= rowUpper; r++) {
        for (let c = colLower; c <= colUpper; c++) {
          dataObj[`${r},${c}`] = arr.data[idx];
          idx++;
        }
      }
    } else {
      const lower = arr.dims[0].lower;
      for (let i = 0; i < arr.data.length; i++) {
        dataObj[`${lower + i}`] = arr.data[i];
      }
    }
    result[name] = { bounds, is2D, elementType, data: dataObj };
  }
  return result;
}
