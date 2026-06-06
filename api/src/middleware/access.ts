import type { PrismaClient, Analysis } from '@prisma/client';

export class AccessError extends Error {
  readonly statusCode: number;
  readonly code: string;
  constructor(code: 'NotFound' | 'Forbidden' | 'NotOwner', message?: string) {
    super(message ?? code);
    this.name = 'AccessError';
    this.code = code;
    this.statusCode = code === 'NotFound' ? 404 : 403;
  }
}

/**
 * Throws AccessError unless the given user is a member of at least one team
 * that has access to the given analysis. Returns the analysis on success.
 */
export async function requireAnalysisAccess(
  prisma: PrismaClient,
  analysisId: string,
  userId: string,
): Promise<Analysis> {
  const analysis = await prisma.analysis.findUnique({
    where: { id: analysisId },
    include: {
      teamAccess: {
        where: {
          team: {
            members: { some: { userId } },
          },
        },
        take: 1,
      },
    },
  });

  if (!analysis) throw new AccessError('NotFound');

  const isAuthor = analysis.authorId === userId;
  if (!isAuthor && analysis.teamAccess.length === 0) {
    throw new AccessError('Forbidden');
  }

  return analysis;
}

export async function requireAnalysisOwner(
  prisma: PrismaClient,
  analysisId: string,
  userId: string,
): Promise<Analysis> {
  const analysis = await prisma.analysis.findUnique({ where: { id: analysisId } });
  if (!analysis) throw new AccessError('NotFound');
  if (analysis.authorId !== userId) throw new AccessError('NotOwner');
  return analysis;
}
