// wOBA weights (NPB近似値 - MLBの2024値を基準に使用)
const W = {
  uBB:   0.690,
  hbp:   0.722,
  single: 0.888,
  double: 1.271,
  triple: 1.616,
  hr:    2.101,
};

// PA shrinkage定数: この打席数で「実績50% + リーグ平均50%」の重み
export const SHRINK_C = 200;

export interface RawBattingStats {
  plateAppearances: number | null;
  atBats:           number | null;
  hits:             number | null;
  singles:          number | null;
  doubles:          number | null;
  triples:          number | null;
  homeRuns:         number | null;
  walks:            number | null;
  intentionalWalks: number | null;
  hitByPitch:       number | null;
  strikeouts:       number | null;
  doublePlayGrounded: number | null;
  sacrificeHits:    number | null;
  sacrificeFlies:   number | null;
  avg: number | null;
  obp: number | null;
  slg: number | null;
  ops: number | null;
}

export interface SaberStats {
  // 基本指標
  wOBA:  number;
  iso:   number;   // Isolated Power
  babip: number;   // Batting Average on Balls in Play
  kRate: number;   // 三振率
  bbRate: number;  // 四球率（死球含む）
  // Markov Chain 用イベント確率（打席あたり）
  pSingle:    number;
  pDouble:    number;
  pTriple:    number;
  pHR:        number;
  pWalk:      number;  // 四球 + 死球（IBB除く）
  pStrikeout: number;
  pDP:        number;  // ゲッツー（打席あたり概算）
  pOut:       number;  // その他のアウト
  // サンプルサイズ
  pa: number;
  // 案分適用後フラグ
  shrunk: boolean;
}

export function calcSaber(s: RawBattingStats, minAB = 10): SaberStats | null {
  const pa  = s.plateAppearances ?? 0;
  const ab  = s.atBats           ?? 0;
  const h   = s.hits             ?? 0;
  const sg  = s.singles          ?? 0;
  const db  = s.doubles          ?? 0;
  const tr  = s.triples          ?? 0;
  const hr  = s.homeRuns         ?? 0;
  const bb  = s.walks            ?? 0;
  const ibb = s.intentionalWalks ?? 0;
  const hbp = s.hitByPitch       ?? 0;
  const k   = s.strikeouts       ?? 0;
  const dp  = s.doublePlayGrounded ?? 0;
  const sf  = s.sacrificeFlies   ?? 0;

  if (ab < minAB || pa <= 0) return null;

  const ubb = Math.max(0, bb - ibb);

  // wOBA
  const wobaDenom = ab + ubb + sf + hbp;
  const wOBA = wobaDenom > 0
    ? (W.uBB * ubb + W.hbp * hbp + W.single * sg +
       W.double * db + W.triple * tr + W.hr * hr) / wobaDenom
    : 0;

  // ISO = SLG - AVG
  const iso = Math.max(0, (s.slg ?? 0) - (s.avg ?? 0));

  // BABIP = (H - HR) / (AB - K - HR + SF)
  const babipDenom = ab - k - hr + sf;
  const babip = babipDenom > 0 ? Math.max(0, (h - hr) / babipDenom) : 0;

  // 三振率・四球率
  const kRate  = k / pa;
  const bbRate = (ubb + hbp) / pa;

  // Markov Chain 用イベント確率（1打席あたり）
  const pSingle    = sg  / pa;
  const pDouble    = db  / pa;
  const pTriple    = tr  / pa;
  const pHR        = hr  / pa;
  const pWalk      = (ubb + hbp) / pa;
  const pStrikeout = k   / pa;
  const pDP        = dp  / pa;

  // 残り（フォースアウト等）
  const pOut = Math.max(
    0,
    1 - pSingle - pDouble - pTriple - pHR - pWalk - pStrikeout - pDP
  );

  return { wOBA, iso, babip, kRate, bbRate,
           pSingle, pDouble, pTriple, pHR, pWalk, pStrikeout, pDP, pOut,
           pa, shrunk: false };
}

