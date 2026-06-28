/**
 * Markov Chain による打順の得点期待値計算
 *
 * 状態: outs(0-2) × runners bitmask(0-7) = 24状態
 *   runners bitmask: bit0=一塁, bit1=二塁, bit2=三塁
 *   state = outs * 8 + runners
 *
 * TERMINAL = 24 (3アウト = チェンジ)
 */

import { SaberStats } from "./sabermetrics";

const TERMINAL = 24;

interface Transition {
  newState: number;
  runs: number;
}

/** イベントごとの塁上・得点変化を計算 */
function applyEvent(state: number, event: string): Transition {
  const outs    = Math.floor(state / 8);
  const runners = state % 8;
  const on1 = (runners & 1) !== 0;
  const on2 = (runners & 2) !== 0;
  const on3 = (runners & 4) !== 0;

  let newRunners = runners;
  let runs = 0;
  let addOuts = 0;

  switch (event) {
    case "walk": {
      if (on1) {
        if (on2) {
          if (on3) { runs = 1; newRunners = 0b111; }
          else      { newRunners = 0b111; }
        } else {
          newRunners = (on3 ? 0b100 : 0) | 0b011;
        }
      } else {
        newRunners = runners | 0b001;
      }
      break;
    }
    case "single": {
      if (on3) runs++;
      if (on2) runs++;
      newRunners = (on1 ? 0b010 : 0) | 0b001;
      break;
    }
    case "double": {
      runs = (on1 ? 1 : 0) + (on2 ? 1 : 0) + (on3 ? 1 : 0);
      newRunners = 0b010;
      break;
    }
    case "triple": {
      runs = (on1 ? 1 : 0) + (on2 ? 1 : 0) + (on3 ? 1 : 0);
      newRunners = 0b100;
      break;
    }
    case "hr": {
      runs = (on1 ? 1 : 0) + (on2 ? 1 : 0) + (on3 ? 1 : 0) + 1;
      newRunners = 0b000;
      break;
    }
    case "strikeout":
    case "out": {
      addOuts = 1;
      break;
    }
    case "dp": {
      if (on1 && outs < 2) {
        addOuts = 2;
        newRunners = runners & 0b110;
      } else {
        addOuts = 1;
      }
      break;
    }
  }

  const newOuts = outs + addOuts;
  if (newOuts >= 3) return { newState: TERMINAL, runs };
  return { newState: newOuts * 8 + newRunners, runs };
}

/**
 * 1イニングの得点期待値を計算（確率分布を伝搬）
 */
function simulateHalfInning(
  lineup: SaberStats[],
  startBat: number
): [number, number] {
  const probs = new Float64Array(TERMINAL + 1);
  probs[0] = 1.0;

  let expectedRuns = 0;
  let bat = startBat;
  const MAX_BATTERS = 27;

  for (let i = 0; i < MAX_BATTERS; i++) {
    const s = lineup[bat % lineup.length];
    bat++;

    const events: [string, number][] = [
      ["walk",      s.pWalk],
      ["single",    s.pSingle],
      ["double",    s.pDouble],
      ["triple",    s.pTriple],
      ["hr",        s.pHR],
      ["strikeout", s.pStrikeout],
      ["dp",        s.pDP],
      ["out",       s.pOut],
    ];

    const next = new Float64Array(TERMINAL + 1);

    for (let state = 0; state < TERMINAL; state++) {
      const p = probs[state];
      if (p < 1e-10) continue;

      for (const [ev, prob] of events) {
        if (prob <= 0) continue;
        const { newState, runs } = applyEvent(state, ev);
        expectedRuns += p * prob * runs;
        next[newState] += p * prob;
      }
    }
    next[TERMINAL] += probs[TERMINAL];

    probs.set(next);
    if (probs[TERMINAL] > 0.9995) break;
  }

  // 消費打者数: 先頭からbatまでの差（循環あり）
  const used = ((bat - startBat) + lineup.length * 4) % (lineup.length * 4);
  return [expectedRuns, used === 0 ? MAX_BATTERS : used];
}

/**
 * 打順で9イニング戦った時の期待得点（合計＋イニング別）を計算
 */
export function expectedRunsPerGame(lineup: SaberStats[]): number {
  const { total } = expectedRunsDetail(lineup);
  return total;
}

export interface InningDetail {
  inning: number;
  runs: number;
  leadoffBatter: number; // 先頭打者インデックス (0-based)
}

