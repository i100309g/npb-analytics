import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import LineupOptimizer from "./LineupOptimizer";

export async function generateStaticParams() {
  const teams = await prisma.team.findMany({ select: { id: true } });
  return teams.map((t) => ({ teamId: t.id }));
}

export default async function LineupPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) notFound();

  const allPlayers = await prisma.player.findMany({
    where: { teamId, active: true },
    orderBy: { jerseyNumber: "asc" },
    include: {
      battingStats: {
        where: { seasonYear: { in: [2025, 2026] } },
        orderBy: { seasonYear: "asc" },
      },
    },
  });

  function toPlayerData(p: (typeof allPlayers)[number], year: number) {
    const s = p.battingStats.find(st => st.seasonYear === year);
    if (!s) return null;
    return {
      id: p.id,
      name: p.name,
      jerseyNumber: p.jerseyNumber,
      position: p.position,
      stats: {
        plateAppearances: s.plateAppearances,
        atBats:           s.atBats,
        hits:             s.hits,
        singles:          s.singles,
        doubles:          s.doubles,
        triples:          s.triples,
        homeRuns:         s.homeRuns,
        walks:            s.walks,
        intentionalWalks: s.intentionalWalks,
        hitByPitch:       s.hitByPitch,
        strikeouts:       s.strikeouts,
        doublePlayGrounded: s.doublePlayGrounded,
        sacrificeHits:    s.sacrificeHits,
        sacrificeFlies:   s.sacrificeFlies,
        avg: s.avg,
        obp: s.obp,
        slg: s.slg,
        ops: s.ops,
      },
    };
  }

  type PlayerData = NonNullable<ReturnType<typeof toPlayerData>>;
  const playersByYear: Record<number, PlayerData[]> = {};
  for (const year of [2025, 2026]) {
    const list = allPlayers.map(p => toPlayerData(p, year)).filter((x): x is PlayerData => x !== null);
    if (list.length > 0) playersByYear[year] = list;
  }
  const availableYears = Object.keys(playersByYear).map(Number).sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/" className="hover:text-white transition-colors">チーム一覧</Link>
        <span>/</span>
        <Link href={`/teams/${teamId}`} className="hover:text-white transition-colors">
          {team.shortName}
        </Link>
        <span>/</span>
        <span className="text-gray-300">打順シミュレーター</span>
      </div>

      <div
        className="rounded-2xl p-6 border border-gray-800"
        style={{ background: `linear-gradient(135deg, ${team.color}18 0%, #111827 60%)` }}
      >
        <h1 className="text-2xl font-bold text-white">
          {team.shortName} 打順シミュレーター
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          選手を選んで打順を組むと、Markov Chainで得点期待値を計算します
        </p>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
          <span>使用モデル: <span className="text-gray-300">24状態 Markov Chain</span></span>
          <span>指標: <span className="text-gray-300">wOBA / ISO / BABIP / K% / BB%</span></span>
          <span>データ: <span className="text-gray-300">{availableYears.join(" / ")}年シーズン実績</span></span>
        </div>
      </div>

      <LineupOptimizer playersByYear={playersByYear} availableYears={availableYears} color={team.color} />
    </div>
  );
}
