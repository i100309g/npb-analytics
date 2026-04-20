import Link from "next/link";
import { teams, getWinRate, type League } from "@/lib/data";

function TeamCard({ team }: { team: (typeof teams)[0] }) {
  const winRate = getWinRate(team);
  return (
    <Link
      href={`/teams/${team.id}`}
      className="bg-gray-900 rounded-xl p-5 hover:bg-gray-800 transition-colors border border-gray-800 hover:border-gray-700 group"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
          {team.shortName}
        </span>
        <span
          className="text-xs px-2 py-1 rounded-full font-medium"
          style={{ backgroundColor: team.color + "33", color: team.color }}
        >
          {team.city}
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-4 truncate">{team.name}</p>
      <div className="flex gap-3 text-sm mb-3">
        <span className="text-green-400 font-semibold">{team.wins}勝</span>
        <span className="text-red-400 font-semibold">{team.losses}敗</span>
        <span className="text-gray-500">{team.draws}分</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-1.5">
        <div
          className="h-1.5 rounded-full"
          style={{ width: `${winRate * 100}%`, backgroundColor: team.color }}
        />
      </div>
      <p className="text-right text-xs text-gray-500 mt-1">
        勝率 {winRate.toFixed(3)}
      </p>
    </Link>
  );
}

function LeagueSection({ league, leagueTeams }: { league: League; leagueTeams: (typeof teams) }) {
  const sorted = [...leagueTeams].sort((a, b) => getWinRate(b) - getWinRate(a));
  return (
    <section>
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <span
          className="w-1 h-6 rounded-full inline-block"
          style={{ backgroundColor: league === "セントラル" ? "#3B82F6" : "#F59E0B" }}
        />
        {league}・リーグ
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {sorted.map((team) => (
          <TeamCard key={team.id} team={team} />
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const central = teams.filter((t) => t.league === "セントラル");
  const pacific = teams.filter((t) => t.league === "パシフィック");

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">2025年 NPB 順位表</h1>
        <p className="text-gray-400 text-sm">日本プロ野球 全12球団のデータ</p>
      </div>
      <LeagueSection league="セントラル" leagueTeams={central} />
      <LeagueSection league="パシフィック" leagueTeams={pacific} />
    </div>
  );
}
