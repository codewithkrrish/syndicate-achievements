import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

// Seed: the Creators Record's first filed entry — Creators Record
// #001 vs NG Gamer. Idempotent: re-running updates the same row
// (matched by its unique (category, matchNumber) pair) and rebuilds
// its games, so `npm run db:seed` is always safe.
//
// The opponent's YouTube channel link is intentionally null: it has not
// been verified yet, and the site only shows the channel bar when a real
// link is on file. Add it later from the admin panel — never invent one.
//
// Screenshots are the real result screens from the guild's archive. They
// are inserted into the database itself (StoredImage, under fixed seed
// ids) and referenced as /api/images/<id> — the files in public/seed/
// are only the seed source, never served to visitors.

const prisma = new PrismaClient();

// Fixed ids keep the seed idempotent: each run deletes and recreates
// exactly these rows instead of piling up duplicates.
const SEED_IMAGES = [
  { id: "seed-match-002-game1", file: "match-002-game1.jpg" },
  { id: "seed-match-002-game2", file: "match-002-game2.jpg" },
  { id: "seed-match-002-game3", file: "match-002-game3.jpg" },
] as const;

async function main() {
  await prisma.storedImage.deleteMany({
    where: { id: { in: SEED_IMAGES.map((img) => img.id) } },
  });
  for (const img of SEED_IMAGES) {
    const data = readFileSync(join(process.cwd(), "public/seed", img.file));
    await prisma.storedImage.create({
      data: { id: img.id, mimeType: "image/jpeg", data },
    });
  }

  const data = {
    matchNumber: 1,
    opponent: "NG Gamer",
    opponentChannelUrl: null as string | null,
    result: "WIN",
    category: "CREATOR", // NG Gamer is a YouTube creator — a Creators record.
    finalScore: "2 – 1",
    format: "BO3",
    date: new Date("2026-08-08T00:00:00.000Z"),
    mode: "Clash Squad",
    map: "Bermuda",
    cardLine: "Went the distance — SYNDICATE beat NG Gamer.",
    thumbnailUrl: "/seed/match-002-poster.jpg",
  };

  const games = [
    { gameNumber: 1, scoreFor: 7, scoreAgainst: 6, result: "Victory", screenshotUrl: "/api/images/seed-match-002-game1" },
    { gameNumber: 2, scoreFor: 1, scoreAgainst: 7, result: "Defeat", screenshotUrl: "/api/images/seed-match-002-game2" },
    { gameNumber: 3, scoreFor: 7, scoreAgainst: 4, result: "Victory", screenshotUrl: "/api/images/seed-match-002-game3" },
  ];

  const achievement = await prisma.achievement.upsert({
    where: {
      category_matchNumber: {
        category: data.category,
        matchNumber: data.matchNumber,
      },
    },
    update: data,
    create: data,
  });

  await prisma.game.deleteMany({ where: { achievementId: achievement.id } });
  await prisma.game.createMany({
    data: games.map((g) => ({ ...g, achievementId: achievement.id })),
  });

  console.log(
    `Seeded Creators Record #${String(data.matchNumber).padStart(3, "0")} vs ${data.opponent} (${games.length} games).`,
  );
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
