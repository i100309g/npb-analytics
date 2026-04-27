import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function PlayersPage() {
  const [batters, pitchers] = await Promise.all([
    prisma.battingStat.findMany({
      where: { seasonYear: 2024 },
      include: { player: { include: { team: true } } },
      orderBy: { avg: "desc" },
    }),
    prisma.pitchingStat.findMany({
      where: { seasonYear: 2024, starts: { gt: 0 } },
      include: { player: { include: { team: true } } },
      orderBy: { era: "asc" },
    }),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">選手成績</h1>
        <p className="text-gray-400 text-sm">2024年シーズン個人成績</p>
      </div>

      {/* Batting */}
      <section>
        <h2 className="text-xl font-bold text-white mb-4">打撃成績 — 打率順</h2>
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3 w-8">#</th>
                <th className="text-left px-4 py-3">選手名</th>
                <th className="text-left px-4 py-3">球団</th>
                <th className="text-right px-4 py-3">打率</th>
                <th className="text-right px-4 py-3">本塁打</th>
                <th className="text-right px-4 py-3">打点</th>
                <th className="text-right px-4 py-3">盗塁</th>
                <th className="text-right px-4 py-3">OBP</th>
                <th className="text-right px-4 py-3">OPS</th>
              </tr>
            </thead>
            <tbody>
              {batters.map((s, i) => (
                <tr key={s.id} className="border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{i + 1}</td>
                  <td className="px-4 py-3 font-semibold text-white">{s.player.name}</td>
                  <td className="px-4 py-3">
                    <Link href={`/teams/${s.player.teamId}`}>
                      <span className="text-xs px-2 py-0.5 rounded-full hover:opacity-80"
                        style={{ backgroundColor: s.player.team.color + "33", color: s.player.team.color }}>
                        {s.player.team.shortName}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-white">{s.avg.toFixed(3)}</td>
                  <td className="px-4 py-3 text-right font-mono text-yellow-400">{s.homeRuns}</td>
                  <td className="px-4 py-3 text-right font-mono">{s.rbi}</td>
                  <td className="px-4 py-3 text-right font-mono text-green-400">{s.stolenBases}</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-300">{s.obp.toFixed(3)}</td>
                  <td className="px-4 py-3 text-right font-mono text-blue-400">{s.ops.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pitching */}
      <section>
        <h2 className="text-xl font-bold text-white mb-4">投手成績（先発）— 防御率順</h2>
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3 w-8">#</th>
                <th className="text-left px-4 py-3">選手名</th>
                <th className="text-left px-4 py-3">球団</th>
                <th className="text-right px-4 py-3">防御率</th>
                <th className="text-right px-4 py-3">勝</th>
                <th className="text-right px-4 py-3">敗</th>
                <th className="text-right px-4 py-3">奪三振</th>
                <th className="text-right px-4 py-3">WHIP</th>
                <th className="text-right px-4 py-3">K/9</th>
              </tr>
            </thead>
            <tbody>
              {pitchers.map((s, i) => (
                <tr key={s.id} className="border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{i + 1}</td>
                  <td className="px-4 py-3 font-semibold text-white">{s.player.name}</td>
                  <td className="px-4 py-3">
                    <Link href={`/teams/${s.player.teamId}`}>
                      <span className="text-xs px-2 py-0.5 rounded-full hover:opacity-80"
                        style={{ backgroundColor: s.player.team.color + "33", color: s.player.team.color }}>
                        {s.player.team.shortName}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-green-400">{s.era.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-mono text-green-400">{s.wins}</td>
                  <td className="px-4 py-3 text-right font-mono text-red-400">{s.losses}</td>
                  <td className="px-4 py-3 text-right font-mono text-blue-400">{s.strikeouts}</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-400">{s.whip.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-mono text-purple-400">{s.kPer9.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
