import { notFound } from "next/navigation";
import Link from "next/link";
import { teams, getTeamById, getPlayersByTeam, getWinRate } from "@/lib/data";

export function generateStaticParams() {
  return teams.map((t) => ({ id: t.id }));
}

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const team = getTeamById(id);
  if (!team) notFound();

  const players = getPlayersByTeam(id);
  const batters = players.filter((p) => p.avg !== undefined);
  const pitchers = players.filter((p) => p.era !== undefined);
  const winRate = getWinRate(team);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <Link href="/" className="hover:text-white transition-colors">チーム一覧</Link>
        <span>/</span>
        <span className="text-gray-300">{team.shortName}</span>
      </div>

      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">{team.league}・リーグ — {team.city}</p>
            <h1 className="text-3xl font-bold text-white">{team.name}</h1>
          </div>
          <div
            className="w-3 h-full min-h-16 rounded-full"
            style={{ backgroundColor: team.color }}
          />
        </div>
        <div className="mt-6 grid grid-cols-3 gap-4">
          {[
            { label: "勝", value: team.wins, color: "text-green-400" },
            { label: "敗", value: team.losses, color: "text-red-400" },
            { label: "分", value: team.draws, color: "text-gray-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-800 rounded-xl p-4 text-center">
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>勝率</span>
            <span>{winRate.toFixed(3)}</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all"
              style={{ width: `${winRate * 100}%`, backgroundColor: team.color }}
            />
          </div>
        </div>
      </div>

      {batters.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-white mb-4">野手成績</h2>
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500">
                  <th className="text-left px-4 py-3">選手名</th>
                  <th className="text-left px-4 py-3">ポジション</th>
                  <th className="text-right px-4 py-3">打率</th>
                  <th className="text-right px-4 py-3">本塁打</th>
                  <th className="text-right px-4 py-3">打点</th>
                  <th className="text-right px-4 py-3">OPS</th>
                </tr>
              </thead>
              <tbody>
                {batters.map((p) => (
                  <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{p.name}</td>
                    <td className="px-4 py-3 text-gray-400">{p.position}</td>
                    <td className="px-4 py-3 text-right font-mono">{p.avg?.toFixed(3)}</td>
                    <td className="px-4 py-3 text-right font-mono text-yellow-400">{p.hr}</td>
                    <td className="px-4 py-3 text-right font-mono">{p.rbi}</td>
                    <td className="px-4 py-3 text-right font-mono text-blue-400">{p.ops?.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {pitchers.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-white mb-4">投手成績</h2>
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500">
                  <th className="text-left px-4 py-3">選手名</th>
                  <th className="text-right px-4 py-3">防御率</th>
                  <th className="text-right px-4 py-3">勝</th>
                  <th className="text-right px-4 py-3">敗</th>
                  <th className="text-right px-4 py-3">奪三振</th>
                </tr>
              </thead>
              <tbody>
                {pitchers.map((p) => (
                  <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{p.name}</td>
                    <td className="px-4 py-3 text-right font-mono text-green-400">{p.era?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-mono text-green-400">{p.wins}</td>
                    <td className="px-4 py-3 text-right font-mono text-red-400">{p.losses}</td>
                    <td className="px-4 py-3 text-right font-mono text-blue-400">{p.so}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
