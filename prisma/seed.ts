import { PrismaClient } from "@prisma/client";

// Seed: the record's first filed entry — Match #002 vs NG Gamer.
// Idempotent: re-running updates the same row (matched by its unique
// matchNumber) and rebuilds its games, so `npm run db:seed` is always safe.
//
// The opponent's YouTube channel link is intentionally null: it has not
// been verified yet, and the site only shows the channel bar when a real
// link is on file. Add it later from the admin panel — never invent one.
//
// Screenshots are the real result screens from the guild's archive, copied
// into public/seed/ with the project.

const prisma = new PrismaClient();

async function main() {
  const data = {
    matchNumber: 2,
    opponent: "NG Gamer",
    opponentChannelUrl: null as string | null,
    result: "WIN",
    finalScore: "2 – 1",
    format: "BO3",
    date: new Date("2026-08-08T00:00:00.000Z"),
    mode: "Clash Squad",
    map: "Bermuda",
    cardLine: "Went the distance — SYNDICATE beat NG Gamer.",
  };

  const games = [
    { gameNumber: 1, scoreFor: 7, scoreAgainst: 6, result: "Victory", screenshotUrl: "/seed/match-002-game1.jpg" },
    { gameNumber: 2, scoreFor: 1, scoreAgainst: 7, result: "Defeat", screenshotUrl: "/seed/match-002-game2.jpg" },
    { gameNumber: 3, scoreFor: 7, scoreAgainst: 4, result: "Victory", screenshotUrl: "/seed/match-002-game3.jpg" },
  ];

  const achievement = await prisma.achievement.upsert({
    where: { matchNumber: data.matchNumber },
    update: data,
    create: data,
  });

  await prisma.game.deleteMany({ where: { achievementId: achievement.id } });
  await prisma.game.createMany({
    data: games.map((g) => ({ ...g, achievementId: achievement.id })),
  });

  console.log(
    `Seeded Match #${String(data.matchNumber).padStart(3, "0")} vs ${data.opponent} (${games.length} games).`,
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
