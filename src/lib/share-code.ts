import type { Syllabus } from '@/features/pseudocode-ide/types';

const SHARE_PREFIX = '#share=v1.';
const MAX_SHARED_CODE_LENGTH = 200_000;

type SharedCode = {
  code: string;
  syllabus: Syllabus;
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

async function decompress(bytes: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('Compressed share links are not supported by this browser.');
  }
  const buffer = new Uint8Array(bytes).buffer;
  const stream = new Blob([buffer]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
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
  const bytes = format === 'g' ? await decompress(sourceBytes) : sourceBytes;
  const code = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  if (code.length > MAX_SHARED_CODE_LENGTH) throw new Error('Shared code is too large.');

  return {
    code,
    syllabus: syllabusCode === 'a' ? 'alevel-9618' : 'igcse-0478',
  };
}
