import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, stat, unlink, access } from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import type { Readable } from 'node:stream';
import type { StorageAdapter, StoragePutResult } from './types.js';

export class LocalFsAdapter implements StorageAdapter {
  constructor(private readonly root: string) {}

  private resolve(key: string): string {
    const full = path.resolve(this.root, key);
    if (!full.startsWith(path.resolve(this.root) + path.sep)) {
      throw new Error('storage: key escapes root');
    }
    return full;
  }

  async put(key: string, data: Readable): Promise<StoragePutResult> {
    const full = this.resolve(key);
    await mkdir(path.dirname(full), { recursive: true });
    await pipeline(data, createWriteStream(full));
    const s = await stat(full);
    return { size: s.size };
  }

  async getStream(key: string): Promise<Readable> {
    const full = this.resolve(key);
    await access(full);
    return createReadStream(full);
  }

  async delete(key: string): Promise<void> {
    await unlink(this.resolve(key)).catch((err: NodeJS.ErrnoException) => {
      if (err.code !== 'ENOENT') throw err;
    });
  }

  async exists(key: string): Promise<boolean> {
    try {
      await access(this.resolve(key));
      return true;
    } catch {
      return false;
    }
  }
}
