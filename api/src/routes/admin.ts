import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { env } from '../config.js';

const CreateCompanyBody = z.object({
  name: z.string().min(1).max(120),
});

const CreateTeamBody = z.object({
  name: z.string().min(1).max(120),
  companyId: z.string().uuid(),
});

const AddMemberBody = z.object({
  userId: z.string().uuid(),
});

async function adminGuard(request: FastifyRequest, reply: FastifyReply) {
  if (!env.ADMIN_TOKEN) {
    return reply.code(403).send({ error: 'AdminTokenNotConfigured' });
  }
  const header = request.headers['x-admin-token'];
  const provided = Array.isArray(header) ? header[0] : header;
  if (provided !== env.ADMIN_TOKEN) {
    return reply.code(401).send({ error: 'InvalidAdminToken' });
  }
}

export default async function adminRoutes(app: FastifyInstance) {
  app.addHook('preHandler', adminGuard);

  app.post('/companies', async (request, reply) => {
    const body = CreateCompanyBody.parse(request.body);
    const existing = await app.prisma.company.findUnique({
      where: { name: body.name },
      select: { id: true },
    });
    if (existing) {
      return reply.code(409).send({ error: 'CompanyNameTaken' });
    }
    const company = await app.prisma.company.create({ data: { name: body.name } });
    return reply.code(201).send({
      id: company.id,
      name: company.name,
      created_at: company.createdAt.toISOString(),
    });
  });

  app.post('/teams', async (request, reply) => {
    const body = CreateTeamBody.parse(request.body);

    const company = await app.prisma.company.findUnique({
      where: { id: body.companyId },
      select: { id: true },
    });
    if (!company) {
      return reply.code(404).send({ error: 'CompanyNotFound' });
    }

    const duplicate = await app.prisma.team.findUnique({
      where: { companyId_name: { companyId: body.companyId, name: body.name } },
      select: { id: true },
    });
    if (duplicate) {
      return reply.code(409).send({ error: 'TeamNameTakenInCompany' });
    }

    const team = await app.prisma.team.create({
      data: { name: body.name, companyId: body.companyId },
    });
    return reply.code(201).send({
      id: team.id,
      name: team.name,
      company_id: team.companyId,
      created_at: team.createdAt.toISOString(),
    });
  });

  app.post<{ Params: { id: string } }>(
    '/teams/:id/members',
    async (request, reply) => {
      const teamIdParse = z.string().uuid().safeParse(request.params.id);
      if (!teamIdParse.success) {
        return reply.code(400).send({ error: 'InvalidTeamId' });
      }
      const teamId = teamIdParse.data;
      const body = AddMemberBody.parse(request.body);

      const team = await app.prisma.team.findUnique({
        where: { id: teamId },
        select: { id: true, companyId: true },
      });
      if (!team) return reply.code(404).send({ error: 'TeamNotFound' });

      const user = await app.prisma.user.findUnique({
        where: { id: body.userId },
        select: { id: true, companyId: true },
      });
      if (!user) return reply.code(404).send({ error: 'UserNotFound' });

      if (user.companyId !== team.companyId) {
        return reply.code(400).send({ error: 'UserOutsideTeamCompany' });
      }

      await app.prisma.userTeam.upsert({
        where: { userId_teamId: { userId: user.id, teamId: team.id } },
        create: { userId: user.id, teamId: team.id },
        update: {},
      });

      return reply.code(201).send({
        team_id: team.id,
        user_id: user.id,
        status: 'member',
      });
    },
  );
}
