"use client";

import { useState, useMemo, useCallback } from "react";
import {
  calcSaber, calcLeagueAvg, shrinkStats, wOBALabel, SHRINK_C,
  type RawBattingStats, type SaberStats,
} from "@/lib/sabermetrics";
import {
  expectedRunsDetail, optimizeLineup, explainLineup, runsLabel,
  type RunsDetail,
} from "@/lib/markov";

type PlayerData = {
  id: string;
  name: string;
  jerseyNumber: number;
  position: string;
  stats: RawBattingStats;
};

type SavedLineup = {
  label: string;
  ids: string[];
  result: RunsDetail;
};

type Props = {
  players: PlayerData[];
  color: string;
  isDH?: boolean;
};

const PITCHER_POSITIONS = ["投手"];

function wOBAColor(v: number): string {
  if (v >= 0.400) return "text-yellow-300";
  if (v >= 0.370) return "text-green-400";
  if (v >= 0.340) return "text-blue-400";
  if (v >= 0.310) return "text-gray-300";
  return "text-red-400";
}

function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-xs font-mono text-gray-500">
      <span className="text-gray-600">{label} </span>
      {value}
    </span>
  );
}

function ShrinkBadge({ pa }: { pa: number }) {
  const pct = Math.round((pa / (pa + SHRINK_C)) * 100);
  const color =
    pct >= 80 ? "text-gray-500" : pct >= 50 ? "text-yellow-700" : "text-orange-700";
  return (
    <span
      className={`text-xs font-mono ${color}`}
      title={`${pa}打席 — 実績${pct}% + リーグ平均${100 - pct}%で案分`}
    >
      {pa}PA/{pct}%
    </span>
  );
}

