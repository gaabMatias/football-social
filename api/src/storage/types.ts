import type { Readable } from 'node:stream';

export interface StoragePutResult {
  /** Bytes actually written. */
  size: number;
}

export interface StorageAdapter {
  /** Stream `data` to `key`. Resolves once the write is fully flushed. */
  put(key: string, data: Readable): Promise<StoragePutResult>;
  /** Returns a readable stream for `key`. Throws if missing. */
  getStream(key: string): Promise<Readable>;
  /** Hard-removes `key`. Soft-delete is the caller's responsibility. */
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}
