import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default('0.0.0.0'),
  ANALYZER_URL: z.string().url().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  ADMIN_TOKEN: z.string().min(16).optional(),
  STORAGE_ROOT: z.string().default('/storage'),
  FILE_URL_TTL_SECONDS: z.coerce.number().int().positive().default(600),
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(52_428_800), // 50 MB
});

export type Env = z.infer<typeof EnvSchema>;

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error(
    'Invalid environment variables:',
    JSON.stringify(parsed.error.flatten().fieldErrors, null, 2),
  );
  process.exit(1);
}

export const env: Env = parsed.data;
