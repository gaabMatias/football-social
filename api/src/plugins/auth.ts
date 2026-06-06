import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { env } from '../config.js';

export interface JwtPayload {
  sub: string;
  email: string;
  companyId: string;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    signUserToken: (payload: JwtPayload) => string;
  }
  interface FastifyRequest {
    currentUser: JwtPayload;
  }
}

export default fp(
  async (app: FastifyInstance) => {
    await app.register(fastifyJwt, {
      secret: env.JWT_SECRET,
      sign: { expiresIn: env.JWT_EXPIRES_IN },
    });

    app.decorate(
      'authenticate',
      async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          await request.jwtVerify();
          request.currentUser = {
            sub: request.user.sub,
            email: request.user.email,
            companyId: request.user.companyId,
          };
        } catch {
          return reply.code(401).send({ error: 'Unauthorized' });
        }
      },
    );

    app.decorate('signUserToken', (payload: JwtPayload) => {
      return app.jwt.sign(payload);
    });
  },
  { name: 'auth' },
);
