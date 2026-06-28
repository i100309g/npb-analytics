"use client";

import { useState } from "react";

type BattingStat = {
  games: number; plateAppearances: number | null; atBats: number | null; hits: number | null;
  singles: number | null; doubles: number | null; triples: number | null; homeRuns: number | null;
  rbi: number | null; runs: number | null; walks: number | null; intentionalWalks: number | null;
  hitByPitch: number | null; strikeouts: number | null; stolenBases: number | null;
  caughtStealing: number | null; doublePlayGrounded: number | null;
  sacrificeHits: number | null; sacrificeFlies: number | null;
  avg: number | null; obp: number | null; slg: number | null; ops: number | null;
};

type PitchingStat = {
  games: number; starts: number; completeGames: number; shutouts: number;
  wins: number; losses: number; saves: number; holds: number; blownSaves: number;
  inningsPitched: number; hitsAllowed: number; runsAllowed: number;
  earnedRuns: number; walksAllowed: number; intentionalWalks: number;
  hitBatters: number; strikeouts: number; homeRunsAllowed: number;
  qualityStarts: number; era: number; whip: number; kPer9: number; bbPer9: number;
};

type FieldingStat = {
  position: string; games: number; putouts: number; assists: number;
  errors: number; doublePlays: number; fieldingPct: number;
};

type Player = {
  id: string; name: string; jerseyNumber: number; position: string;
  battingStats: BattingStat[];
  pitchingStats: PitchingStat[];
  fieldingStats: FieldingStat[];
};

type Tab = "batting" | "pitching" | "fielding";

const fmt = (v: number | undefined | null, digits?: number) => {
  if (v == null) return <span className="text-gray-600">—</span>;
  return digits != null ? v.toFixed(digits) : String(v);
};

const Th = ({ children, right }: { children: React.ReactNode; right?: boolean }) => (
  <th className={`px-3 py-3 text-xs font-medium text-gray-400 whitespace-nowrap ${right ? "text-right" : "text-left"}`}>
    {children}
  </th>
);

const Td = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <td className={`px-3 py-2.5 font-mono text-sm ${className}`}>{children}</td>
);

