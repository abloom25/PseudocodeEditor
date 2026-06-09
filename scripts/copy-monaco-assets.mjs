import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const source = join(root, 'node_modules', 'monaco-editor', 'min', 'vs');
const destinationRoot = join(root, 'public', 'monaco');
const destination = join(destinationRoot, 'vs');

await mkdir(destinationRoot, { recursive: true });
await rm(destination, { recursive: true, force: true });
await cp(source, destination, { recursive: true });
