import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import TeamStats from "./TeamStats";

export async function generateStaticParams() {
  const teams = await prisma.team.findMany({ select: { id: true } });
  return teams.map((t) => ({ id: t.id }));
}

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [team, standing, players] = await Promise.all([
    prisma.team.findUnique({ where: { id }, include: { stadium: true } }),
    prisma.standing.findUnique({ where: { seasonYear_teamId: { seasonYear: 2025, teamId: id } } }),
    prisma.player.findMany({
      where: { teamId: id },
      orderBy: { jerseyNumber: "asc" },
      include: {
        battingStats:  { where: { seasonYear: { in: [2025, 2026] } }, orderBy: { seasonYear: "asc" } },
        pitchingStats: { where: { seasonYear: { in: [2025, 2026] } }, orderBy: { seasonYear: "asc" } },
        fieldingStats: { where: { seasonYear: { in: [2025, 2026] } }, orderBy: { seasonYear: "asc" } },
      },
    }),
  ]);

  const availableYears = [...new Set(players.flatMap(p => [
    ...p.battingStats.map(s => s.seasonYear),
    ...p.pitchingStats.map(s => s.seasonYear),
  ]))].sort();

  if (!team) notFound();

  const batters  = players.filter(p => p.position !== "投手");
  const pitchers = players.filter(p => p.position === "投手");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/" className="hover:text-white transition-colors">チーム一覧</Link>
        <span>/</span>
        <span className="text-gray-300">{team.shortName}</span>
      </div>

      <div className="rounded-2xl p-6 border border-gray-800" style={{ background: `linear-gradient(135deg, ${team.color}18 0%, #111827 60%)` }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1 tracking-wider uppercase">{team.league}リーグ · {team.city} · {team.stadium.name}</p>
            <h1 className="text-3xl font-bold text-white">{team.name}</h1>
            <p className="text-xs text-gray-500 mt-1">創設 {team.foundedYear}年</p>
          </div>
          <div className="w-1.5 self-stretch rounded-full" style={{ backgroundColor: team.color }} />
        </div>

        {standing && (
          <div className="mt-5 grid grid-cols-4 gap-3">
            {[
              { label: "勝", value: standing.wins, color: "text-green-400" },
              { label: "敗", value: standing.losses, color: "text-red-400" },
              { label: "分", value: standing.draws, color: "text-gray-400" },
              { label: "勝率", value: standing.winRate.toFixed(3), color: "text-blue-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-gray-900/70 rounded-xl p-3 text-center border border-gray-800/50">
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex gap-4 text-xs text-gray-400">
          <span>登録選手 <strong className="text-white">{players.length}</strong>名</span>
          <span>野手 <strong className="text-white">{batters.length}</strong>名</span>
          <span>投手 <strong className="text-white">{pitchers.length}</strong>名</span>
        </div>
      </div>

      <Link
        href={`/lineup/${id}`}
        className="flex items-center justify-between rounded-xl px-5 py-4 border border-gray-800 hover:border-gray-600 transition-all group"
        style={{ background: `linear-gradient(90deg, ${team.color}12 0%, transparent 60%)` }}
      >
        <div>
          <p className="font-semibold text-white group-hover:text-white">打順シミュレーター</p>
          <p className="text-xs text-gray-500 mt-0.5">選手を選んで打順を組むと、Markov Chainで得点期待値を計算</p>
        </div>
        <span className="text-gray-500 group-hover:text-gray-300 transition-colors text-lg">→</span>
      </Link>

      <TeamStats players={players} color={team.color} availableYears={availableYears} />
    </div>
  );
}