/**
 * リーグ平均SaberStatsを計算する（全選手の加重平均）
 */
export function calcLeagueAvg(allStats: SaberStats[]): SaberStats {
  if (allStats.length === 0) {
    // フォールバック: NPBリーグ平均近似値
    return {
      wOBA: 0.315, iso: 0.130, babip: 0.290, kRate: 0.175, bbRate: 0.095,
      pSingle: 0.155, pDouble: 0.038, pTriple: 0.004, pHR: 0.025,
      pWalk: 0.095, pStrikeout: 0.175, pDP: 0.022, pOut: 0.486,
      pa: 0, shrunk: false,
    };
  }

  const totalPA = allStats.reduce((s, p) => s + p.pa, 0);
  if (totalPA === 0) return calcLeagueAvg([]);

  const w = (key: keyof SaberStats) =>
    allStats.reduce((s, p) => s + (p[key] as number) * p.pa, 0) / totalPA;

  return {
    wOBA:       w("wOBA"),
    iso:        w("iso"),
    babip:      w("babip"),
    kRate:      w("kRate"),
    bbRate:     w("bbRate"),
    pSingle:    w("pSingle"),
    pDouble:    w("pDouble"),
    pTriple:    w("pTriple"),
    pHR:        w("pHR"),
    pWalk:      w("pWalk"),
    pStrikeout: w("pStrikeout"),
    pDP:        w("pDP"),
    pOut:       w("pOut"),
    pa: totalPA / allStats.length,
    shrunk: false,
  };
}

/**
 * 打席数案分（Bayesian shrinkage）
 *
 * 少ない打席数の選手はリーグ平均に引き寄せる。
 * weight = PA / (PA + C): PAが多いほど実績値を重視。
 * C = SHRINK_C (200PA) のとき、200PA で実績50%/平均50%。
 */
export function shrinkStats(
  stats: SaberStats,
  league: SaberStats,
  C = SHRINK_C
): SaberStats {
  const pa = stats.pa;
  const w  = pa / (pa + C); // 実績への重み
  const wL = 1 - w;         // リーグ平均への重み

  const blend = (key: keyof SaberStats) =>
    w * (stats[key] as number) + wL * (league[key] as number);

  const pSingle    = blend("pSingle");
  const pDouble    = blend("pDouble");
  const pTriple    = blend("pTriple");
  const pHR        = blend("pHR");
  const pWalk      = blend("pWalk");
  const pStrikeout = blend("pStrikeout");
  const pDP        = blend("pDP");
  const pOut       = Math.max(
    0,
    1 - pSingle - pDouble - pTriple - pHR - pWalk - pStrikeout - pDP
  );

  // wOBAも確率から再計算
  const wOBADenom = pSingle + pDouble + pTriple + pHR + pWalk + pOut + pStrikeout;
  const wOBA = wOBADenom > 0
    ? (W.uBB * pWalk + W.single * pSingle + W.double * pDouble +
       W.triple * pTriple + W.hr * pHR) / wOBADenom * (pa + C) / pa
    : blend("wOBA");

  return {
    wOBA:       blend("wOBA"),  // 表示用は元のブレンドを使用
    iso:        blend("iso"),
    babip:      blend("babip"),
    kRate:      blend("kRate"),
    bbRate:     blend("bbRate"),
    pSingle, pDouble, pTriple, pHR, pWalk, pStrikeout, pDP, pOut,
    pa,
    shrunk: true,
  };
}

/** wOBAをラベル付き文字列で返す */
export function wOBALabel(v: number): string {
  if (v >= 0.400) return "エリート";
  if (v >= 0.370) return "優秀";
  if (v >= 0.340) return "平均以上";
  if (v >= 0.310) return "平均";
  if (v >= 0.280) return "平均以下";
  return "低い";
}

/** 案分適用の重みを文字列で返す（UI表示用） */
export function shrinkLabel(pa: number, C = SHRINK_C): string {
  const w = pa / (pa + C);
  return `${Math.round(w * 100)}%`;
}
