// wOBA weights (NPB近似値 - MLBの2024値を基準に使用)
const W = {
  uBB:   0.690,
  hbp:   0.722,
  single: 0.888,
  double: 1.271,
  triple: 1.616,
  hr:    2.101,
};

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
           pSingle, pDouble, pTriple, pHR, pWalk, pStrikeout, pDP, pOut };
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
