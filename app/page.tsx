import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const standings = await prisma.standing.findMany({
    where: { seasonYear: 2025 },
    include: { team: { include: { stadium: true } } },
    orderBy: [{ league: "asc" }, { rank: "asc" }],
  });

  const central = standings.filter((s) => s.league === "セントラル");
  const pacific = standings.filter((s) => s.league === "パシフィック");

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">2025年 NPB 順位表</h1>
        <p className="text-gray-400 text-sm">日本プロ野球 全12球団のデータ</p>
      </div>
      {[{ label: "セントラル・リーグ", data: central, color: "#3B82F6" }, { label: "パシフィック・リーグ", data: pacific, color: "#F59E0B" }].map(({ label, data, color }) => (
        <section key={label}>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-6 rounded-full inline-block" style={{ backgroundColor: color }} />
            {label}
          </h2>
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 text-xs">
                  <th className="text-center px-4 py-3 w-8">順位</th>
                  <th className="text-left px-4 py-3">球団</th>
                  <th className="text-right px-4 py-3">勝</th>
                  <th className="text-right px-4 py-3">敗</th>
                  <th className="text-right px-4 py-3">分</th>
                  <th className="text-right px-4 py-3">勝率</th>
                  <th className="text-right px-4 py-3">GB</th>
                  <th className="text-right px-4 py-3 hidden md:table-cell">得点</th>
                  <th className="text-right px-4 py-3 hidden md:table-cell">失点</th>
                </tr>
              </thead>
              <tbody>
                {data.map((s) => (
                  <tr key={s.teamId} className="border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors">
                    <td className="text-center px-4 py-3 font-bold text-gray-400">{s.rank}</td>
                    <td className="px-4 py-3">
                      <Link href={`/teams/${s.teamId}`} className="flex items-center gap-2 hover:text-blue-400 transition-colors">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.team.color }} />
                        <span className="font-semibold text-white">{s.team.shortName}</span>
                        <span className="text-gray-500 text-xs hidden sm:inline">{s.team.name}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-green-400">{s.wins}</td>
                    <td className="px-4 py-3 text-right font-mono text-red-400">{s.losses}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-500">{s.draws}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold">{s.winRate.toFixed(3)}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-400">{s.gamesBehind === 0 ? "—" : s.gamesBehind.toFixed(1)}</td>
                    <td className="px-4 py-3 text-right font-mono hidden md:table-cell">{s.runsFor}</td>
                    <td className="px-4 py-3 text-right font-mono hidden md:table-cell text-gray-400">{s.runsAgainst}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
