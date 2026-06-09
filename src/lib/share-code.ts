import type { Syllabus } from '@/features/pseudocode-ide/types';

const SHARE_PREFIX = '#share=v1.';
const EXERCISE_PREFIX = '#exercise=v1.';
const MAX_SHARED_CODE_LENGTH = 200_000;
const MAX_EXERCISE_TITLE_LENGTH = 120;
const MAX_EXERCISE_DESCRIPTION_LENGTH = 10_000;
const MAX_ENCODED_PAYLOAD_BYTES = 1_000_000;
const MAX_DECODED_SHARE_BYTES = 800_000;
const MAX_DECODED_EXERCISE_BYTES = 1_200_000;
const MAX_EXERCISE_FILES = 20;
const MAX_EXERCISE_FILE_NAME_LENGTH = 100;
const MAX_EXERCISE_FILE_CONTENT_LENGTH = 200_000;

type SharedCode = {
  code: string;
  syllabus: Syllabus;
};

export type ExercisePayload = {
  title: string;
  description: string;
  syllabus: Syllabus;
  starterCode: string;
  initialFiles: Record<string, string[]>;
  lockSyllabus: boolean;
};

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/g, '');
}

function base64UrlToBytes(value: string): Uint8Array {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function compress(bytes: Uint8Array): Promise<Uint8Array | null> {
  if (typeof CompressionStream === 'undefined') return null;
  const buffer = new Uint8Array(bytes).buffer;
  const stream = new Blob([buffer]).stream().pipeThrough(new CompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function decompress(
  bytes: Uint8Array,
  maxOutputBytes: number,
): Promise<Uint8Array> {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('Compressed share links are not supported by this browser.');
  }
  const buffer = new Uint8Array(bytes).buffer;
  const stream = new Blob([buffer]).stream().pipeThrough(new DecompressionStream('gzip'));
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxOutputBytes) {
      await reader.cancel();
      throw new Error('Decoded link is too large.');
    }
    chunks.push(value);
  }

  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

export async function createShareHash({
  code,
  syllabus,
}: SharedCode): Promise<string> {
  if (code.length > MAX_SHARED_CODE_LENGTH) {
    throw new Error('Shared code is too large.');
  }

  const encoded = new TextEncoder().encode(code);
  const compressed = await compress(encoded);
  const format = compressed && compressed.length < encoded.length ? 'g' : 'u';
  const payload = bytesToBase64Url(format === 'g' ? compressed! : encoded);
  const syllabusCode = syllabus === 'alevel-9618' ? 'a' : 'i';
  return `${SHARE_PREFIX}${syllabusCode}.${format}.${payload}`;
}

export async function readShareHash(hash: string): Promise<SharedCode | null> {
  if (!hash.startsWith(SHARE_PREFIX)) return null;

  const [syllabusCode, format, payload] = hash.slice(SHARE_PREFIX.length).split('.');
  if (!payload || !['a', 'i'].includes(syllabusCode) || !['g', 'u'].includes(format)) {
    throw new Error('Invalid share link.');
  }

  const sourceBytes = base64UrlToBytes(payload);
  if (sourceBytes.byteLength > MAX_ENCODED_PAYLOAD_BYTES) {
    throw new Error('Share link is too large.');
  }
  const bytes =
    format === 'g'
      ? await decompress(sourceBytes, MAX_DECODED_SHARE_BYTES)
      : sourceBytes;
  if (bytes.byteLength > MAX_DECODED_SHARE_BYTES) {
    throw new Error('Share link is too large.');
  }
  const code = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  if (code.length > MAX_SHARED_CODE_LENGTH) throw new Error('Shared code is too large.');

  return {
    code,
    syllabus: syllabusCode === 'a' ? 'alevel-9618' : 'igcse-0478',
  };
}

function validateExercise(exercise: ExercisePayload): ExercisePayload {
  if (
    !exercise ||
    typeof exercise.title !== 'string' ||
    typeof exercise.description !== 'string' ||
    typeof exercise.starterCode !== 'string' ||
    !exercise.initialFiles ||
    typeof exercise.initialFiles !== 'object' ||
    Array.isArray(exercise.initialFiles) ||
    typeof exercise.lockSyllabus !== 'boolean' ||
    !['igcse-0478', 'alevel-9618'].includes(exercise.syllabus)
  ) {
    throw new Error('Invalid exercise link.');
  }

  const title = exercise.title.trim();
  if (!title || title.length > MAX_EXERCISE_TITLE_LENGTH) {
    throw new Error('Invalid exercise title.');
  }
  if (exercise.description.length > MAX_EXERCISE_DESCRIPTION_LENGTH) {
    throw new Error('Exercise description is too large.');
  }
  if (exercise.starterCode.length > MAX_SHARED_CODE_LENGTH) {
    throw new Error('Exercise starter code is too large.');
  }

  const entries = Object.entries(exercise.initialFiles);
  if (entries.length > MAX_EXERCISE_FILES) {
    throw new Error('Exercise contains too many files.');
  }

  const initialFiles: Record<string, string[]> = {};
  for (const [name, lines] of entries) {
    if (
      !name ||
      name.length > MAX_EXERCISE_FILE_NAME_LENGTH ||
      name === '__proto__' ||
      name === 'prototype' ||
      name === 'constructor' ||
      /[\\/\0]/.test(name) ||
      !Array.isArray(lines) ||
      !lines.every((line) => typeof line === 'string')
    ) {
      throw new Error('Exercise contains an invalid file.');
    }
    if (lines.join('\n').length > MAX_EXERCISE_FILE_CONTENT_LENGTH) {
      throw new Error('Exercise file is too large.');
    }
    initialFiles[name] = [...lines];
  }

  return { ...exercise, title, initialFiles };
}

export async function createExerciseHash(
  exercise: ExercisePayload,
): Promise<string> {
  const validated = validateExercise(exercise);
  const encoded = new TextEncoder().encode(JSON.stringify(validated));
  const compressed = await compress(encoded);
  const format = compressed && compressed.length < encoded.length ? 'g' : 'u';
  const payload = bytesToBase64Url(format === 'g' ? compressed! : encoded);
  return `${EXERCISE_PREFIX}${format}.${payload}`;
}

export async function readExerciseHash(
  hash: string,
): Promise<ExercisePayload | null> {
  if (!hash.startsWith(EXERCISE_PREFIX)) return null;

  const [format, payload] = hash.slice(EXERCISE_PREFIX.length).split('.');
  if (!payload || !['g', 'u'].includes(format)) {
    throw new Error('Invalid exercise link.');
  }

  const sourceBytes = base64UrlToBytes(payload);
  if (sourceBytes.byteLength > MAX_ENCODED_PAYLOAD_BYTES) {
    throw new Error('Exercise link is too large.');
  }
  const bytes =
    format === 'g'
      ? await decompress(sourceBytes, MAX_DECODED_EXERCISE_BYTES)
      : sourceBytes;
  if (bytes.byteLength > MAX_DECODED_EXERCISE_BYTES) {
    throw new Error('Exercise link is too large.');
  }
  const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  return validateExercise(JSON.parse(decoded) as ExercisePayload);
}

export function getPageUrlWithoutHash(): string {
  if (typeof window === 'undefined') return 'N/A';
  return `${window.location.origin}${window.location.pathname}${window.location.search}`;
}
