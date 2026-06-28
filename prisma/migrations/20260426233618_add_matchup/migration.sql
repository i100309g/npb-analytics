-- CreateTable
CREATE TABLE "Matchup" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "seasonYear" INTEGER NOT NULL,
    "batterId" TEXT NOT NULL,
    "pitcherId" TEXT NOT NULL,
    "atBats" INTEGER NOT NULL,
    "hits" INTEGER NOT NULL,
    "doubles" INTEGER NOT NULL,
    "triples" INTEGER NOT NULL,
    "homeRuns" INTEGER NOT NULL,
    "rbi" INTEGER NOT NULL,
    "walks" INTEGER NOT NULL,
    "intentionalWalks" INTEGER NOT NULL,
    "strikeouts" INTEGER NOT NULL,
    "hitByPitch" INTEGER NOT NULL,
    "sacrificeFlies" INTEGER NOT NULL,
    "avg" REAL NOT NULL,
    "ops" REAL NOT NULL,
    CONSTRAINT "Matchup_batterId_fkey" FOREIGN KEY ("batterId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Matchup_pitcherId_fkey" FOREIGN KEY ("pitcherId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Matchup_seasonYear_batterId_pitcherId_key" ON "Matchup"("seasonYear", "batterId", "pitcherId");
