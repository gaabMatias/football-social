import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { Prisma, FileKind } from '@prisma/client';
import path from 'node:path';
import { z } from 'zod';
import { env } from '../config.js';
import { requireAnalysisAccess, requireAnalysisOwner, AccessError } from '../middleware/access.js';

const PatchAccessBody = z.object({
  team_access: z.array(z.string().uuid()),
});

const FeedQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  tag: z.string().min(1).max(40).optional(),
  author_id: z.string().uuid().optional(),
  team_id: z.string().uuid().optional(),
});

type FeedCursor = { createdAt: string; id: string };

function encodeCursor(c: FeedCursor): string {
  return Buffer.from(JSON.stringify(c), 'utf8').toString('base64url');
}

function decodeCursor(s: string): FeedCursor | null {
  try {
    const parsed = JSON.parse(Buffer.from(s, 'base64url').toString('utf8'));
    if (
      typeof parsed?.createdAt === 'string' &&
      typeof parsed?.id === 'string' &&
      !Number.isNaN(Date.parse(parsed.createdAt))
    ) {
      return { createdAt: parsed.createdAt, id: parsed.id };
    }
    return null;
  } catch {
    return null;
  }
}

type AnalysisWithRelations = Prisma.AnalysisGetPayload<{
  include: {
    author: { select: { id: true; name: true } };
    teamAccess: { include: { team: { select: { id: true; name: true } } } };
  };
}>;

const KIND_BY_EXT: Record<string, FileKind> = {
  '.xlsx': 'XLSX',
  '.pdf': 'PDF',
};

const KIND_BY_MIME: Record<string, FileKind> = {
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'application/pdf': 'PDF',
};

function extForKind(kind: FileKind): string {
  return kind === 'XLSX' ? '.xlsx' : '.pdf';
}

function buildFileKey(analysisId: string, kind: FileKind): string {
  return `${analysisId}/file${extForKind(kind)}`;
}

interface FileTokenPayload {
  aid: string;
  sub: string;
}

function signFileUrl(
  app: FastifyInstance,
  analysisId: string,
  userId: string,
): string {
  // The fastify-jwt augmentation pins the payload type to JwtPayload, so we
  // cast: this token is purpose-built for file access and is verified
  // independently in the /file handler.
  const payload = { aid: analysisId, sub: userId } satisfies FileTokenPayload;
  const token = app.jwt.sign(payload as unknown as Parameters<typeof app.jwt.sign>[0], {
    expiresIn: env.FILE_URL_TTL_SECONDS,
  });
  return `/analyses/${analysisId}/file?token=${encodeURIComponent(token)}`;
}

function toCard(a: AnalysisWithRelations, fileUrl: string | null) {
  return {
    id: a.id,
    title: a.title,
    description: a.description,
    tags: a.tags,
    author: a.author,
    team_access: a.teamAccess.map((ta) => ta.team),
    file: {
      kind: a.fileKind,
      size: a.fileSize,
      original_filename: a.originalFilename,
      url: fileUrl,
    },
    created_at: a.createdAt.toISOString(),
    updated_at: a.updatedAt.toISOString(),
  };
}

async function assertTeamsInCompany(
  prisma: FastifyInstance['prisma'],
  teamIds: string[],
  companyId: string,
): Promise<void> {
  if (teamIds.length === 0) return;
  const teams = await prisma.team.findMany({
    where: { id: { in: teamIds } },
    select: { id: true, companyId: true },
  });
  if (teams.length !== new Set(teamIds).size) {
    throw new AccessError('NotFound', 'UnknownTeamId');
  }
  const foreign = teams.find((t) => t.companyId !== companyId);
  if (foreign) {
    throw new AccessError('Forbidden', 'TeamOutsideCompany');
  }
}

function detectKind(filename: string, mime: string): FileKind | null {
  const ext = path.extname(filename).toLowerCase();
  const byExt = KIND_BY_EXT[ext];
  const byMime = KIND_BY_MIME[mime];
  if (!byExt) return null;
  // Mime is advisory only — browsers occasionally mislabel xlsx; trust extension
  // as the gate but reject obvious lies (e.g. .pdf with image/jpeg).
  if (byMime && byMime !== byExt) return null;
  return byExt;
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[\r\n\t]/g, ' ')
    .replace(/[\\/]/g, '_')
    .slice(0, 200)
    .trim() || 'analysis';
}

async function loadCard(
  prisma: FastifyInstance['prisma'],
  id: string,
): Promise<AnalysisWithRelations | null> {
  return prisma.analysis.findFirst({
    where: { id, deletedAt: null },
    include: {
      author: { select: { id: true, name: true } },
      teamAccess: { include: { team: { select: { id: true, name: true } } } },
    },
  });
}

