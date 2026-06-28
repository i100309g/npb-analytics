/**
 * NPB公式サイトのURL設定
 *
 * 各チームの成績ページURLをここに設定する。
 * 未設定（空文字）のチームはスキップされる。
 *
 * リーグ: "central" | "pacific"
 */

export interface TeamUrlConfig {
  league: "central" | "pacific";
  battingUrl?: string;    // 打撃成績ページ
  pitchingUrl?: string;   // 投手成績ページ
  rosterUrl?: string;     // ロスターページ（選手データ）
  tableIndex?: {          // 1ページに複数テーブルがある場合のインデックス（0始まり）
    batting?: number;
    pitching?: number;
    roster?: number;
  };
}

export const teamUrls: Record<string, TeamUrlConfig> = {
  giants: {
    league: "central",
    battingUrl:  "",
    pitchingUrl: "",
    rosterUrl:   "",
  },
  tigers: {
    league: "central",
    battingUrl:  "",
    pitchingUrl: "",
    rosterUrl:   "",
  },
  baystars: {
    league: "central",
    battingUrl:  "",
    pitchingUrl: "",
    rosterUrl:   "",
  },
  carp: {
    league: "central",
    battingUrl:  "",
    pitchingUrl: "",
    rosterUrl:   "",
  },
  dragons: {
    league: "central",
    battingUrl:  "",
    pitchingUrl: "",
    rosterUrl:   "",
  },
  swallows: {
    league: "central",
    battingUrl:  "",
    pitchingUrl: "",
    rosterUrl:   "",
  },
  hawks: {
    league: "pacific",
    battingUrl:  "",
    pitchingUrl: "",
    rosterUrl:   "",
  },
  lions: {
    league: "pacific",
    battingUrl:  "",
    pitchingUrl: "",
    rosterUrl:   "",
  },
  fighters: {
    league: "pacific",
    battingUrl:  "",
    pitchingUrl: "",
    rosterUrl:   "",
  },
  marines: {
    league: "pacific",
    battingUrl:  "",
    pitchingUrl: "",
    rosterUrl:   "",
  },
  eagles: {
    league: "pacific",
    battingUrl:  "",
    pitchingUrl: "",
    rosterUrl:   "",
  },
  buffaloes: {
    league: "pacific",
    battingUrl:  "",
    pitchingUrl: "",
    rosterUrl:   "",
  },
};