export default function LineupOptimizer({ players, color, isDH = false }: Props) {
  const [lineupIds, setLineupIds] = useState<string[]>([]);
  const [optimizing, setOptimizing] = useState(false);
  const [showShrink, setShowShrink] = useState(true);
  const [dhMode, setDhMode] = useState(isDH);
  const [posFilter, setPosFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"lineup" | "compare" | "inning" | "reason">("lineup");
  const [savedLineups, setSavedLineups] = useState<SavedLineup[]>([]);
  const [rationaleOrder, setRationaleOrder] = useState<number[] | null>(null);

  // 全選手の生SaberStats
  const rawSaberMap = useMemo(() => {
    const m = new Map<string, SaberStats>();
    for (const p of players) {
      const s = calcSaber(p.stats);
      if (s) m.set(p.id, s);
    }
    return m;
  }, [players]);

  // リーグ平均（DH設定によって対象選手が変わる）
  const leagueAvg = useMemo(() => {
    const pool = players
      .filter(p => dhMode ? !PITCHER_POSITIONS.includes(p.position) : true)
      .map(p => rawSaberMap.get(p.id))
      .filter((s): s is SaberStats => s !== undefined);
    return calcLeagueAvg(pool);
  }, [players, rawSaberMap, dhMode]);

  // 案分適用後のSaberStats
  const saberMap = useMemo(() => {
    const m = new Map<string, SaberStats>();
    for (const [id, raw] of rawSaberMap) {
      m.set(id, showShrink ? shrinkStats(raw, leagueAvg) : raw);
    }
    return m;
  }, [rawSaberMap, leagueAvg, showShrink]);

  const playerMap = useMemo(() => {
    const m = new Map<string, PlayerData>();
    for (const p of players) m.set(p.id, p);
    return m;
  }, [players]);

  // ポジション一覧（フィルター用）
  const positions = useMemo(() => {
    const s = new Set(players.map(p => p.position));
    return Array.from(s).sort();
  }, [players]);

  const availablePlayers = useMemo(() => {
    const inLineup = new Set(lineupIds);
    return players
      .filter(p => {
        if (inLineup.has(p.id)) return false;
        if (!saberMap.has(p.id)) return false;
        if (dhMode && PITCHER_POSITIONS.includes(p.position)) return false;
        if (posFilter !== "all" && p.position !== posFilter) return false;
        return true;
      })
      .sort((a, b) => (saberMap.get(b.id)?.wOBA ?? 0) - (saberMap.get(a.id)?.wOBA ?? 0));
  }, [players, lineupIds, saberMap, dhMode, posFilter]);

  const lineupStats = useMemo(
    () => lineupIds.map(id => saberMap.get(id)).filter((s): s is SaberStats => s !== undefined),
    [lineupIds, saberMap]
  );

  const runsDetail = useMemo(
    () => (lineupStats.length === 9 ? expectedRunsDetail(lineupStats) : null),
    [lineupStats]
  );

  const addPlayer = useCallback((id: string) => {
    setLineupIds(prev => (prev.length >= 9 ? prev : [...prev, id]));
  }, []);

  const removePlayer = useCallback((idx: number) => {
    setLineupIds(prev => prev.filter((_, i) => i !== idx));
    setRationaleOrder(null);
  }, []);

  const moveUp = useCallback((idx: number) => {
    if (idx === 0) return;
    setLineupIds(prev => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
    setRationaleOrder(null);
  }, []);

  const moveDown = useCallback((idx: number) => {
    setLineupIds(prev => {
      if (idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
    setRationaleOrder(null);
  }, []);

  const handleOptimize = useCallback(() => {
    if (lineupIds.length < 2) return;
    setOptimizing(true);
    setTimeout(() => {
      const stats = lineupIds
        .map(id => saberMap.get(id))
        .filter((s): s is SaberStats => s !== undefined);
      const order = optimizeLineup(stats);
      setLineupIds(prev => order.map(i => prev[i]));
      setRationaleOrder(order);
      setOptimizing(false);
      setActiveTab("lineup");
    }, 10);
  }, [lineupIds, saberMap]);

  const handleSaveLineup = useCallback(() => {
    if (!runsDetail) return;
    const label = `打順案 ${savedLineups.length + 1}`;
    setSavedLineups(prev => [...prev, { label, ids: [...lineupIds], result: runsDetail }]);
  }, [runsDetail, lineupIds, savedLineups.length]);

  const handleLoadLineup = useCallback((saved: SavedLineup) => {
    setLineupIds([...saved.ids]);
    setRationaleOrder(null);
    setActiveTab("lineup");
  }, []);

  // 根拠表示用データ
  const rationale = useMemo(() => {
    if (!rationaleOrder || lineupIds.length < 9) return null;
    const stats = lineupIds
      .map(id => saberMap.get(id))
      .filter((s): s is SaberStats => s !== undefined);
    if (stats.length < 9) return null;
    const names = lineupIds.map(id => playerMap.get(id)?.name ?? "");
    return explainLineup(rationaleOrder, stats, names);
  }, [rationaleOrder, lineupIds, saberMap, playerMap]);

  const isFull = lineupIds.length === 9;

  return (
    <div className="space-y-4">
      {/* ツールバー */}
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={() => { setDhMode(v => !v); setLineupIds([]); setRationaleOrder(null); }}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
            dhMode
              ? "border-blue-600 bg-blue-600/20 text-blue-300"
              : "border-gray-700 bg-gray-800 text-gray-400 hover:text-gray-200"
          }`}
        >
          {dhMode ? "DH あり" : "DH なし"}
        </button>

        <button
          onClick={() => setShowShrink(v => !v)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
            showShrink
              ? "border-green-700 bg-green-700/20 text-green-300"
              : "border-gray-700 bg-gray-800 text-gray-400 hover:text-gray-200"
          }`}
          title={`打席数で案分 (基準: ${SHRINK_C}PA)`}
        >
          {showShrink ? "PA案分 オン" : "PA案分 オフ"}
        </button>

        <select
          value={posFilter}
          onChange={e => setPosFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-xs bg-gray-800 border border-gray-700 text-gray-300 focus:outline-none"
        >
          <option value="all">全ポジション</option>
          {positions.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        {lineupIds.length > 0 && (
          <button
            onClick={() => { setLineupIds([]); setRationaleOrder(null); }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-700 bg-gray-800 text-gray-400 hover:text-red-400 transition-colors"
          >
            リセット
          </button>
        )}
      </div>

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
          <div className="divide-y divide-gray-800/50 overflow-y-auto max-h-[560px]">
            {availablePlayers.map(p => {
              const raw = rawSaberMap.get(p.id)!;
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-white text-sm">{p.name}</span>
                        <span className="text-xs text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded">{p.position}</span>
                        <span className={`text-xs font-medium ${wOBAColor(s.wOBA)}`}>{wOBALabel(s.wOBA)}</span>
                        {showShrink && <ShrinkBadge pa={raw.pa} />}
                      </div>
                      <div className="flex gap-3 mt-1 flex-wrap">
                        <span className={`text-xs font-mono font-bold ${wOBAColor(s.wOBA)}`}>
                          wOBA {s.wOBA.toFixed(3)}
                          {showShrink && (
                            <span className="text-gray-600 font-normal ml-1">(生:{raw.wOBA.toFixed(3)})</span>
                          )}
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
              <p className="px-4 py-8 text-center text-gray-600 text-sm">
                {posFilter !== "all" ? `${posFilter}の選手がいません` : "打撃データのある選手がいません"}
              </p>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="space-y-4">
          {/* Expected runs card */}
          <div
            className="rounded-xl p-5 border border-gray-800"
            style={{ background: `linear-gradient(135deg, ${color}18 0%, #111827 70%)` }}
          >
            {runsDetail !== null ? (
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">1試合期待得点（9イニング）</p>
                  <div className="flex items-end gap-2">
                    <span className="text-5xl font-bold text-white font-mono">{runsDetail.total.toFixed(2)}</span>
                    <span className="text-gray-400 mb-1.5">点</span>
                  </div>
                  <p className="text-sm font-medium mt-1" style={{ color }}>{runsLabel(runsDetail.total)}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    24状態 Markov Chain{showShrink ? ` · PA案分(基準${SHRINK_C}打席)` : ""}
                  </p>
                </div>
                <div className="flex flex-col gap-2 items-end flex-shrink-0">
                  <button
                    onClick={handleOptimize}
                    disabled={optimizing}
                    className="px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-50 hover:brightness-110"
                    style={{ backgroundColor: color }}
                  >
                    {optimizing ? "計算中…" : "最適打順を提案"}
                  </button>
                  <button
                    onClick={handleSaveLineup}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 bg-gray-800 hover:text-white transition-colors"
                  >
                    この打順を保存
                  </button>
                </div>
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

          {/* Tabs */}
          {lineupIds.length > 0 && (
            <div className="flex gap-1 bg-gray-900/60 rounded-lg p-1 border border-gray-800">
              {(["lineup", "inning", "reason", "compare"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-1.5 text-xs rounded-md font-medium transition-colors ${
                    activeTab === tab
                      ? "bg-gray-700 text-white"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {tab === "lineup" ? "打順" : tab === "inning" ? "イニング別" : tab === "reason" ? "根拠" : "比較"}
                </button>
              ))}
            </div>
          )}

          {/* Tab: 打順 */}
          {(activeTab === "lineup" || lineupIds.length === 0) && (
            <div className="bg-gray-900 rounded-xl border border-gray-800">
              <div className="px-4 py-3 border-b border-gray-800">
                <h2 className="font-semibold text-white text-sm">打順</h2>
              </div>
              <div className="divide-y divide-gray-800/40">
                {Array.from({ length: 9 }, (_, i) => {
                  const playerId = lineupIds[i];
                  const player = playerId ? playerMap.get(playerId) : undefined;
                  const s = playerId ? saberMap.get(playerId) : undefined;
                  const raw = playerId ? rawSaberMap.get(playerId) : undefined;

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
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-gray-500 text-xs">{player.jerseyNumber}</span>
                              <span className="font-medium text-white text-sm">{player.name}</span>
                              <span className="text-xs text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded">{player.position}</span>
                              {showShrink && raw && <ShrinkBadge pa={raw.pa} />}
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
                            >▲</button>
                            <button
                              onClick={() => moveDown(i)}
                              disabled={i >= lineupIds.length - 1}
                              className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-gray-300 disabled:opacity-20 transition-colors text-xs"
                            >▼</button>
                            <button
                              onClick={() => removePlayer(i)}
                              className="w-7 h-7 flex items-center justify-center text-red-700 hover:text-red-400 transition-colors ml-1 text-base leading-none"
                            >×</button>
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
          )}

          {/* Tab: イニング別 */}
          {activeTab === "inning" && runsDetail && (
            <div className="bg-gray-900 rounded-xl border border-gray-800">
              <div className="px-4 py-3 border-b border-gray-800">
                <h2 className="font-semibold text-white text-sm">イニング別期待得点</h2>
              </div>
              <div className="p-4 space-y-2">
                {runsDetail.perInning.map(({ inning, runs, leadoffBatter }) => {
                  const leaderId = lineupIds[leadoffBatter % lineupIds.length];
                  const leader = playerMap.get(leaderId);
                  const maxRuns = Math.max(...runsDetail.perInning.map(d => d.runs));
                  const barWidth = maxRuns > 0 ? (runs / maxRuns) * 100 : 0;
                  return (
                    <div key={inning} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400 w-8">{inning}回</span>
                        <span className="text-gray-600 flex-1 px-2 truncate text-left">
                          {leader ? `先頭: ${leader.name}` : ""}
                        </span>
                        <span className="text-white font-mono font-bold">{runs.toFixed(3)}</span>
                        <span className="text-gray-600 ml-1">点</span>
                      </div>
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${barWidth}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}
                <div className="pt-2 border-t border-gray-800 flex justify-between text-sm">
                  <span className="text-gray-500">合計</span>
                  <span className="text-white font-mono font-bold">{runsDetail.total.toFixed(2)} 点</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab: 根拠 */}
          {activeTab === "reason" && (
            <div className="bg-gray-900 rounded-xl border border-gray-800">
              <div className="px-4 py-3 border-b border-gray-800">
                <h2 className="font-semibold text-white text-sm">最適化の根拠</h2>
              </div>
              {rationale ? (
                <div className="divide-y divide-gray-800/40">
                  {rationale.map(({ slot, playerIdx, reason }) => {
                    const player = playerMap.get(lineupIds[playerIdx]);
                    if (!player) return null;
                    return (
                      <div key={slot} className="px-4 py-3 flex gap-3">
                        <span
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: color + "33", color }}
                        >
                          {slot}
                        </span>
                        <div>
                          <span className="text-white text-sm font-medium">{player.name}</span>
                          <p className="text-xs text-gray-500 mt-0.5">{reason}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="px-4 py-6 text-center text-gray-600 text-sm">
                  「最適打順を提案」を実行すると根拠が表示されます
                </p>
              )}
            </div>
          )}

          {/* Tab: 比較 */}
          {activeTab === "compare" && (
            <div className="bg-gray-900 rounded-xl border border-gray-800">
              <div className="px-4 py-3 border-b border-gray-800">
                <h2 className="font-semibold text-white text-sm">打順比較</h2>
              </div>
              {savedLineups.length === 0 ? (
                <p className="px-4 py-6 text-center text-gray-600 text-sm">
                  「この打順を保存」で比較できます
                </p>
              ) : (
                <div className="divide-y divide-gray-800/40">
                  {savedLineups.map((saved, idx) => {
                    const maxRuns = Math.max(...savedLineups.map(s => s.result.total));
                    const isBest = saved.result.total === maxRuns && savedLineups.length > 1;
                    const barWidth = maxRuns > 0 ? (saved.result.total / maxRuns) * 100 : 0;
                    return (
                      <div key={idx} className="px-4 py-3">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${isBest ? "text-white" : "text-gray-400"}`}>
                              {saved.label}
                            </span>
                            {isBest && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-900/50 text-yellow-400">最高</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`font-mono font-bold text-sm ${isBest ? "text-white" : "text-gray-400"}`}>
                              {saved.result.total.toFixed(2)}点
                            </span>
                            <button
                              onClick={() => handleLoadLineup(saved)}
                              className="text-xs text-gray-600 hover:text-gray-300 transition-colors"
                            >
                              読込
                            </button>
                          </div>
                        </div>
                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${barWidth}%`, backgroundColor: isBest ? color : color + "66" }}
                          />
                        </div>
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {saved.ids.map((id, i) => {
                            const p = playerMap.get(id);
                            return p ? (
                              <span key={i} className="text-xs text-gray-600">{i + 1}.{p.name}</span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {savedLineups.length > 1 && (
                    <div className="px-4 py-2 flex justify-end">
                      <button
                        onClick={() => setSavedLineups([])}
                        className="text-xs text-gray-600 hover:text-red-400 transition-colors"
                      >
                        比較をクリア
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

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
            {showShrink && (
              <p className="text-xs text-gray-700 mt-2">
                PA案分: 打席数が少ない選手の成績をリーグ平均（基準{SHRINK_C}打席）に引き寄せて計算
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
