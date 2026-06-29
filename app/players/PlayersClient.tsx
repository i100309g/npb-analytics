"use client";

import { useState } from "react";
import Link from "next/link";

type TeamInfo = { id: string; shortName: string; color: string };

type BatterRow = {
  id: number; playerId: string; seasonYear: number;
  avg: number | null; homeRuns: number | null; rbi: number | null;
  stolenBases: number | null; obp: number | null; ops: number | null;
  player: { name: string; teamId: string; team: TeamInfo };
};

type PitcherRow = {
  id: number; playerId: string; seasonYear: number;
  era: number; wins: number; losses: number;
  strikeouts: number; whip: number; kPer9: number;
  player: { name: string; teamId: string; team: TeamInfo };
};

type Props = {
  battersByYear: Record<number, BatterRow[]>;
  pitchersByYear: Record<number, PitcherRow[]>;
  availableYears: number[];
};

export default function PlayersClient({ battersByYear, pitchersByYear, availableYears }: Props) {
  const [year, setYear] = useState(availableYears[availableYears.length - 1] ?? 2025);

  const batters = battersByYear[year] ?? [];
  const pitchers = pitchersByYear[year] ?? [];

  return (
    <div className="space-y-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">選手成績</h1>
          <p className="text-gray-400 text-sm">{year}年シーズン個人成績</p>
        </div>
        {availableYears.length > 1 && (
          <div className="flex gap-1 items-center">
            <span className="text-xs text-gray-500 mr-1">年度：</span>
            {availableYears.map(y => (
              <button
                key={y}
                onClick={() => setYear(y)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                  year === y
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "text-gray-400 border-gray-700 hover:text-gray-200 hover:border-gray-500"
                }`}
              >
                {y}年
              </button>
            ))}
          </div>
        )}
      </div>

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
              {batters.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-600">{year}年のデータはありません</td></tr>
              ) : batters.map((s, i) => (
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
                  <td className="px-4 py-3 text-right font-mono font-bold text-white">{s.avg != null ? s.avg.toFixed(3) : "—"}</td>
                  <td className="px-4 py-3 text-right font-mono text-yellow-400">{s.homeRuns ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-mono">{s.rbi ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-mono text-green-400">{s.stolenBases ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-300">{s.obp != null ? s.obp.toFixed(3) : "—"}</td>
                  <td className="px-4 py-3 text-right font-mono text-blue-400">{s.ops != null ? s.ops.toFixed(3) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

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
              {pitchers.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-600">{year}年のデータはありません</td></tr>
              ) : pitchers.map((s, i) => (
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
