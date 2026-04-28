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
      orderBy: { jerseyNumber: "asc" },
      include: {
        battingStats:  { where: { seasonYear: 2025 } },
        pitchingStats: { where: { seasonYear: 2025 } },
        fieldingStats: { where: { seasonYear: 2025 } },
      },
    }),
  ]);

  if (!team) notFound();

  const batters  = players.filter((p) => p.position !== "投手");
  const pitchers = players.filter((p) => p.position === "投手");

  const d = (v: number | string | undefined | null, digits?: number) =>
    v == null ? <span className="text-gray-600">—</span> :
    typeof v === "number" && digits != null ? v.toFixed(digits) : v;

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
            <table className="w-full text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 text-xs">
                  <th className="text-left px-4 py-3 sticky left-0 bg-gray-900 z-10">選手名</th>
                  <th className="text-left px-3 py-3">守備</th>
                  <th className="text-right px-3 py-3">試合</th>
                  <th className="text-right px-3 py-3">打席</th>
                  <th className="text-right px-3 py-3">打数</th>
                  <th className="text-right px-3 py-3">安打</th>
                  <th className="text-right px-3 py-3">二塁打</th>
                  <th className="text-right px-3 py-3">三塁打</th>
                  <th className="text-right px-3 py-3">本塁打</th>
                  <th className="text-right px-3 py-3">打点</th>
                  <th className="text-right px-3 py-3">得点</th>
                  <th className="text-right px-3 py-3">四球</th>
                  <th className="text-right px-3 py-3">死球</th>
                  <th className="text-right px-3 py-3">三振</th>
                  <th className="text-right px-3 py-3">盗塁</th>
                  <th className="text-right px-3 py-3">盗塁死</th>
                  <th className="text-right px-3 py-3">犠打</th>
                  <th className="text-right px-3 py-3">犠飛</th>
                  <th className="text-right px-3 py-3">打率</th>
                  <th className="text-right px-3 py-3">出塁率</th>
                  <th className="text-right px-3 py-3">長打率</th>
                  <th className="text-right px-3 py-3">OPS</th>
                </tr>
              </thead>
              <tbody>
                {batters.map((p) => {
                  const s = p.battingStats[0];
                  return (
                    <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-white sticky left-0 bg-gray-900 hover:bg-gray-800 transition-colors">
                        <span className="text-gray-500 text-xs mr-2">#{p.jerseyNumber}</span>{p.name}
                      </td>
                      <td className="px-3 py-3 text-gray-400 text-xs">{p.position}</td>
                      <td className="px-3 py-3 text-right font-mono text-gray-300">{d(s?.games)}</td>
                      <td className="px-3 py-3 text-right font-mono text-gray-300">{d(s?.plateAppearances)}</td>
                      <td className="px-3 py-3 text-right font-mono text-gray-300">{d(s?.atBats)}</td>
                      <td className="px-3 py-3 text-right font-mono text-gray-300">{d(s?.hits)}</td>
                      <td className="px-3 py-3 text-right font-mono text-gray-300">{d(s?.doubles)}</td>
                      <td className="px-3 py-3 text-right font-mono text-gray-300">{d(s?.triples)}</td>
                      <td className="px-3 py-3 text-right font-mono text-yellow-400">{d(s?.homeRuns)}</td>
                      <td className="px-3 py-3 text-right font-mono">{d(s?.rbi)}</td>
                      <td className="px-3 py-3 text-right font-mono">{d(s?.runs)}</td>
                      <td className="px-3 py-3 text-right font-mono">{d(s?.walks)}</td>
                      <td className="px-3 py-3 text-right font-mono">{d(s?.hitByPitch)}</td>
                      <td className="px-3 py-3 text-right font-mono text-red-400">{d(s?.strikeouts)}</td>
                      <td className="px-3 py-3 text-right font-mono text-green-400">{d(s?.stolenBases)}</td>
                      <td className="px-3 py-3 text-right font-mono">{d(s?.caughtStealing)}</td>
                      <td className="px-3 py-3 text-right font-mono">{d(s?.sacrificeHits)}</td>
                      <td className="px-3 py-3 text-right font-mono">{d(s?.sacrificeFlies)}</td>
                      <td className="px-3 py-3 text-right font-mono font-bold text-blue-300">{d(s?.avg, 3)}</td>
                      <td className="px-3 py-3 text-right font-mono text-blue-400">{d(s?.obp, 3)}</td>
                      <td className="px-3 py-3 text-right font-mono text-blue-400">{d(s?.slg, 3)}</td>
                      <td className="px-3 py-3 text-right font-mono font-bold text-blue-500">{d(s?.ops, 3)}</td>
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
            <table className="w-full text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 text-xs">
                  <th className="text-left px-4 py-3 sticky left-0 bg-gray-900 z-10">選手名</th>
                  <th className="text-right px-3 py-3">試合</th>
                  <th className="text-right px-3 py-3">先発</th>
                  <th className="text-right px-3 py-3">完投</th>
                  <th className="text-right px-3 py-3">完封</th>
                  <th className="text-right px-3 py-3">勝</th>
                  <th className="text-right px-3 py-3">敗</th>
                  <th className="text-right px-3 py-3">S</th>
                  <th className="text-right px-3 py-3">H</th>
                  <th className="text-right px-3 py-3">BS</th>
                  <th className="text-right px-3 py-3">投球回</th>
                  <th className="text-right px-3 py-3">被安打</th>
                  <th className="text-right px-3 py-3">失点</th>
                  <th className="text-right px-3 py-3">自責点</th>
                  <th className="text-right px-3 py-3">四球</th>
                  <th className="text-right px-3 py-3">三振</th>
                  <th className="text-right px-3 py-3">被本塁打</th>
                  <th className="text-right px-3 py-3">QS</th>
                  <th className="text-right px-3 py-3">防御率</th>
                  <th className="text-right px-3 py-3">WHIP</th>
                  <th className="text-right px-3 py-3">K/9</th>
                  <th className="text-right px-3 py-3">BB/9</th>
                </tr>
              </thead>
              <tbody>
                {pitchers.map((p) => {
                  const s = p.pitchingStats[0];
                  return (
                    <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-white sticky left-0 bg-gray-900 hover:bg-gray-800 transition-colors">
                        <span className="text-gray-500 text-xs mr-2">#{p.jerseyNumber}</span>{p.name}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-gray-300">{d(s?.games)}</td>
                      <td className="px-3 py-3 text-right font-mono text-gray-300">{d(s?.starts)}</td>
                      <td className="px-3 py-3 text-right font-mono text-gray-300">{d(s?.completeGames)}</td>
                      <td className="px-3 py-3 text-right font-mono text-gray-300">{d(s?.shutouts)}</td>
                      <td className="px-3 py-3 text-right font-mono text-green-400">{d(s?.wins)}</td>
                      <td className="px-3 py-3 text-right font-mono text-red-400">{d(s?.losses)}</td>
                      <td className="px-3 py-3 text-right font-mono text-yellow-400">{d(s?.saves)}</td>
                      <td className="px-3 py-3 text-right font-mono text-blue-400">{d(s?.holds)}</td>
                      <td className="px-3 py-3 text-right font-mono text-orange-400">{d(s?.blownSaves)}</td>
                      <td className="px-3 py-3 text-right font-mono">{d(s?.inningsPitched, 1)}</td>
                      <td className="px-3 py-3 text-right font-mono">{d(s?.hitsAllowed)}</td>
                      <td className="px-3 py-3 text-right font-mono">{d(s?.runsAllowed)}</td>
                      <td className="px-3 py-3 text-right font-mono">{d(s?.earnedRuns)}</td>
                      <td className="px-3 py-3 text-right font-mono">{d(s?.walksAllowed)}</td>
                      <td className="px-3 py-3 text-right font-mono">{d(s?.strikeouts)}</td>
                      <td className="px-3 py-3 text-right font-mono">{d(s?.homeRunsAllowed)}</td>
                      <td className="px-3 py-3 text-right font-mono">{d(s?.qualityStarts)}</td>
                      <td className="px-3 py-3 text-right font-mono font-bold text-green-400">{d(s?.era, 2)}</td>
                      <td className="px-3 py-3 text-right font-mono text-gray-300">{d(s?.whip, 2)}</td>
                      <td className="px-3 py-3 text-right font-mono text-purple-400">{d(s?.kPer9, 1)}</td>
                      <td className="px-3 py-3 text-right font-mono text-purple-400">{d(s?.bbPer9, 1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Fielding */}
      {batters.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-white mb-4">守備成績</h2>
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 text-xs">
                  <th className="text-left px-4 py-3 sticky left-0 bg-gray-900 z-10">選手名</th>
                  <th className="text-left px-3 py-3">守備位置</th>
                  <th className="text-right px-3 py-3">試合</th>
                  <th className="text-right px-3 py-3">刺殺</th>
                  <th className="text-right px-3 py-3">補殺</th>
                  <th className="text-right px-3 py-3">失策</th>
                  <th className="text-right px-3 py-3">併殺</th>
                  <th className="text-right px-3 py-3">守備率</th>
                </tr>
              </thead>
              <tbody>
                {batters.map((p) => {
                  const rows = p.fieldingStats.length > 0 ? p.fieldingStats : [null];
                  return rows.map((f, i) => (
                    <tr key={`${p.id}-${i}`} className="border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors">
                      {i === 0 && (
                        <td className="px-4 py-3 font-medium text-white sticky left-0 bg-gray-900 hover:bg-gray-800 transition-colors" rowSpan={rows.length}>
                          <span className="text-gray-500 text-xs mr-2">#{p.jerseyNumber}</span>{p.name}
                        </td>
                      )}
                      <td className="px-3 py-3 text-gray-400 text-xs">{f?.position ?? p.position}</td>
                      <td className="px-3 py-3 text-right font-mono text-gray-300">{d(f?.games)}</td>
                      <td className="px-3 py-3 text-right font-mono">{d(f?.putouts)}</td>
                      <td className="px-3 py-3 text-right font-mono">{d(f?.assists)}</td>
                      <td className="px-3 py-3 text-right font-mono text-red-400">{d(f?.errors)}</td>
                      <td className="px-3 py-3 text-right font-mono">{d(f?.doublePlays)}</td>
                      <td className="px-3 py-3 text-right font-mono text-blue-400">{d(f?.fieldingPct, 3)}</td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
