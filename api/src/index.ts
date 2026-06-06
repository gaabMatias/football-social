import Fastify from 'fastify';
import corsPlugin from '@fastify/cors';
import multipartPlugin from '@fastify/multipart';
import { env } from './config.js';
import dbPlugin from './plugins/db.js';
import authPlugin from './plugins/auth.js';
import storagePlugin from './plugins/storage.js';
import authRoutes from './routes/auth.js';
import analysesRoutes from './routes/analyses.js';
import adminRoutes from './routes/admin.js';
import { AccessError } from './middleware/access.js';

export async function buildApp() {
  const app = Fastify({
    logger: { level: env.LOG_LEVEL },
    disableRequestLogging: env.NODE_ENV === 'test',
  });

  await app.register(corsPlugin, { origin: true, credentials: true });
  await app.register(multipartPlugin, {
    limits: {
      fileSize: env.MAX_UPLOAD_BYTES,
      files: 1,
      fields: 20,
    },
  });
  await app.register(dbPlugin);
  await app.register(authPlugin);
  await app.register(storagePlugin);

  app.get('/health', async () => ({
    status: 'ok',
    service: 'social',
    time: new Date().toISOString(),
  }));

  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(analysesRoutes);
  await app.register(adminRoutes, { prefix: '/admin' });

  app.setErrorHandler((err, request, reply) => {
    if ((err as { code?: string }).code === 'FST_ERR_VALIDATION' || err.validation) {
      return reply.code(400).send({ error: 'ValidationError', details: err.validation });
    }
    if (err.name === 'ZodError') {
      return reply
        .code(400)
        .send({ error: 'ValidationError', details: (err as unknown as { issues: unknown }).issues });
    }
    if (err.name === 'AccessError') {
      const ae = err as unknown as AccessError;
      return reply.code(ae.statusCode).send({ error: ae.code });
    }
    request.log.error({ err }, 'request failed');
    const status = err.statusCode ?? 500;
    reply.code(status).send({
      error: err.name || 'InternalServerError',
      message: status >= 500 ? 'Internal server error' : err.message,
    });
  });

  return app;
}

async function main() {
  const app = await buildApp();

  try {
    await app.listen({ host: env.HOST, port: env.PORT });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  const shutdown = async (signal: string) => {
    app.log.info({ signal }, 'shutdown requested');
    await app.close();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('fatal:', err);
  process.exit(1);
});
