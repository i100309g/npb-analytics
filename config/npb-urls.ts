/**
 * NPB公式サイトのURL設定
 *
 * 選手一覧 (rosterUrl) と個人成績 (stats[]) は全チーム設定済み。
 * 年度ごとのURLは npb.jp のパターンから自動生成。
 *
 * URL パターン:
 *   打撃: https://npb.jp/bis/{year}/stats/idb1_{code}.html
 *   投手: https://npb.jp/bis/{year}/stats/idp1_{code}.html
 *   選手: https://npb.jp/bis/teams/rst_{code}.html
 */

export interface YearlyStats {
  year: number;
  battingUrl: string;
  pitchingUrl: string;
}

export interface TeamUrlConfig {
  league: "central" | "pacific";
  teamCode: string;        // NPB URL コード (g, t, db, c, d, s / h, l, f, m, e, b)
  rosterUrl: string;
  stats: YearlyStats[];
}

const S = "https://npb.jp/bis";
const T = `${S}/teams`;

function statsForYears(code: string, years: number[]): YearlyStats[] {
  return years.map(year => ({
    year,
    battingUrl:  `${S}/${year}/stats/idb1_${code}.html`,
    pitchingUrl: `${S}/${year}/stats/idp1_${code}.html`,
  }));
}

const YEARS = [2025, 2026];

export const teamUrls: Record<string, TeamUrlConfig> = {
  // ── セントラル・リーグ ────────────────────────────────────────
  giants: {
    league: "central",
    teamCode: "g",
    rosterUrl: `${T}/rst_g.html`,
    stats: statsForYears("g", YEARS),
  },
  tigers: {
    league: "central",
    teamCode: "t",
    rosterUrl: `${T}/rst_t.html`,
    stats: statsForYears("t", YEARS),
  },
  baystars: {
    league: "central",
    teamCode: "db",
    rosterUrl: `${T}/rst_db.html`,
    stats: statsForYears("db", YEARS),
  },
  carp: {
    league: "central",
    teamCode: "c",
    rosterUrl: `${T}/rst_c.html`,
    stats: statsForYears("c", YEARS),
  },
  dragons: {
    league: "central",
    teamCode: "d",
    rosterUrl: `${T}/rst_d.html`,
    stats: statsForYears("d", YEARS),
  },
  swallows: {
    league: "central",
    teamCode: "s",
    rosterUrl: `${T}/rst_s.html`,
    stats: statsForYears("s", YEARS),
  },
  // ── パシフィック・リーグ ──────────────────────────────────────
  hawks: {
    league: "pacific",
    teamCode: "h",
    rosterUrl: `${T}/rst_h.html`,
    stats: statsForYears("h", YEARS),
  },
  lions: {
    league: "pacific",
    teamCode: "l",
    rosterUrl: `${T}/rst_l.html`,
    stats: statsForYears("l", YEARS),
  },
  fighters: {
    league: "pacific",
    teamCode: "f",
    rosterUrl: `${T}/rst_f.html`,
    stats: statsForYears("f", YEARS),
  },
  marines: {
    league: "pacific",
    teamCode: "m",
    rosterUrl: `${T}/rst_m.html`,
    stats: statsForYears("m", YEARS),
  },
  eagles: {
    league: "pacific",
    teamCode: "e",
    rosterUrl: `${T}/rst_e.html`,
    stats: statsForYears("e", YEARS),
  },
  buffaloes: {
    league: "pacific",
    teamCode: "b",
    rosterUrl: `${T}/rst_b.html`,
    stats: statsForYears("b", YEARS),
  },
};
