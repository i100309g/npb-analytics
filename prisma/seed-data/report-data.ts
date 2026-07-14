// このファイルは scripts/analyze-stats.ts が自動生成します。手動編集しないこと。
// 初回は空データ。npm run analyze を実行すると更新されます。

export const latestReport = {
  date: "",
  season: 0,
  overview: "",
  battingHighlights: [] as Array<{
    rank: number;
    playerId: string;
    playerName: string;
    teamName: string;
    highlight: string;
    wOBA: number;
    ops: number;
    avg: number;
    homeRuns: number;
    rbi: number;
    plateAppearances: number;
  }>,
  pitchingHighlights: [] as Array<{
    rank: number;
    playerId: string;
    playerName: string;
    teamName: string;
    highlight: string;
    era: number;
    whip: number;
    kPer9: number;
    wins: number;
    saves: number;
    inningsPitched: number;
  }>,
  generatedAt: "",
};
