import { prisma } from "@/lib/prisma";
import PlayersClient from "./PlayersClient";

const YEARS = [2025, 2026];

export default async function PlayersPage() {
  const [allBatters, allPitchers] = await Promise.all([
    prisma.battingStat.findMany({
      where: { seasonYear: { in: YEARS } },
      include: { player: { include: { team: true } } },
      orderBy: { avg: "desc" },
    }),
    prisma.pitchingStat.findMany({
      where: { seasonYear: { in: YEARS }, starts: { gt: 0 } },
      include: { player: { include: { team: true } } },
      orderBy: { era: "asc" },
    }),
  ]);

  const battersByYear: Record<number, typeof allBatters> = {};
  const pitchersByYear: Record<number, typeof allPitchers> = {};
  const yearSet = new Set<number>();

  for (const s of allBatters) {
    battersByYear[s.seasonYear] ??= [];
    battersByYear[s.seasonYear].push(s);
    yearSet.add(s.seasonYear);
  }
  for (const s of allPitchers) {
    pitchersByYear[s.seasonYear] ??= [];
    pitchersByYear[s.seasonYear].push(s);
    yearSet.add(s.seasonYear);
  }

  const availableYears = [...yearSet].sort();

  return (
    <PlayersClient
      battersByYear={battersByYear}
      pitchersByYear={pitchersByYear}
      availableYears={availableYears}
    />
  );
}
