"use client";

import { useState, useMemo, useCallback } from "react";
import { calcSaber, wOBALabel } from "@/lib/sabermetrics";
import type { RawBattingStats, SaberStats } from "@/lib/sabermetrics";
import { expectedRunsPerGame, optimizeLineup, runsLabel } from "@/lib/markov";

type PlayerData = {
  id: string;
  name: string;
  jerseyNumber: number;
  position: string;
  stats: RawBattingStats;
};

type Props = {
  players: PlayerData[];
  color: string;
};

function wOBAColor(v: number): string {
  if (v >= 0.400) return "text-yellow-300";
  if (v >= 0.370) return "text-green-400";
  if (v >= 0.340) return "text-blue-400";
  if (v >= 0.310) return "text-gray-300";
  return "text-red-400";
}

function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-xs text-gray-500 font-mono">
      <span className="text-gray-600">{label} </span>
      {value}
    </span>
  );
}

export default function LineupOptimizer({ players, color }: Props) {
  const [lineupIds, setLineupIds] = useState<string[]>([]);
  const [optimizing, setOptimizing] = useState(false);

  const saberMap = useMemo(() => {
    const m = new Map<string, SaberStats>();
    for (const p of players) {
      const s = calcSaber(p.stats);
      if (s) m.set(p.id, s);
    }
    return m;
  }, [players]);

  const playerMap = useMemo(() => {
    const m = new Map<string, PlayerData>();
    for (const p of players) m.set(p.id, p);
    return m;
  }, [players]);

  const availablePlayers = useMemo(() => {
    const inLineup = new Set(lineupIds);
    return players
      .filter(p => !inLineup.has(p.id) && saberMap.has(p.id))
      .sort((a, b) => (saberMap.get(b.id)?.wOBA ?? 0) - (saberMap.get(a.id)?.wOBA ?? 0));
  }, [players, lineupIds, saberMap]);

  const lineupStats = useMemo(
    () => lineupIds.map(id => saberMap.get(id)).filter((s): s is SaberStats => s !== undefined),
    [lineupIds, saberMap]
  );

  const runs = useMemo(
    () => (lineupStats.length === 9 ? expectedRunsPerGame(lineupStats) : null),
    [lineupStats]
  );

  const addPlayer = useCallback((id: string) => {
    setLineupIds(prev => (prev.length >= 9 ? prev : [...prev, id]));
  }, []);

  const removePlayer = useCallback((idx: number) => {
    setLineupIds(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const moveUp = useCallback((idx: number) => {
    if (idx === 0) return;
    setLineupIds(prev => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }, []);

  const moveDown = useCallback((idx: number) => {
    setLineupIds(prev => {
      if (idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }, []);

  const handleOptimize = useCallback(() => {
    if (lineupIds.length < 2) return;
    setOptimizing(true);
    setTimeout(() => {
      const stats = lineupIds.map(id => saberMap.get(id)).filter((s): s is SaberStats => s !== undefined);
      const order = optimizeLineup(stats);
      setLineupIds(prev => order.map(i => prev[i]));
      setOptimizing(false);
    }, 10);
  }, [lineupIds, saberMap]);

  const isFull = lineupIds.length === 9;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Player pool */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 flex flex-col">
        <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
          <h2 className="font-semibold text-white text-sm">選手プール</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">{availablePlayers.length}名</span>
            {isFull && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-500">打順が埋まっています</span>
            )}
          </div>
        </div>
        <div className="divide-y divide-gray-800/50 overflow-y-auto max-h-[620px]">
          {availablePlayers.map(p => {
            const s = saberMap.get(p.id)!;
            return (
              <button
                key={p.id}
                onClick={() => addPlayer(p.id)}
                disabled={isFull}
                className={`w-full text-left px-4 py-3 transition-colors ${
                  isFull ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-800/60 cursor-pointer"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-gray-600 text-xs w-5 text-right flex-shrink-0">{p.jerseyNumber}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white text-sm">{p.name}</span>
                      <span className="text-xs text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded">{p.position}</span>
                      <span className={`text-xs font-medium ${wOBAColor(s.wOBA)}`}>{wOBALabel(s.wOBA)}</span>
                    </div>
                    <div className="flex gap-3 mt-1 flex-wrap">
                      <span className={`text-xs font-mono font-bold ${wOBAColor(s.wOBA)}`}>
                        wOBA {s.wOBA.toFixed(3)}
                      </span>
                      <StatBadge label="ISO" value={s.iso.toFixed(3)} />
                      <StatBadge label="BABIP" value={s.babip.toFixed(3)} />
                      <StatBadge label="K%" value={`${(s.kRate * 100).toFixed(1)}%`} />
                      <StatBadge label="BB%" value={`${(s.bbRate * 100).toFixed(1)}%`} />
                    </div>
                  </div>
                  {!isFull && (
                    <span className="text-gray-600 text-xl flex-shrink-0">＋</span>
                  )}
                </div>
              </button>
            );
          })}
          {availablePlayers.length === 0 && !isFull && (
            <p className="px-4 py-8 text-center text-gray-600 text-sm">打撃データのある選手がいません</p>
          )}
        </div>
      </div>

      {/* Right: Lineup + results */}
      <div className="space-y-4">
        {/* Expected runs card */}
        <div
          className="rounded-xl p-5 border border-gray-800"
          style={{ background: `linear-gradient(135deg, ${color}18 0%, #111827 70%)` }}
        >
          {runs !== null ? (
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">1試合期待得点（9イニング）</p>
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-bold text-white font-mono">{runs.toFixed(2)}</span>
                  <span className="text-gray-400 mb-1.5">点</span>
                </div>
                <p className="text-sm font-medium mt-1" style={{ color }}>{runsLabel(runs)}</p>
                <p className="text-xs text-gray-600 mt-1">24状態 Markov Chain による計算</p>
              </div>
              <button
                onClick={handleOptimize}
                disabled={optimizing}
                className="flex-shrink-0 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-50 hover:brightness-110"
                style={{ backgroundColor: color }}
              >
                {optimizing ? "計算中…" : "最適打順を提案"}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">1試合期待得点（9イニング）</p>
                <p className="text-gray-600 text-base">
                  あと {9 - lineupIds.length} 名追加すると計算できます
                </p>
              </div>
              {lineupIds.length >= 2 && (
                <button
                  onClick={handleOptimize}
                  disabled={optimizing}
                  className="flex-shrink-0 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-50"
                  style={{ backgroundColor: color + "99" }}
                >
                  {optimizing ? "計算中…" : "この人数で最適化"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Lineup slots */}
        <div className="bg-gray-900 rounded-xl border border-gray-800">
          <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
            <h2 className="font-semibold text-white text-sm">打順</h2>
            {lineupIds.length > 0 && (
              <button
                onClick={() => setLineupIds([])}
                className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
              >
                リセット
              </button>
            )}
          </div>
          <div className="divide-y divide-gray-800/40">
            {Array.from({ length: 9 }, (_, i) => {
              const playerId = lineupIds[i];
              const player = playerId ? playerMap.get(playerId) : undefined;
              const s = playerId ? saberMap.get(playerId) : undefined;

              return (
                <div key={i} className="flex items-center gap-3 px-4 py-3 min-h-[60px]">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={
                      player
                        ? { backgroundColor: color + "33", color }
                        : { backgroundColor: "#1f2937", color: "#374151" }
                    }
                  >
                    {i + 1}
                  </span>

                  {player && s ? (
                    <>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 text-xs">{player.jerseyNumber}</span>
                          <span className="font-medium text-white text-sm">{player.name}</span>
                          <span className="text-xs text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded">{player.position}</span>
                        </div>
                        <div className="flex gap-2 mt-0.5 flex-wrap">
                          <span className={`text-xs font-mono font-bold ${wOBAColor(s.wOBA)}`}>
                            wOBA {s.wOBA.toFixed(3)}
                          </span>
                          <StatBadge label="ISO" value={s.iso.toFixed(3)} />
                          <StatBadge label="BABIP" value={s.babip.toFixed(3)} />
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <button
                          onClick={() => moveUp(i)}
                          disabled={i === 0}
                          className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-gray-300 disabled:opacity-20 transition-colors text-xs"
                          title="上へ"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => moveDown(i)}
                          disabled={i >= lineupIds.length - 1}
                          className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-gray-300 disabled:opacity-20 transition-colors text-xs"
                          title="下へ"
                        >
                          ▼
                        </button>
                        <button
                          onClick={() => removePlayer(i)}
                          className="w-7 h-7 flex items-center justify-center text-red-700 hover:text-red-400 transition-colors ml-1 text-base leading-none"
                          title="外す"
                        >
                          ×
                        </button>
                      </div>
                    </>
                  ) : (
                    <span className="text-gray-700 text-sm">— 未選択</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="bg-gray-900/50 rounded-xl border border-gray-800 px-4 py-3">
          <p className="text-xs text-gray-600 mb-2">wOBA ランク</p>
          <div className="flex flex-wrap gap-3 text-xs">
            <span className="text-yellow-300">≥.400 エリート</span>
            <span className="text-green-400">≥.370 優秀</span>
            <span className="text-blue-400">≥.340 平均以上</span>
            <span className="text-gray-300">≥.310 平均</span>
            <span className="text-red-400">&lt;.310 平均以下</span>
          </div>
        </div>
      </div>
    </div>
  );
}
