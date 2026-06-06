import { PrismaClient, FileKind } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 10;
const DEFAULT_PASSWORD = "password123";

async function hash(plain: string) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

async function main() {
  // ── Companies ──────────────────────────────────────────────────────────────
  const acme = await prisma.company.upsert({
    where: { name: "Acme Sports Analytics" },
    update: {},
    create: { name: "Acme Sports Analytics" },
  });

  const gamma = await prisma.company.upsert({
    where: { name: "Gamma Football Intelligence" },
    update: {},
    create: { name: "Gamma Football Intelligence" },
  });

  // ── Teams ──────────────────────────────────────────────────────────────────
  const [scouts, analysts, performance] = await Promise.all([
    prisma.team.upsert({
      where: { companyId_name: { companyId: acme.id, name: "Scouts" } },
      update: {},
      create: { name: "Scouts", companyId: acme.id },
    }),
    prisma.team.upsert({
      where: { companyId_name: { companyId: acme.id, name: "Analysts" } },
      update: {},
      create: { name: "Analysts", companyId: acme.id },
    }),
    prisma.team.upsert({
      where: { companyId_name: { companyId: acme.id, name: "Performance" } },
      update: {},
      create: { name: "Performance", companyId: acme.id },
    }),
  ]);

  const [observers, research, recruitment] = await Promise.all([
    prisma.team.upsert({
      where: { companyId_name: { companyId: gamma.id, name: "Observers" } },
      update: {},
      create: { name: "Observers", companyId: gamma.id },
    }),
    prisma.team.upsert({
      where: { companyId_name: { companyId: gamma.id, name: "Research" } },
      update: {},
      create: { name: "Research", companyId: gamma.id },
    }),
    prisma.team.upsert({
      where: { companyId_name: { companyId: gamma.id, name: "Recruitment" } },
      update: {},
      create: { name: "Recruitment", companyId: gamma.id },
    }),
  ]);

  // ── Users ──────────────────────────────────────────────────────────────────
  const pw = await hash(DEFAULT_PASSWORD);

  const alice = await prisma.user.upsert({
    where: { email: "alice@acme.com" },
    update: {},
    create: {
      email: "alice@acme.com",
      passwordHash: pw,
      name: "Alice Mercer",
      companyId: acme.id,
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@acme.com" },
    update: {},
    create: {
      email: "bob@acme.com",
      passwordHash: pw,
      name: "Bob Tanner",
      companyId: acme.id,
    },
  });

  const charlie = await prisma.user.upsert({
    where: { email: "charlie@acme.com" },
    update: {},
    create: {
      email: "charlie@acme.com",
      passwordHash: pw,
      name: "Charlie Voss",
      companyId: acme.id,
    },
  });

  const diana = await prisma.user.upsert({
    where: { email: "diana@gamma.com" },
    update: {},
    create: {
      email: "diana@gamma.com",
      passwordHash: pw,
      name: "Diana Ferreira",
      companyId: gamma.id,
    },
  });

  const eve = await prisma.user.upsert({
    where: { email: "eve@gamma.com" },
    update: {},
    create: {
      email: "eve@gamma.com",
      passwordHash: pw,
      name: "Eve Nakamura",
      companyId: gamma.id,
    },
  });

  const frank = await prisma.user.upsert({
    where: { email: "frank@gamma.com" },
    update: {},
    create: {
      email: "frank@gamma.com",
      passwordHash: pw,
      name: "Frank Oliveira",
      companyId: gamma.id,
    },
  });

  // ── Team memberships ───────────────────────────────────────────────────────
  const memberships: Array<{ userId: string; teamId: string }> = [
    // Acme
    { userId: alice.id, teamId: scouts.id },
    { userId: alice.id, teamId: analysts.id },
    { userId: bob.id, teamId: analysts.id },
    { userId: charlie.id, teamId: scouts.id },
    { userId: charlie.id, teamId: performance.id },
    // Gamma
    { userId: diana.id, teamId: observers.id },
    { userId: diana.id, teamId: research.id },
    { userId: eve.id, teamId: research.id },
    { userId: eve.id, teamId: recruitment.id },
    { userId: frank.id, teamId: observers.id },
    { userId: frank.id, teamId: recruitment.id },
  ];

  await Promise.all(
    memberships.map((m) =>
      prisma.userTeam.upsert({
        where: { userId_teamId: m },
        update: {},
        create: m,
      })
    )
  );

  // ── Analyses ───────────────────────────────────────────────────────────────
  // fileKey mirrors the pattern used in analyses.ts: `${id}/${originalFilename}`
  // Files are not present on disk — seed records exist for API/feed testing only.

  const analysisData = [
    {
      id: "a1000000-0000-0000-0000-000000000001",
      title: "Premier League 2024-25 xG Breakdown",
      description:
        "Season-level expected goals analysis across all 20 PL clubs, comparing xG for/against and conversion rates.",
      tags: ["premier-league", "xg", "season-review"],
      authorId: alice.id,
      fileKind: FileKind.XLSX,
      originalFilename: "pl_xg_2024_25.xlsx",
      fileSize: 245_000,
      teamAccess: [scouts.id, analysts.id],
    },
    {
      id: "a2000000-0000-0000-0000-000000000002",
      title: "La Liga Pressing Intensity Report",
      description:
        "PPDA and press success rates for top-6 La Liga sides through matchweek 30. Includes per-phase breakdowns.",
      tags: ["la-liga", "pressing", "tactical"],
      authorId: bob.id,
      fileKind: FileKind.PDF,
      originalFilename: "laliga_pressing_mw30.pdf",
      fileSize: 1_820_000,
      teamAccess: [analysts.id],
    },
    {
      id: "a3000000-0000-0000-0000-000000000003",
      title: "Bundesliga Defender Radar Charts",
      description:
        "Radar visualisations for all Bundesliga centre-backs with ≥1800 minutes. Percentiles within the pos_pool.",
      tags: ["bundesliga", "defenders", "radar", "recruitment"],
      authorId: alice.id,
      fileKind: FileKind.XLSX,
      originalFilename: "bundesliga_cb_radars.xlsx",
      fileSize: 890_000,
      teamAccess: [scouts.id, analysts.id, performance.id],
    },
    {
      id: "a4000000-0000-0000-0000-000000000004",
      title: "Champions League Group Stage Analysis",
      description:
        "Aggregate stats and heatmaps for all 32 UCL group-stage participants. Focus on ball-progression metrics.",
      tags: ["champions-league", "group-stage", "progressive-passes"],
      authorId: diana.id,
      fileKind: FileKind.PDF,
      originalFilename: "ucl_group_stage_analysis.pdf",
      fileSize: 3_150_000,
      teamAccess: [observers.id, research.id],
    },
    {
      id: "a5000000-0000-0000-0000-000000000005",
      title: "Serie A Midfield Progression Study",
      description:
        "Deep dive into progressive carries and pass networks for Serie A midfielders. Comparison across positional clusters.",
      tags: ["serie-a", "midfielders", "progressive-carries", "network"],
      authorId: eve.id,
      fileKind: FileKind.XLSX,
      originalFilename: "seriea_midfield_progression.xlsx",
      fileSize: 670_000,
      teamAccess: [research.id, recruitment.id],
    },
    {
      id: "a6000000-0000-0000-0000-000000000006",
      title: "Ligue 1 Goalkeeper Shot-Stopping Metrics",
      description:
        "PSxG-GA and post-shot xG comparisons for all Ligue 1 keepers with ≥10 appearances. Ranked by save impact.",
      tags: ["ligue-1", "goalkeepers", "psxg", "shot-stopping"],
      authorId: charlie.id,
      fileKind: FileKind.XLSX,
      originalFilename: "ligue1_gk_shot_stopping.xlsx",
      fileSize: 312_000,
      teamAccess: [scouts.id, performance.id],
    },
    {
      id: "a7000000-0000-0000-0000-000000000007",
      title: "Eredivisie U21 Talent Shortlist",
      description:
        "Scouting shortlist of 15 Eredivisie players under 21 showing high market-value growth potential based on dlog_mv model.",
      tags: ["eredivisie", "u21", "recruitment", "market-value"],
      authorId: frank.id,
      fileKind: FileKind.PDF,
      originalFilename: "eredivisie_u21_shortlist.pdf",
      fileSize: 980_000,
      teamAccess: [observers.id, recruitment.id],
    },
  ] as const;

  for (const a of analysisData) {
    const { teamAccess, ...fields } = a;
    await prisma.analysis.upsert({
      where: { id: fields.id },
      update: {},
      create: {
        ...fields,
        fileKey: `${fields.id}/${fields.originalFilename}`,
        teamAccess: {
          createMany: {
            data: teamAccess.map((teamId) => ({ teamId })),
            skipDuplicates: true,
          },
        },
      },
    });
  }

  console.log("Seed complete.");
  console.table([
    { entity: "Companies", count: 2 },
    { entity: "Teams", count: 6 },
    { entity: "Users", count: 6 },
    { entity: "Analyses", count: analysisData.length },
  ]);
  console.log(`All users share password: "${DEFAULT_PASSWORD}"`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
