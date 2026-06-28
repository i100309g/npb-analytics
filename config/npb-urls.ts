/**
 * NPB公式サイトのURL設定
 *
 * 選手一覧（rosterUrl）は全チーム設定済み。
 * 打撃/投手成績URL（battingUrl/pitchingUrl）はチームの成績ページURLを設定すること。
 *
 * リーグ: "central" | "pacific"
 */

export interface TeamUrlConfig {
  league: "central" | "pacific";
  battingUrl?: string;    // 打撃成績ページ
  pitchingUrl?: string;   // 投手成績ページ
  rosterUrl?: string;     // 選手一覧ページ（自動設定済み）
}

const BASE = "https://npb.jp/bis/teams";

export const teamUrls: Record<string, TeamUrlConfig> = {
  // ── セントラル・リーグ ──────────────────────────────────────────
  giants: {
    league: "central",
    rosterUrl:   `${BASE}/rst_g.html`,
    battingUrl:  "",
    pitchingUrl: "",
  },
  tigers: {
    league: "central",
    rosterUrl:   `${BASE}/rst_t.html`,
    battingUrl:  "",
    pitchingUrl: "",
  },
  baystars: {
    league: "central",
    rosterUrl:   `${BASE}/rst_db.html`,
    battingUrl:  "",
    pitchingUrl: "",
  },
  carp: {
    league: "central",
    rosterUrl:   `${BASE}/rst_c.html`,
    battingUrl:  "",
    pitchingUrl: "",
  },
  dragons: {
    league: "central",
    rosterUrl:   `${BASE}/rst_d.html`,
    battingUrl:  "",
    pitchingUrl: "",
  },
  swallows: {
    league: "central",
    rosterUrl:   `${BASE}/rst_s.html`,
    battingUrl:  "",
    pitchingUrl: "",
  },
  // ── パシフィック・リーグ ──────────────────────────────────────────
  hawks: {
    league: "pacific",
    rosterUrl:   `${BASE}/rst_h.html`,
    battingUrl:  "",
    pitchingUrl: "",
  },
  lions: {
    league: "pacific",
    rosterUrl:   `${BASE}/rst_l.html`,
    battingUrl:  "",
    pitchingUrl: "",
  },
  fighters: {
    league: "pacific",
    rosterUrl:   `${BASE}/rst_f.html`,
    battingUrl:  "",
    pitchingUrl: "",
  },
  marines: {
    league: "pacific",
    rosterUrl:   `${BASE}/rst_m.html`,
    battingUrl:  "",
    pitchingUrl: "",
  },
  eagles: {
    league: "pacific",
    rosterUrl:   `${BASE}/rst_e.html`,
    battingUrl:  "",
    pitchingUrl: "",
  },
  buffaloes: {
    league: "pacific",
    rosterUrl:   `${BASE}/rst_b.html`,
    battingUrl:  "",
    pitchingUrl: "",
  },
};
