import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { env } from '../config.js';
import { LocalFsAdapter } from '../storage/local.js';
import type { StorageAdapter } from '../storage/types.js';

declare module 'fastify' {
  interface FastifyInstance {
    storage: StorageAdapter;
  }
}

export default fp(
  async (app: FastifyInstance) => {
    const adapter = new LocalFsAdapter(env.STORAGE_ROOT);
    app.decorate('storage', adapter);
    app.log.info({ root: env.STORAGE_ROOT }, 'storage adapter ready (local-fs)');
  },
  { name: 'storage' },
);
