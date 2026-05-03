import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

export interface Source {
  name: string;
  url: string;
  file: string;
  encoding: 'utf-8' | 'windows-1252';
}

export async function loadSource(
  src: Source,
  cacheDir: string,
): Promise<string> {
  await mkdir(cacheDir, { recursive: true });
  const cachePath = path.join(cacheDir, src.file);
  try {
    await stat(cachePath);
    console.log(`[${src.name}] cache hit`);
  } catch {
    console.log(`[${src.name}] downloading…`);
    const res = await fetch(src.url);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${src.url}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const text = new TextDecoder(src.encoding, { fatal: false }).decode(buf);
    await writeFile(cachePath, text, 'utf-8');
  }
  return readFile(cachePath, 'utf-8');
}
