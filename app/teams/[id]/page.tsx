import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

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
      include: {
        battingStats:  { where: { seasonYear: 2025 } },
        pitchingStats: { where: { seasonYear: 2025 } },
      },
    }),
  ]);

  if (!team) notFound();

  const batters  = players.filter((p) => p.battingStats.length > 0);
  const pitchers = players.filter((p) => p.pitchingStats.length > 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <Link href="/" className="hover:text-white transition-colors">チーム一覧</Link>
        <span>/</span>
        <span className="text-gray-300">{team.shortName}</span>
      </div>

      {/* Team Header */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">{team.league}・リーグ — {team.city} / {team.stadium.name}</p>
            <h1 className="text-3xl font-bold text-white">{team.name}</h1>
            <p className="text-sm text-gray-500 mt-1">創設 {team.foundedYear}年</p>
          </div>
          <div className="w-2 self-stretch rounded-full" style={{ backgroundColor: team.color }} />
        </div>
        {standing && (
          <div className="mt-6 grid grid-cols-4 gap-4">
            {[
              { label: "勝", value: standing.wins, color: "text-green-400" },
              { label: "敗", value: standing.losses, color: "text-red-400" },
              { label: "分", value: standing.draws, color: "text-gray-400" },
              { label: "勝率", value: standing.winRate.toFixed(3), color: "text-blue-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-gray-800 rounded-xl p-4 text-center">
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Batting */}
      {batters.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-white mb-4">野手成績</h2>
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 text-xs">
                  <th className="text-left px-4 py-3">選手名</th>
                  <th className="text-left px-4 py-3">守備</th>
                  <th className="text-right px-4 py-3">試合</th>
                  <th className="text-right px-4 py-3">打率</th>
                  <th className="text-right px-4 py-3">本塁打</th>
                  <th className="text-right px-4 py-3">打点</th>
                  <th className="text-right px-4 py-3">盗塁</th>
                  <th className="text-right px-4 py-3">OPS</th>
                </tr>
              </thead>
              <tbody>
                {batters.map((p) => {
                  const s = p.battingStats[0];
                  return (
                    <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-white">
                        <span className="text-gray-500 text-xs mr-2">#{p.jerseyNumber}</span>{p.name}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{p.position}</td>
                      <td className="px-4 py-3 text-right font-mono text-gray-300">{s.games}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold">{s.avg.toFixed(3)}</td>
                      <td className="px-4 py-3 text-right font-mono text-yellow-400">{s.homeRuns}</td>
                      <td className="px-4 py-3 text-right font-mono">{s.rbi}</td>
                      <td className="px-4 py-3 text-right font-mono text-green-400">{s.stolenBases}</td>
                      <td className="px-4 py-3 text-right font-mono text-blue-400">{s.ops.toFixed(3)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Pitching */}
      {pitchers.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-white mb-4">投手成績</h2>
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 text-xs">
                  <th className="text-left px-4 py-3">選手名</th>
                  <th className="text-right px-4 py-3">試合</th>
                  <th className="text-right px-4 py-3">防御率</th>
                  <th className="text-right px-4 py-3">勝</th>
                  <th className="text-right px-4 py-3">敗</th>
                  <th className="text-right px-4 py-3">S</th>
                  <th className="text-right px-4 py-3">H</th>
                  <th className="text-right px-4 py-3">奪三振</th>
                  <th className="text-right px-4 py-3">WHIP</th>
                </tr>
              </thead>
              <tbody>
                {pitchers.map((p) => {
                  const s = p.pitchingStats[0];
                  return (
                    <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-white">
                        <span className="text-gray-500 text-xs mr-2">#{p.jerseyNumber}</span>{p.name}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gray-300">{s.games}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-green-400">{s.era.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-mono text-green-400">{s.wins}</td>
                      <td className="px-4 py-3 text-right font-mono text-red-400">{s.losses}</td>
                      <td className="px-4 py-3 text-right font-mono text-yellow-400">{s.saves}</td>
                      <td className="px-4 py-3 text-right font-mono text-blue-400">{s.holds}</td>
                      <td className="px-4 py-3 text-right font-mono">{s.strikeouts}</td>
                      <td className="px-4 py-3 text-right font-mono text-gray-400">{s.whip.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
