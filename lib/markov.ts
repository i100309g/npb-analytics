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
      // 打者→一塁、フォース進塁のみ
      if (on1) {
        if (on2) {
          if (on3) { runs = 1; newRunners = 0b111; }      // 満塁→1点、満塁継続
          else      { newRunners = 0b111; }                 // 一二塁→満塁
        } else {
          newRunners = (on3 ? 0b100 : 0) | 0b011;          // 一塁→二塁、打者→一塁
        }
      } else {
        newRunners = runners | 0b001;                       // 打者→一塁のみ
      }
      break;
    }
    case "single": {
      // 三塁走者→生還、二塁走者→生還、一塁走者→二塁、打者→一塁
      if (on3) runs++;
      if (on2) runs++;
      newRunners = (on1 ? 0b010 : 0) | 0b001;              // 一塁走者→二塁、打者→一塁
      break;
    }
    case "double": {
      // 全走者生還、打者→二塁
      runs = (on1 ? 1 : 0) + (on2 ? 1 : 0) + (on3 ? 1 : 0);
      newRunners = 0b010;
      break;
    }
    case "triple": {
      // 全走者生還、打者→三塁
      runs = (on1 ? 1 : 0) + (on2 ? 1 : 0) + (on3 ? 1 : 0);
      newRunners = 0b100;
      break;
    }
    case "hr": {
      // 全走者＋打者生還
      runs = (on1 ? 1 : 0) + (on2 ? 1 : 0) + (on3 ? 1 : 0) + 1;
      newRunners = 0b000;
      break;
    }
    case "strikeout":
    case "out": {
      addOuts = 1;
      // 走者変化なし
      break;
    }
    case "dp": {
      // 一塁走者がいれば4-6-3等ゲッツー: 打者アウト＋一塁走者アウト
      if (on1 && outs < 2) {
        addOuts = 2;
        newRunners = runners & 0b110; // 一塁走者を除く
      } else {
        // 一塁走者なし or 2アウトならただのアウト
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
 *
 * 打者リストをサイクルさせながら、確率分布を更新する。
 * batIdx: イニング先頭の打者インデックス
 * 戻り値: [期待得点, 消費打者数]
 */
function simulateHalfInning(
  lineup: SaberStats[],
  startBat: number
): [number, number] {
  // probs[state] = そのstateにいる確率
  const probs = new Float64Array(TERMINAL + 1);
  probs[0] = 1.0; // 先頭は無死走者なし

  let expectedRuns = 0;
  let bat = startBat;
  let battersUsed = 0;

  // アウト確率が高いため、打者20人分で確率の99.9%以上が収束する
  const MAX_BATTERS = 27;

  for (let i = 0; i < MAX_BATTERS; i++) {
    const s = lineup[bat % lineup.length];
    bat++;
    battersUsed++;

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
    // TERMINALは変化しない（イニング終了）
    next[TERMINAL] += probs[TERMINAL];

    probs.set(next);
    if (probs[TERMINAL] > 0.9995) break;
  }

  return [expectedRuns, battersUsed];
}

/**
 * 打順（9人）で9イニング戦った時の期待得点を計算
 */
export function expectedRunsPerGame(lineup: SaberStats[]): number {
  let total = 0;
  let bat = 0;

  for (let inning = 0; inning < 9; inning++) {
    const [runs, used] = simulateHalfInning(lineup, bat);
    total += runs;
    bat = (bat + used) % lineup.length;
  }

  return total;
}

/**
 * 貪欲法 + 局所探索で打順を最適化
 * players: 選択された選手（9人）
 * 戻り値: 最適な打順のインデックス配列
 */
export function optimizeLineup(players: SaberStats[]): number[] {
  const n = players.length;

  // 初期打順: wOBAが高い順
  let order = Array.from({ length: n }, (_, i) => i)
    .sort((a, b) => players[b].wOBA - players[a].wOBA);

  let bestRuns = expectedRunsPerGame(order.map(i => players[i]));

  // 全ペアのスワップを試して改善があれば採用（山登り法）
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

  return order;
}

/** 得点期待値をビジュアル評価に変換 */
export function runsLabel(runs: number): string {
  if (runs >= 6.0) return "強力打線";
  if (runs >= 5.0) return "上位打線";
  if (runs >= 4.0) return "平均的";
  if (runs >= 3.0) return "やや低調";
  return "苦しい";
}
