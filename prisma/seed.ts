import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";
import { stadiums } from "./seed-data/stadiums";
import { teams } from "./seed-data/teams";
import { playersCentral } from "./seed-data/players-central";
import { playersPacific } from "./seed-data/players-pacific";
import { standings } from "./seed-data/standings";
import { games } from "./seed-data/games";
import { battingStatsCentral } from "./seed-data/batting-stats-central";
import { battingStatsPacific } from "./seed-data/batting-stats-pacific";
import { pitchingStatsCentral } from "./seed-data/pitching-stats-central";
import { pitchingStatsPacific } from "./seed-data/pitching-stats-pacific";
import { fieldingStats } from "./seed-data/fielding-stats";
import { awards, matchups } from "./seed-data/awards-matchups";

const dbPath = `file:${path.resolve(__dirname, "../dev.db")}`;
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Clear in dependency order
  await prisma.matchup.deleteMany();
  await prisma.award.deleteMany();
  await prisma.fieldingStat.deleteMany();
  await prisma.pitchingStat.deleteMany();
  await prisma.battingStat.deleteMany();
  await prisma.game.deleteMany();
  await prisma.standing.deleteMany();
  await prisma.player.deleteMany();
  await prisma.season.deleteMany();
  await prisma.team.deleteMany();
  await prisma.stadium.deleteMany();

  // Stadiums
  for (const s of stadiums) {
    await prisma.stadium.create({ data: s });
  }
  console.log(`✓ ${stadiums.length} stadiums`);

  // Teams
  for (const t of teams) {
    await prisma.team.create({ data: t });
  }
  console.log(`✓ ${teams.length} teams`);

  // Season
  await prisma.season.create({ data: { year: 2025 } });
  console.log("✓ season 2025");

  // Players
  const players = [...playersCentral, ...playersPacific];
  for (const p of players) {
    await prisma.player.create({ data: p });
  }
  console.log(`✓ ${players.length} players`);

  // Standings
  for (const s of standings) {
    await prisma.standing.create({ data: s });
  }
  console.log(`✓ ${standings.length} standings`);

  // Games
  for (const g of games) {
    await prisma.game.create({ data: g });
  }
  console.log(`✓ ${games.length} games`);

  // Batting stats
  const battingStats = [...battingStatsCentral, ...battingStatsPacific];
  for (const b of battingStats) {
    await prisma.battingStat.create({ data: b });
  }
  console.log(`✓ ${battingStats.length} batting stats`);

  // Pitching stats
  const pitchingStats = [...pitchingStatsCentral, ...pitchingStatsPacific];
  for (const p of pitchingStats) {
    await prisma.pitchingStat.create({ data: p });
  }
  console.log(`✓ ${pitchingStats.length} pitching stats`);

  // Fielding stats
  for (const f of fieldingStats) {
    await prisma.fieldingStat.create({ data: f });
  }
  console.log(`✓ ${fieldingStats.length} fielding stats`);

  // Awards
  for (const a of awards) {
    await prisma.award.create({ data: a });
  }
  console.log(`✓ ${awards.length} awards`);

  // Matchups
  for (const m of matchups) {
    await prisma.matchup.create({ data: m });
  }
  console.log(`✓ ${matchups.length} matchups`);

  console.log("✅ Seeding complete!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