export default function TeamStats({ players, color }: { players: Player[]; color: string }) {
  const [tab, setTab] = useState<Tab>("batting");

  const batters  = [...players.filter(p => p.position !== "投手")]
    .sort((a, b) => (b.battingStats[0]?.ops ?? -1) - (a.battingStats[0]?.ops ?? -1));
  const pitchers = [...players.filter(p => p.position === "投手")]
    .sort((a, b) => (a.pitchingStats[0]?.era ?? 99) - (b.pitchingStats[0]?.era ?? 99));

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "batting",  label: "打撃成績", count: batters.length },
    { key: "pitching", label: "投手成績", count: pitchers.length },
    { key: "fielding", label: "守備成績", count: batters.length },
  ];

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-900 rounded-xl p-1 border border-gray-800">
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              tab === key
                ? "text-white shadow-sm"
                : "text-gray-400 hover:text-gray-200"
            }`}
            style={tab === key ? { backgroundColor: color + "33", borderBottom: `2px solid ${color}` } : {}}
          >
            {label}
            <span className="ml-1.5 text-xs opacity-60">{count}名</span>
          </button>
        ))}
      </div>

      {/* Batting */}
      {tab === "batting" && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <Th>選手名</Th>
                <Th>守備</Th>
                <Th right>試合</Th>
                <Th right>打席</Th>
                <Th right>打数</Th>
                <Th right>安打</Th>
                <Th right>二塁打</Th>
                <Th right>三塁打</Th>
                <Th right>本塁打</Th>
                <Th right>打点</Th>
                <Th right>得点</Th>
                <Th right>四球</Th>
                <Th right>死球</Th>
                <Th right>三振</Th>
                <Th right>盗塁</Th>
                <Th right>盗塁死</Th>
                <Th right>犠打</Th>
                <Th right>犠飛</Th>
                <Th right>打率</Th>
                <Th right>出塁率</Th>
                <Th right>長打率</Th>
                <Th right>OPS</Th>
              </tr>
            </thead>
            <tbody>
              {batters.map((p, idx) => {
                const s = p.battingStats[0];
                const isTop = idx < 3 && s;
                return (
                  <tr key={p.id} className={`border-b border-gray-800/40 hover:bg-gray-800/40 transition-colors ${isTop ? "bg-gray-800/20" : ""}`}>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className="text-gray-500 text-xs mr-1.5">#{p.jerseyNumber}</span>
                      <span className="font-medium text-white">{p.name}</span>
                      {idx === 0 && s && <span className="ml-2 text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: color + "33", color }}>OPS 1位</span>}
                    </td>
                    <Td className="text-gray-400 text-xs whitespace-nowrap">{p.position}</Td>
                    <Td className="text-right text-gray-300">{fmt(s?.games)}</Td>
                    <Td className="text-right text-gray-300">{fmt(s?.plateAppearances)}</Td>
                    <Td className="text-right text-gray-300">{fmt(s?.atBats)}</Td>
                    <Td className="text-right text-gray-300">{fmt(s?.hits)}</Td>
                    <Td className="text-right text-gray-300">{fmt(s?.doubles)}</Td>
                    <Td className="text-right text-gray-300">{fmt(s?.triples)}</Td>
                    <Td className="text-right text-yellow-400 font-bold">{fmt(s?.homeRuns)}</Td>
                    <Td className="text-right text-gray-300">{fmt(s?.rbi)}</Td>
                    <Td className="text-right text-gray-300">{fmt(s?.runs)}</Td>
                    <Td className="text-right text-gray-300">{fmt(s?.walks)}</Td>
                    <Td className="text-right text-gray-300">{fmt(s?.hitByPitch)}</Td>
                    <Td className="text-right text-red-400">{fmt(s?.strikeouts)}</Td>
                    <Td className="text-right text-green-400">{fmt(s?.stolenBases)}</Td>
                    <Td className="text-right text-gray-400">{fmt(s?.caughtStealing)}</Td>
                    <Td className="text-right text-gray-300">{fmt(s?.sacrificeHits)}</Td>
                    <Td className="text-right text-gray-300">{fmt(s?.sacrificeFlies)}</Td>
                    <Td className={`text-right font-bold ${(s?.avg ?? 0) >= 0.3 ? "text-yellow-300" : (s?.avg ?? 0) >= 0.25 ? "text-blue-300" : "text-gray-300"}`}>{fmt(s?.avg, 3)}</Td>
                    <Td className="text-right text-blue-400">{fmt(s?.obp, 3)}</Td>
                    <Td className="text-right text-blue-400">{fmt(s?.slg, 3)}</Td>
                    <Td className={`text-right font-bold ${(s?.ops ?? 0) >= 0.85 ? "text-yellow-300" : (s?.ops ?? 0) >= 0.7 ? "text-blue-400" : "text-gray-300"}`}>{fmt(s?.ops, 3)}</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pitching */}
      {tab === "pitching" && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <Th>選手名</Th>
                <Th right>試合</Th>
                <Th right>先発</Th>
                <Th right>完投</Th>
                <Th right>完封</Th>
                <Th right>勝</Th>
                <Th right>敗</Th>
                <Th right>S</Th>
                <Th right>H</Th>
                <Th right>BS</Th>
                <Th right>投球回</Th>
                <Th right>被安打</Th>
                <Th right>失点</Th>
                <Th right>自責点</Th>
                <Th right>四球</Th>
                <Th right>三振</Th>
                <Th right>被本塁打</Th>
                <Th right>QS</Th>
                <Th right>防御率</Th>
                <Th right>WHIP</Th>
                <Th right>K/9</Th>
                <Th right>BB/9</Th>
              </tr>
            </thead>
            <tbody>
              {pitchers.map((p, idx) => {
                const s = p.pitchingStats[0];
                const isTop = idx < 3 && s;
                return (
                  <tr key={p.id} className={`border-b border-gray-800/40 hover:bg-gray-800/40 transition-colors ${isTop ? "bg-gray-800/20" : ""}`}>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className="text-gray-500 text-xs mr-1.5">#{p.jerseyNumber}</span>
                      <span className="font-medium text-white">{p.name}</span>
                      {idx === 0 && s && <span className="ml-2 text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: color + "33", color }}>防御率 1位</span>}
                    </td>
                    <Td className="text-right text-gray-300">{fmt(s?.games)}</Td>
                    <Td className="text-right text-gray-300">{fmt(s?.starts)}</Td>
                    <Td className="text-right text-gray-300">{fmt(s?.completeGames)}</Td>
                    <Td className="text-right text-gray-300">{fmt(s?.shutouts)}</Td>
                    <Td className="text-right text-green-400 font-bold">{fmt(s?.wins)}</Td>
                    <Td className="text-right text-red-400">{fmt(s?.losses)}</Td>
                    <Td className="text-right text-yellow-400 font-bold">{fmt(s?.saves)}</Td>
                    <Td className="text-right text-blue-400">{fmt(s?.holds)}</Td>
                    <Td className="text-right text-orange-400">{fmt(s?.blownSaves)}</Td>
                    <Td className="text-right text-gray-300">{fmt(s?.inningsPitched, 1)}</Td>
                    <Td className="text-right text-gray-300">{fmt(s?.hitsAllowed)}</Td>
                    <Td className="text-right text-gray-300">{fmt(s?.runsAllowed)}</Td>
                    <Td className="text-right text-gray-300">{fmt(s?.earnedRuns)}</Td>
                    <Td className="text-right text-gray-300">{fmt(s?.walksAllowed)}</Td>
                    <Td className="text-right text-purple-400">{fmt(s?.strikeouts)}</Td>
                    <Td className="text-right text-gray-300">{fmt(s?.homeRunsAllowed)}</Td>
                    <Td className="text-right text-gray-300">{fmt(s?.qualityStarts)}</Td>
                    <Td className={`text-right font-bold ${s?.era < 2.5 ? "text-yellow-300" : s?.era < 3.5 ? "text-green-400" : "text-gray-300"}`}>{fmt(s?.era, 2)}</Td>
                    <Td className={`text-right ${s?.whip < 1.1 ? "text-green-400" : "text-gray-300"}`}>{fmt(s?.whip, 2)}</Td>
                    <Td className="text-right text-purple-400">{fmt(s?.kPer9, 1)}</Td>
                    <Td className="text-right text-gray-400">{fmt(s?.bbPer9, 1)}</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Fielding */}
      {tab === "fielding" && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <Th>選手名</Th>
                <Th>守備位置</Th>
                <Th right>試合</Th>
                <Th right>刺殺</Th>
                <Th right>補殺</Th>
                <Th right>失策</Th>
                <Th right>併殺</Th>
                <Th right>守備率</Th>
              </tr>
            </thead>
            <tbody>
              {batters.map((p) => {
                const fStats = p.fieldingStats.length > 0 ? p.fieldingStats : [null as unknown as FieldingStat];
                return fStats.map((f, i) => (
                  <tr key={`${p.id}-${i}`} className="border-b border-gray-800/40 hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {i === 0 && (
                        <>
                          <span className="text-gray-500 text-xs mr-1.5">#{p.jerseyNumber}</span>
                          <span className="font-medium text-white">{p.name}</span>
                        </>
                      )}
                    </td>
                    <Td className="text-gray-400 text-xs">{f?.position ?? p.position}</Td>
                    <Td className="text-right text-gray-300">{fmt(f?.games)}</Td>
                    <Td className="text-right text-gray-300">{fmt(f?.putouts)}</Td>
                    <Td className="text-right text-gray-300">{fmt(f?.assists)}</Td>
                    <Td className="text-right text-red-400">{fmt(f?.errors)}</Td>
                    <Td className="text-right text-gray-300">{fmt(f?.doublePlays)}</Td>
                    <Td className={`text-right font-bold ${f?.fieldingPct >= 0.99 ? "text-yellow-300" : "text-blue-400"}`}>{fmt(f?.fieldingPct, 3)}</Td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
