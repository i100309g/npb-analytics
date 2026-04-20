import { players, getTeamById } from "@/lib/data";

export default function PlayersPage() {
  const batters = players
    .filter((p) => p.avg !== undefined)
    .sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0));

  const pitchers = players
    .filter((p) => p.era !== undefined)
    .sort((a, b) => (a.era ?? 99) - (b.era ?? 99));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">選手成績</h1>
        <p className="text-gray-400 text-sm">2025年シーズン個人成績</p>
      </div>

      <section>
        <h2 className="text-xl font-bold text-white mb-4">打撃成績 — 打率順</h2>
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3">順位</th>
                <th className="text-left px-4 py-3">選手名</th>
                <th className="text-left px-4 py-3">球団</th>
                <th className="text-left px-4 py-3">守備</th>
                <th className="text-right px-4 py-3">打率</th>
                <th className="text-right px-4 py-3">本塁打</th>
                <th className="text-right px-4 py-3">打点</th>
                <th className="text-right px-4 py-3">OPS</th>
              </tr>
            </thead>
            <tbody>
              {batters.map((p, i) => {
                const team = getTeamById(p.teamId);
                return (
                  <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 text-gray-500 font-mono">{i + 1}</td>
                    <td className="px-4 py-3 font-semibold text-white">{p.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: (team?.color ?? "#555") + "33",
                          color: team?.color ?? "#aaa",
                        }}
                      >
                        {team?.shortName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{p.position}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-white">{p.avg?.toFixed(3)}</td>
                    <td className="px-4 py-3 text-right font-mono text-yellow-400">{p.hr}</td>
                    <td className="px-4 py-3 text-right font-mono">{p.rbi}</td>
                    <td className="px-4 py-3 text-right font-mono text-blue-400">{p.ops?.toFixed(3)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-4">投手成績 — 防御率順</h2>
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3">順位</th>
                <th className="text-left px-4 py-3">選手名</th>
                <th className="text-left px-4 py-3">球団</th>
                <th className="text-right px-4 py-3">防御率</th>
                <th className="text-right px-4 py-3">勝</th>
                <th className="text-right px-4 py-3">敗</th>
                <th className="text-right px-4 py-3">奪三振</th>
              </tr>
            </thead>
            <tbody>
              {pitchers.map((p, i) => {
                const team = getTeamById(p.teamId);
                return (
                  <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 text-gray-500 font-mono">{i + 1}</td>
                    <td className="px-4 py-3 font-semibold text-white">{p.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: (team?.color ?? "#555") + "33",
                          color: team?.color ?? "#aaa",
                        }}
                      >
                        {team?.shortName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-green-400">{p.era?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-mono text-green-400">{p.wins}</td>
                    <td className="px-4 py-3 text-right font-mono text-red-400">{p.losses}</td>
                    <td className="px-4 py-3 text-right font-mono text-blue-400">{p.so}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
