import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 12;

const RegisterBody = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(120),
  companyId: z.string().uuid(),
  teamIds: z.array(z.string().uuid()).default([]),
});

const LoginBody = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1).max(128),
});

export default async function authRoutes(app: FastifyInstance) {
  app.post('/register', async (request, reply) => {
    const body = RegisterBody.parse(request.body);

    const company = await app.prisma.company.findUnique({
      where: { id: body.companyId },
    });
    if (!company) {
      return reply.code(404).send({ error: 'CompanyNotFound' });
    }

    if (body.teamIds.length > 0) {
      const teams = await app.prisma.team.findMany({
        where: { id: { in: body.teamIds } },
        select: { id: true, companyId: true },
      });
      if (teams.length !== body.teamIds.length) {
        return reply.code(400).send({ error: 'UnknownTeamId' });
      }
      const wrongCompany = teams.find((t) => t.companyId !== body.companyId);
      if (wrongCompany) {
        return reply
          .code(400)
          .send({ error: 'TeamOutsideCompany', teamId: wrongCompany.id });
      }
    }

    const existing = await app.prisma.user.findUnique({
      where: { email: body.email },
      select: { id: true },
    });
    if (existing) {
      return reply.code(409).send({ error: 'EmailAlreadyRegistered' });
    }

    const passwordHash = await bcrypt.hash(body.password, BCRYPT_ROUNDS);

    const user = await app.prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        name: body.name,
        companyId: body.companyId,
        teams: {
          create: body.teamIds.map((teamId) => ({ teamId })),
        },
      },
      include: {
        teams: { include: { team: true } },
      },
    });

    const token = app.signUserToken({
      sub: user.id,
      email: user.email,
      companyId: user.companyId,
    });

    return reply.code(201).send({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        companyId: user.companyId,
        teams: user.teams.map((ut) => ({ id: ut.team.id, name: ut.team.name })),
      },
    });
  });

  app.post('/login', async (request, reply) => {
    const body = LoginBody.parse(request.body);

    const user = await app.prisma.user.findUnique({
      where: { email: body.email },
    });
    if (!user) {
      return reply.code(401).send({ error: 'InvalidCredentials' });
    }

    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) {
      return reply.code(401).send({ error: 'InvalidCredentials' });
    }

    const token = app.signUserToken({
      sub: user.id,
      email: user.email,
      companyId: user.companyId,
    });

    return { token, user: { id: user.id, email: user.email, name: user.name } };
  });

  app.get(
    '/me',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const user = await app.prisma.user.findUnique({
        where: { id: request.currentUser.sub },
        include: {
          company: { select: { id: true, name: true } },
          teams: { include: { team: { select: { id: true, name: true } } } },
        },
      });

      if (!user) {
        return reply.code(404).send({ error: 'UserNotFound' });
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        company: user.company,
        teams: user.teams.map((ut) => ut.team),
        createdAt: user.createdAt.toISOString(),
      };
    },
  );
}