export interface RunsDetail {
  total: number;
  perInning: InningDetail[];
}

export function expectedRunsDetail(lineup: SaberStats[]): RunsDetail {
  let total = 0;
  let bat = 0;
  const perInning: InningDetail[] = [];

  for (let inning = 0; inning < 9; inning++) {
    const leadoffBatter = bat % lineup.length;
    const [runs, used] = simulateHalfInning(lineup, bat);
    total += runs;
    perInning.push({ inning: inning + 1, runs, leadoffBatter });
    bat = (bat + used) % lineup.length;
  }

  return { total, perInning };
}

/**
 * 多スタート山登り法で打順を最適化
 * - wOBA降順スタート + ランダムスタート複数回
 * - 各スタートから局所最適を探索
 */
export function optimizeLineup(players: SaberStats[]): number[] {
  const n = players.length;

  function hillClimb(initial: number[]): [number[], number] {
    let order = [...initial];
    let bestRuns = expectedRunsPerGame(order.map(i => players[i]));
    let improved = true;
    while (improved) {
      improved = false;
      for (let i = 0; i < n - 1; i++) {
        for (let j = i + 1; j < n; j++) {
          const candidate = [...order];
          [candidate[i], candidate[j]] = [candidate[j], candidate[i]];
          const runs = expectedRunsPerGame(candidate.map(k => players[k]));
          if (runs > bestRuns + 1e-6) {
            order = candidate;
            bestRuns = runs;
            improved = true;
          }
        }
      }
    }
    return [order, bestRuns];
  }

  // スタート1: wOBA降順
  const wOBAOrder = Array.from({ length: n }, (_, i) => i)
    .sort((a, b) => players[b].wOBA - players[a].wOBA);

  let [bestOrder, bestRuns] = hillClimb(wOBAOrder);

  // ランダムスタート × 4
  const RANDOM_STARTS = 4;
  for (let r = 0; r < RANDOM_STARTS; r++) {
    const shuffled = Array.from({ length: n }, (_, i) => i);
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const [order, runs] = hillClimb(shuffled);
    if (runs > bestRuns + 1e-6) {
      bestOrder = order;
      bestRuns = runs;
    }
  }

  return bestOrder;
}

/**
 * 最適化の根拠を説明するテキストを生成
 * 各打順スロットに対してなぜその選手が置かれたかを説明
 */
export interface LineupRationale {
  slot: number;          // 1-9
  playerIdx: number;     // players配列インデックス
  reason: string;        // 説明テキスト
}

export function explainLineup(
  order: number[],
  players: SaberStats[],
  playerNames: string[]
): LineupRationale[] {
  return order.map((playerIdx, slot) => {
    const s = players[playerIdx];
    const name = playerNames[playerIdx];
    let reason: string;

    if (slot === 0) {
      // 1番: 出塁率重視
      reason = `出塁率重視 (BB% ${(s.bbRate * 100).toFixed(1)}%・K% ${(s.kRate * 100).toFixed(1)}%)`;
    } else if (slot === 1) {
      // 2番: 万能型
      reason = `wOBA ${s.wOBA.toFixed(3)}・打順を回す役割`;
    } else if (slot === 2 || slot === 3) {
      // 3-4番: 最強打者
      reason = `wOBA ${s.wOBA.toFixed(3)}・ISO ${s.iso.toFixed(3)} — クリーンアップ`;
    } else if (slot === 4) {
      // 5番: 長打力
      reason = `ISO ${s.iso.toFixed(3)}・HR確率 ${(s.pHR * 100).toFixed(1)}%`;
    } else if (slot <= 6) {
      // 6-7番: 中程度
      reason = `wOBA ${s.wOBA.toFixed(3)}`;
    } else {
      // 8-9番: 弱打者
      reason = `出塁率 ${(s.bbRate * 100).toFixed(1)}%BB + K% ${(s.kRate * 100).toFixed(1)}%`;
    }

    return { slot: slot + 1, playerIdx, reason };
  });
}

/** 得点期待値をビジュアル評価に変換 */
export function runsLabel(runs: number): string {
  if (runs >= 6.0) return "強力打線";
  if (runs >= 5.0) return "上位打線";
  if (runs >= 4.0) return "平均的";
  if (runs >= 3.0) return "やや低調";
  return "苦しい";
}