export default async function analysesRoutes(app: FastifyInstance) {
  // POST /analyses — multipart upload
  app.post(
    '/analyses',
    { preHandler: app.authenticate },
    async (request, reply) => {
      const { sub: userId, companyId } = request.currentUser;

      if (!request.isMultipart()) {
        return reply.code(400).send({ error: 'ExpectedMultipart' });
      }

      let title: string | undefined;
      let description: string | undefined;
      let tagsRaw: string | undefined;
      const teamAccess: string[] = [];
      let upload:
        | { kind: FileKind; originalFilename: string; tempBuffer: Buffer }
        | null = null;

      // Stream parts. For MVP we buffer the file in memory bounded by
      // MAX_UPLOAD_BYTES — multipart already enforces the limit.
      for await (const part of request.parts()) {
        if (part.type === 'file') {
          const safeName = sanitizeFilename(part.filename);
          const kind = detectKind(safeName, part.mimetype);
          if (!kind) {
            return reply.code(415).send({
              error: 'UnsupportedFileType',
              message: 'Only .xlsx and .pdf are accepted.',
            });
          }
          const chunks: Buffer[] = [];
          for await (const chunk of part.file) chunks.push(chunk as Buffer);
          if (part.file.truncated) {
            return reply.code(413).send({
              error: 'FileTooLarge',
              message: `Maximum file size is ${env.MAX_UPLOAD_BYTES} bytes.`,
            });
          }
          upload = {
            kind,
            originalFilename: safeName,
            tempBuffer: Buffer.concat(chunks),
          };
        } else if (part.type === 'field') {
          switch (part.fieldname) {
            case 'title':
              title = String(part.value);
              break;
            case 'description':
              description = String(part.value);
              break;
            case 'tags':
              tagsRaw = String(part.value);
              break;
            case 'team_access':
              // multipart sends array fields as repeated entries; fastify-multipart
              // exposes each as a separate part — accumulate.
              teamAccess.push(String(part.value));
              break;
          }
        }
      }

      if (!title || title.trim().length === 0 || title.length > 200) {
        return reply.code(400).send({ error: 'InvalidTitle' });
      }
      if (!description || description.trim().length === 0) {
        return reply.code(400).send({ error: 'InvalidDescription' });
      }
      if (!upload) {
        return reply.code(400).send({ error: 'MissingFile' });
      }

      const tags =
        tagsRaw
          ?.split(',')
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 20) ?? [];
      const teamIds = Array.from(new Set(teamAccess));
      if (teamIds.length === 0) {
        return reply.code(400).send({ error: 'TeamAccessRequired' });
      }
      const uuid = z.string().uuid();
      if (teamIds.some((t) => !uuid.safeParse(t).success)) {
        return reply.code(400).send({ error: 'InvalidTeamId' });
      }

      await assertTeamsInCompany(app.prisma, teamIds, companyId);

      const analysis = await app.prisma.analysis.create({
        data: {
          title: title.trim(),
          description: description.trim(),
          tags,
          authorId: userId,
          fileKey: '',
          fileKind: upload.kind,
          fileSize: upload.tempBuffer.byteLength,
          originalFilename: upload.originalFilename,
          teamAccess: { create: teamIds.map((teamId) => ({ teamId })) },
        },
      });

      const fileKey = buildFileKey(analysis.id, upload.kind);
      const { Readable } = await import('node:stream');
      const writeResult = await app.storage.put(
        fileKey,
        Readable.from(upload.tempBuffer),
      );

      const updated = await app.prisma.analysis.update({
        where: { id: analysis.id },
        data: { fileKey, fileSize: writeResult.size },
        include: {
          author: { select: { id: true, name: true } },
          teamAccess: { include: { team: { select: { id: true, name: true } } } },
        },
      });

      return reply
        .code(201)
        .send(toCard(updated, signFileUrl(app, updated.id, userId)));
    },
  );

  // GET /analyses/:id — metadata + signed file URL
  app.get<{ Params: { id: string } }>(
    '/analyses/:id',
    { preHandler: app.authenticate },
    async (request, reply) => {
      const { id } = request.params;
      if (!z.string().uuid().safeParse(id).success) {
        return reply.code(400).send({ error: 'InvalidAnalysisId' });
      }

      await requireAnalysisAccess(app.prisma, id, request.currentUser.sub);
      const analysis = await loadCard(app.prisma, id);
      if (!analysis) return reply.code(404).send({ error: 'NotFound' });

      return toCard(analysis, signFileUrl(app, id, request.currentUser.sub));
    },
  );

  // GET /analyses/:id/file — stream the raw file (token OR session auth)
  app.get<{ Params: { id: string }; Querystring: { token?: string } }>(
    '/analyses/:id/file',
    async (request, reply) => {
      const { id } = request.params;
      if (!z.string().uuid().safeParse(id).success) {
        return reply.code(400).send({ error: 'InvalidAnalysisId' });
      }

      let userId: string | null = null;
      const token = request.query.token;
      if (token) {
        try {
          const payload = app.jwt.verify<FileTokenPayload>(token);
          if (payload.aid !== id) {
            return reply.code(403).send({ error: 'TokenAnalysisMismatch' });
          }
          userId = payload.sub;
        } catch {
          return reply.code(401).send({ error: 'InvalidToken' });
        }
      } else {
        try {
          await request.jwtVerify();
          userId = (request as FastifyRequest).user.sub;
        } catch {
          return reply.code(401).send({ error: 'Unauthorized' });
        }
      }

      await requireAnalysisAccess(app.prisma, id, userId!);
      const analysis = await app.prisma.analysis.findFirst({
        where: { id, deletedAt: null },
      });
      if (!analysis) return reply.code(404).send({ error: 'NotFound' });

      const stream = await app.storage.getStream(analysis.fileKey);
      const contentType =
        analysis.fileKind === 'PDF'
          ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      reply
        .header('Content-Type', contentType)
        .header('Content-Length', analysis.fileSize)
        .header(
          'Content-Disposition',
          `inline; filename="${analysis.originalFilename.replace(/"/g, '')}"`,
        );
      return reply.send(stream);
    },
  );

  app.patch<{ Params: { id: string } }>(
    '/analyses/:id/access',
    { preHandler: app.authenticate },
    async (request, reply) => {
      const { id } = request.params;
      const body = PatchAccessBody.parse(request.body);
      const { sub: userId, companyId } = request.currentUser;

      await requireAnalysisOwner(app.prisma, id, userId);
      await assertTeamsInCompany(app.prisma, body.team_access, companyId);

      const updated = await app.prisma.$transaction(async (tx) => {
        await tx.analysisAccess.deleteMany({ where: { analysisId: id } });
        if (body.team_access.length > 0) {
          await tx.analysisAccess.createMany({
            data: body.team_access.map((teamId) => ({ analysisId: id, teamId })),
          });
        }
        return tx.analysis.findUniqueOrThrow({
          where: { id },
          include: {
            author: { select: { id: true, name: true } },
            teamAccess: { include: { team: { select: { id: true, name: true } } } },
          },
        });
      });

      return toCard(updated, signFileUrl(app, id, userId));
    },
  );

  // DELETE /analyses/:id — soft delete (file stays on disk)
  app.delete<{ Params: { id: string } }>(
    '/analyses/:id',
    { preHandler: app.authenticate },
    async (request, reply) => {
      const { id } = request.params;
      await requireAnalysisOwner(app.prisma, id, request.currentUser.sub);

      await app.prisma.analysis.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      return reply.code(204).send();
    },
  );

  app.get(
    '/feed',
    { preHandler: app.authenticate },
    async (request) => {
      const q = FeedQuery.parse(request.query);
      const userId = request.currentUser.sub;

      const cursor = q.cursor ? decodeCursor(q.cursor) : null;

      const where: Prisma.AnalysisWhereInput = {
        deletedAt: null,
        teamAccess: {
          some: {
            team: { members: { some: { userId } } },
            ...(q.team_id ? { teamId: q.team_id } : {}),
          },
        },
        ...(q.tag ? { tags: { has: q.tag } } : {}),
        ...(q.author_id ? { authorId: q.author_id } : {}),
        ...(cursor
          ? {
              OR: [
                { createdAt: { lt: new Date(cursor.createdAt) } },
                {
                  createdAt: new Date(cursor.createdAt),
                  id: { lt: cursor.id },
                },
              ],
            }
          : {}),
      };

      const rows = await app.prisma.analysis.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: q.limit + 1,
        include: {
          author: { select: { id: true, name: true } },
          teamAccess: { include: { team: { select: { id: true, name: true } } } },
        },
      });

      const hasMore = rows.length > q.limit;
      const page = hasMore ? rows.slice(0, q.limit) : rows;
      const last = page[page.length - 1];
      const nextCursor =
        hasMore && last
          ? encodeCursor({ createdAt: last.createdAt.toISOString(), id: last.id })
          : null;

      return {
        items: page.map((a) => toCard(a, signFileUrl(app, a.id, userId))),
        next_cursor: nextCursor,
      };
    },
  );
}
