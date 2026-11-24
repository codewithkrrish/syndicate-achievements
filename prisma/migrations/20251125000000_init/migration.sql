-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Achievement" (
    "id" SERIAL NOT NULL,
    "matchNumber" INTEGER NOT NULL,
    "opponent" TEXT NOT NULL,
    "opponentChannelUrl" TEXT,
    "result" TEXT NOT NULL,
    "finalScore" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "mode" TEXT NOT NULL,
    "map" TEXT NOT NULL,
    "cardLine" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" SERIAL NOT NULL,
    "achievementId" INTEGER NOT NULL,
    "gameNumber" INTEGER NOT NULL,
    "scoreFor" INTEGER NOT NULL,
    "scoreAgainst" INTEGER NOT NULL,
    "result" TEXT NOT NULL,
    "screenshotUrl" TEXT NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_matchNumber_key" ON "Achievement"("matchNumber");

-- CreateIndex
CREATE INDEX "Achievement_date_idx" ON "Achievement"("date");

-- CreateIndex
CREATE INDEX "Game_achievementId_idx" ON "Game"("achievementId");

-- CreateIndex
CREATE UNIQUE INDEX "Game_achievementId_gameNumber_key" ON "Game"("achievementId", "gameNumber");

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

