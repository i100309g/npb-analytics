-- CreateTable
CREATE TABLE "Stadium" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "surface" TEXT NOT NULL,
    "roofType" TEXT NOT NULL,
    "openedYear" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "league" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "foundedYear" INTEGER NOT NULL,
    "stadiumId" TEXT NOT NULL,
    CONSTRAINT "Team_stadiumId_fkey" FOREIGN KEY ("stadiumId") REFERENCES "Stadium" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKana" TEXT NOT NULL,
    "jerseyNumber" INTEGER NOT NULL,
    "position" TEXT NOT NULL,
    "bats" TEXT NOT NULL,
    "throws" TEXT NOT NULL,
    "birthDate" TEXT NOT NULL,
    "birthPlace" TEXT NOT NULL,
    "height" INTEGER NOT NULL,
    "weight" INTEGER NOT NULL,
    "nationality" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Season" (
    "year" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT
);

-- CreateTable
CREATE TABLE "Standing" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "seasonYear" INTEGER NOT NULL,
    "teamId" TEXT NOT NULL,
    "league" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "wins" INTEGER NOT NULL,
    "losses" INTEGER NOT NULL,
    "draws" INTEGER NOT NULL,
    "winRate" REAL NOT NULL,
    "gamesBehind" REAL NOT NULL,
    "runsFor" INTEGER NOT NULL,
    "runsAgainst" INTEGER NOT NULL,
    CONSTRAINT "Standing_seasonYear_fkey" FOREIGN KEY ("seasonYear") REFERENCES "Season" ("year") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Standing_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Game" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "seasonYear" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT NOT NULL,
    "homeScore" INTEGER NOT NULL,
    "awayScore" INTEGER NOT NULL,
    "stadiumId" TEXT NOT NULL,
    "attendance" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "gameType" TEXT NOT NULL,
    CONSTRAINT "Game_seasonYear_fkey" FOREIGN KEY ("seasonYear") REFERENCES "Season" ("year") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Game_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Game_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Game_stadiumId_fkey" FOREIGN KEY ("stadiumId") REFERENCES "Stadium" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BattingStat" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "playerId" TEXT NOT NULL,
    "seasonYear" INTEGER NOT NULL,
    "games" INTEGER NOT NULL,
    "plateAppearances" INTEGER NOT NULL,
    "atBats" INTEGER NOT NULL,
    "hits" INTEGER NOT NULL,
    "singles" INTEGER NOT NULL,
    "doubles" INTEGER NOT NULL,
    "triples" INTEGER NOT NULL,
    "homeRuns" INTEGER NOT NULL,
    "rbi" INTEGER NOT NULL,
    "runs" INTEGER NOT NULL,
    "walks" INTEGER NOT NULL,
    "intentionalWalks" INTEGER NOT NULL,
    "hitByPitch" INTEGER NOT NULL,
    "strikeouts" INTEGER NOT NULL,
    "stolenBases" INTEGER NOT NULL,
    "caughtStealing" INTEGER NOT NULL,
    "doublePlayGrounded" INTEGER NOT NULL,
    "sacrificeHits" INTEGER NOT NULL,
    "sacrificeFlies" INTEGER NOT NULL,
    "avg" REAL NOT NULL,
    "obp" REAL NOT NULL,
    "slg" REAL NOT NULL,
    "ops" REAL NOT NULL,
    CONSTRAINT "BattingStat_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PitchingStat" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "playerId" TEXT NOT NULL,
    "seasonYear" INTEGER NOT NULL,
    "games" INTEGER NOT NULL,
    "starts" INTEGER NOT NULL,
    "completeGames" INTEGER NOT NULL,
    "shutouts" INTEGER NOT NULL,
    "wins" INTEGER NOT NULL,
    "losses" INTEGER NOT NULL,
    "saves" INTEGER NOT NULL,
    "holds" INTEGER NOT NULL,
    "blownSaves" INTEGER NOT NULL,
    "inningsPitched" REAL NOT NULL,
    "hitsAllowed" INTEGER NOT NULL,
    "runsAllowed" INTEGER NOT NULL,
    "earnedRuns" INTEGER NOT NULL,
    "walksAllowed" INTEGER NOT NULL,
    "intentionalWalks" INTEGER NOT NULL,
    "hitBatters" INTEGER NOT NULL,
    "strikeouts" INTEGER NOT NULL,
    "homeRunsAllowed" INTEGER NOT NULL,
    "era" REAL NOT NULL,
    "whip" REAL NOT NULL,
    "kPer9" REAL NOT NULL,
    "bbPer9" REAL NOT NULL,
    "qualityStarts" INTEGER NOT NULL,
    CONSTRAINT "PitchingStat_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FieldingStat" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "playerId" TEXT NOT NULL,
    "seasonYear" INTEGER NOT NULL,
    "position" TEXT NOT NULL,
    "games" INTEGER NOT NULL,
    "putouts" INTEGER NOT NULL,
    "assists" INTEGER NOT NULL,
    "errors" INTEGER NOT NULL,
    "doublePlays" INTEGER NOT NULL,
    "fieldingPct" REAL NOT NULL,
    CONSTRAINT "FieldingStat_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Award" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "seasonYear" INTEGER NOT NULL,
    "playerId" TEXT NOT NULL,
    "awardName" TEXT NOT NULL,
    "league" TEXT NOT NULL,
    CONSTRAINT "Award_seasonYear_fkey" FOREIGN KEY ("seasonYear") REFERENCES "Season" ("year") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Award_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Standing_seasonYear_teamId_key" ON "Standing"("seasonYear", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "BattingStat_playerId_seasonYear_key" ON "BattingStat"("playerId", "seasonYear");

-- CreateIndex
CREATE UNIQUE INDEX "PitchingStat_playerId_seasonYear_key" ON "PitchingStat"("playerId", "seasonYear");

-- CreateIndex
CREATE UNIQUE INDEX "FieldingStat_playerId_seasonYear_position_key" ON "FieldingStat"("playerId", "seasonYear", "position");
