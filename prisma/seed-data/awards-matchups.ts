export const awards: {
  seasonYear: number;
  playerId: string;
  awardName: string;
  league: string;
}[] = [
  // MVP
  { seasonYear: 2024, playerId: "giants-1", awardName: "MVP", league: "セントラル" },
  { seasonYear: 2024, playerId: "hawks-1", awardName: "MVP", league: "パシフィック" },

  // 首位打者 (Batting Title)
  { seasonYear: 2024, playerId: "tigers-1", awardName: "首位打者", league: "セントラル" },
  { seasonYear: 2024, playerId: "hawks-1", awardName: "首位打者", league: "パシフィック" },

  // 本塁打王 (Home Run King)
  { seasonYear: 2024, playerId: "giants-1", awardName: "本塁打王", league: "セントラル" },
  { seasonYear: 2024, playerId: "eagles-2", awardName: "本塁打王", league: "パシフィック" },

  // 打点王 (RBI King)
  { seasonYear: 2024, playerId: "baystars-2", awardName: "打点王", league: "セントラル" },
  { seasonYear: 2024, playerId: "hawks-2", awardName: "打点王", league: "パシフィック" },

  // 最多勝 (Most Wins)
  { seasonYear: 2024, playerId: "baystars-4", awardName: "最多勝", league: "セントラル" },
  { seasonYear: 2024, playerId: "hawks-4", awardName: "最多勝", league: "パシフィック" },

  // 最優秀防御率 (Best ERA)
  { seasonYear: 2024, playerId: "giants-4", awardName: "最優秀防御率", league: "セントラル" },
  { seasonYear: 2024, playerId: "buffaloes-4", awardName: "最優秀防御率", league: "パシフィック" },

  // 最多奪三振 (Most Strikeouts)
  { seasonYear: 2024, playerId: "tigers-4", awardName: "最多奪三振", league: "セントラル" },
  { seasonYear: 2024, playerId: "hawks-4", awardName: "最多奪三振", league: "パシフィック" },

  // 沢村賞 (Sawamura Award — no league)
  { seasonYear: 2024, playerId: "hawks-4", awardName: "沢村賞", league: "" },

  // 新人王 (Rookie of the Year)
  { seasonYear: 2024, playerId: "carp-3", awardName: "新人王", league: "セントラル" },
  { seasonYear: 2024, playerId: "fighters-2", awardName: "新人王", league: "パシフィック" },

  // GG賞 (Golden Glove) — 9 awards, one per defensive position
  // P
  { seasonYear: 2024, playerId: "baystars-4", awardName: "GG賞", league: "セントラル" },
  // C
  { seasonYear: 2024, playerId: "tigers-3", awardName: "GG賞", league: "セントラル" },
  // 1B
  { seasonYear: 2024, playerId: "giants-2", awardName: "GG賞", league: "セントラル" },
  // 2B
  { seasonYear: 2024, playerId: "carp-1", awardName: "GG賞", league: "セントラル" },
  // 3B
  { seasonYear: 2024, playerId: "swallows-2", awardName: "GG賞", league: "パシフィック" },
  // SS
  { seasonYear: 2024, playerId: "marines-1", awardName: "GG賞", league: "パシフィック" },
  // OF
  { seasonYear: 2024, playerId: "hawks-2", awardName: "GG賞", league: "パシフィック" },
  // OF
  { seasonYear: 2024, playerId: "eagles-1", awardName: "GG賞", league: "パシフィック" },
  // OF
  { seasonYear: 2024, playerId: "lions-3", awardName: "GG賞", league: "パシフィック" },
];

export const matchups: {
  seasonYear: number;
  batterId: string;
  pitcherId: string;
  atBats: number;
  hits: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  rbi: number;
  walks: number;
  intentionalWalks: number;
  strikeouts: number;
  hitByPitch: number;
  sacrificeFlies: number;
  avg: number;
  ops: number;
}[] = [
  // giants batters vs non-giants pitchers
  {
    seasonYear: 2024, batterId: "giants-1", pitcherId: "tigers-4",
    atBats: 32, hits: 11, doubles: 2, triples: 0, homeRuns: 3,
    rbi: 8, walks: 5, intentionalWalks: 2, strikeouts: 7,
    hitByPitch: 0, sacrificeFlies: 1, avg: 0.344, ops: 1.032,
  },
  {
    seasonYear: 2024, batterId: "giants-1", pitcherId: "hawks-4",
    atBats: 28, hits: 9, doubles: 1, triples: 0, homeRuns: 4,
    rbi: 10, walks: 6, intentionalWalks: 3, strikeouts: 8,
    hitByPitch: 1, sacrificeFlies: 0, avg: 0.321, ops: 1.071,
  },
  {
    seasonYear: 2024, batterId: "giants-2", pitcherId: "baystars-5",
    atBats: 22, hits: 6, doubles: 2, triples: 0, homeRuns: 1,
    rbi: 4, walks: 3, intentionalWalks: 0, strikeouts: 5,
    hitByPitch: 0, sacrificeFlies: 1, avg: 0.273, ops: 0.818,
  },
  {
    seasonYear: 2024, batterId: "giants-3", pitcherId: "swallows-4",
    atBats: 18, hits: 5, doubles: 1, triples: 1, homeRuns: 0,
    rbi: 2, walks: 2, intentionalWalks: 0, strikeouts: 4,
    hitByPitch: 0, sacrificeFlies: 0, avg: 0.278, ops: 0.778,
  },
  // tigers batters vs non-tigers pitchers
  {
    seasonYear: 2024, batterId: "tigers-1", pitcherId: "giants-4",
    atBats: 35, hits: 13, doubles: 3, triples: 1, homeRuns: 1,
    rbi: 6, walks: 4, intentionalWalks: 1, strikeouts: 5,
    hitByPitch: 1, sacrificeFlies: 0, avg: 0.371, ops: 1.021,
  },
  {
    seasonYear: 2024, batterId: "tigers-1", pitcherId: "eagles-5",
    atBats: 20, hits: 7, doubles: 2, triples: 0, homeRuns: 1,
    rbi: 4, walks: 3, intentionalWalks: 1, strikeouts: 4,
    hitByPitch: 0, sacrificeFlies: 1, avg: 0.350, ops: 0.983,
  },
  {
    seasonYear: 2024, batterId: "tigers-2", pitcherId: "carp-6",
    atBats: 24, hits: 7, doubles: 1, triples: 0, homeRuns: 2,
    rbi: 5, walks: 2, intentionalWalks: 0, strikeouts: 6,
    hitByPitch: 0, sacrificeFlies: 0, avg: 0.292, ops: 0.875,
  },
  {
    seasonYear: 2024, batterId: "tigers-3", pitcherId: "dragons-4",
    atBats: 15, hits: 3, doubles: 0, triples: 0, homeRuns: 0,
    rbi: 1, walks: 1, intentionalWalks: 0, strikeouts: 5,
    hitByPitch: 0, sacrificeFlies: 0, avg: 0.200, ops: 0.567,
  },
  // baystars batters vs non-baystars pitchers
  {
    seasonYear: 2024, batterId: "baystars-1", pitcherId: "swallows-5",
    atBats: 26, hits: 8, doubles: 2, triples: 0, homeRuns: 2,
    rbi: 7, walks: 3, intentionalWalks: 0, strikeouts: 6,
    hitByPitch: 1, sacrificeFlies: 0, avg: 0.308, ops: 0.923,
  },
  {
    seasonYear: 2024, batterId: "baystars-2", pitcherId: "marines-4",
    atBats: 30, hits: 9, doubles: 2, triples: 0, homeRuns: 3,
    rbi: 11, walks: 4, intentionalWalks: 2, strikeouts: 7,
    hitByPitch: 0, sacrificeFlies: 1, avg: 0.300, ops: 0.967,
  },
  {
    seasonYear: 2024, batterId: "baystars-2", pitcherId: "hawks-5",
    atBats: 25, hits: 8, doubles: 1, triples: 0, homeRuns: 2,
    rbi: 6, walks: 5, intentionalWalks: 1, strikeouts: 6,
    hitByPitch: 0, sacrificeFlies: 0, avg: 0.320, ops: 0.980,
  },
  {
    seasonYear: 2024, batterId: "baystars-3", pitcherId: "tigers-6",
    atBats: 19, hits: 5, doubles: 1, triples: 0, homeRuns: 0,
    rbi: 2, walks: 2, intentionalWalks: 0, strikeouts: 4,
    hitByPitch: 0, sacrificeFlies: 0, avg: 0.263, ops: 0.737,
  },
  // carp batters vs non-carp pitchers
  {
    seasonYear: 2024, batterId: "carp-1", pitcherId: "giants-5",
    atBats: 27, hits: 8, doubles: 2, triples: 0, homeRuns: 1,
    rbi: 4, walks: 3, intentionalWalks: 0, strikeouts: 5,
    hitByPitch: 0, sacrificeFlies: 1, avg: 0.296, ops: 0.852,
  },
  {
    seasonYear: 2024, batterId: "carp-2", pitcherId: "buffaloes-4",
    atBats: 21, hits: 5, doubles: 1, triples: 1, homeRuns: 0,
    rbi: 3, walks: 2, intentionalWalks: 0, strikeouts: 7,
    hitByPitch: 1, sacrificeFlies: 0, avg: 0.238, ops: 0.738,
  },
  {
    seasonYear: 2024, batterId: "carp-3", pitcherId: "swallows-6",
    atBats: 16, hits: 5, doubles: 1, triples: 0, homeRuns: 1,
    rbi: 3, walks: 2, intentionalWalks: 0, strikeouts: 3,
    hitByPitch: 0, sacrificeFlies: 0, avg: 0.313, ops: 0.938,
  },
  // dragons batters vs non-dragons pitchers
  {
    seasonYear: 2024, batterId: "dragons-1", pitcherId: "tigers-5",
    atBats: 23, hits: 6, doubles: 1, triples: 0, homeRuns: 1,
    rbi: 4, walks: 2, intentionalWalks: 0, strikeouts: 6,
    hitByPitch: 0, sacrificeFlies: 0, avg: 0.261, ops: 0.774,
  },
  {
    seasonYear: 2024, batterId: "dragons-2", pitcherId: "lions-4",
    atBats: 18, hits: 4, doubles: 0, triples: 0, homeRuns: 1,
    rbi: 3, walks: 2, intentionalWalks: 0, strikeouts: 5,
    hitByPitch: 0, sacrificeFlies: 0, avg: 0.222, ops: 0.722,
  },
  {
    seasonYear: 2024, batterId: "dragons-3", pitcherId: "baystars-6",
    atBats: 14, hits: 3, doubles: 1, triples: 0, homeRuns: 0,
    rbi: 1, walks: 1, intentionalWalks: 0, strikeouts: 4,
    hitByPitch: 0, sacrificeFlies: 0, avg: 0.214, ops: 0.643,
  },
  // swallows batters vs non-swallows pitchers
  {
    seasonYear: 2024, batterId: "swallows-1", pitcherId: "carp-4",
    atBats: 29, hits: 9, doubles: 2, triples: 0, homeRuns: 2,
    rbi: 6, walks: 3, intentionalWalks: 0, strikeouts: 7,
    hitByPitch: 1, sacrificeFlies: 0, avg: 0.310, ops: 0.931,
  },
  {
    seasonYear: 2024, batterId: "swallows-2", pitcherId: "fighters-5",
    atBats: 22, hits: 7, doubles: 2, triples: 1, homeRuns: 1,
    rbi: 5, walks: 3, intentionalWalks: 0, strikeouts: 4,
    hitByPitch: 0, sacrificeFlies: 1, avg: 0.318, ops: 0.977,
  },
  {
    seasonYear: 2024, batterId: "swallows-3", pitcherId: "dragons-5",
    atBats: 17, hits: 4, doubles: 1, triples: 0, homeRuns: 0,
    rbi: 2, walks: 2, intentionalWalks: 0, strikeouts: 5,
    hitByPitch: 0, sacrificeFlies: 0, avg: 0.235, ops: 0.706,
  },
  // hawks batters vs non-hawks pitchers
  {
    seasonYear: 2024, batterId: "hawks-1", pitcherId: "marines-5",
    atBats: 34, hits: 13, doubles: 3, triples: 0, homeRuns: 2,
    rbi: 9, walks: 6, intentionalWalks: 2, strikeouts: 6,
    hitByPitch: 0, sacrificeFlies: 1, avg: 0.382, ops: 1.088,
  },
  {
    seasonYear: 2024, batterId: "hawks-1", pitcherId: "lions-6",
    atBats: 28, hits: 10, doubles: 2, triples: 1, homeRuns: 1,
    rbi: 5, walks: 4, intentionalWalks: 1, strikeouts: 5,
    hitByPitch: 1, sacrificeFlies: 0, avg: 0.357, ops: 0.964,
  },
  {
    seasonYear: 2024, batterId: "hawks-2", pitcherId: "eagles-4",
    atBats: 31, hits: 10, doubles: 1, triples: 0, homeRuns: 3,
    rbi: 12, walks: 5, intentionalWalks: 2, strikeouts: 7,
    hitByPitch: 0, sacrificeFlies: 1, avg: 0.323, ops: 1.015,
  },
  {
    seasonYear: 2024, batterId: "hawks-3", pitcherId: "buffaloes-5",
    atBats: 20, hits: 6, doubles: 2, triples: 0, homeRuns: 1,
    rbi: 4, walks: 2, intentionalWalks: 0, strikeouts: 5,
    hitByPitch: 0, sacrificeFlies: 0, avg: 0.300, ops: 0.900,
  },
  // marines batters vs non-marines pitchers
  {
    seasonYear: 2024, batterId: "marines-1", pitcherId: "buffaloes-6",
    atBats: 24, hits: 7, doubles: 2, triples: 0, homeRuns: 1,
    rbi: 4, walks: 3, intentionalWalks: 0, strikeouts: 6,
    hitByPitch: 0, sacrificeFlies: 0, avg: 0.292, ops: 0.875,
  },
  {
    seasonYear: 2024, batterId: "marines-2", pitcherId: "giants-6",
    atBats: 19, hits: 5, doubles: 1, triples: 0, homeRuns: 0,
    rbi: 2, walks: 2, intentionalWalks: 0, strikeouts: 5,
    hitByPitch: 1, sacrificeFlies: 0, avg: 0.263, ops: 0.737,
  },
  {
    seasonYear: 2024, batterId: "marines-3", pitcherId: "fighters-4",
    atBats: 15, hits: 3, doubles: 0, triples: 0, homeRuns: 1,
    rbi: 2, walks: 1, intentionalWalks: 0, strikeouts: 4,
    hitByPitch: 0, sacrificeFlies: 0, avg: 0.200, ops: 0.733,
  },
  // eagles batters vs non-eagles pitchers
  {
    seasonYear: 2024, batterId: "eagles-1", pitcherId: "hawks-6",
    atBats: 26, hits: 8, doubles: 1, triples: 0, homeRuns: 2,
    rbi: 6, walks: 3, intentionalWalks: 1, strikeouts: 7,
    hitByPitch: 0, sacrificeFlies: 0, avg: 0.308, ops: 0.923,
  },
  {
    seasonYear: 2024, batterId: "eagles-2", pitcherId: "lions-5",
    atBats: 33, hits: 9, doubles: 1, triples: 0, homeRuns: 5,
    rbi: 14, walks: 7, intentionalWalks: 3, strikeouts: 10,
    hitByPitch: 1, sacrificeFlies: 1, avg: 0.273, ops: 1.091,
  },
  {
    seasonYear: 2024, batterId: "eagles-2", pitcherId: "marines-6",
    atBats: 28, hits: 8, doubles: 0, triples: 0, homeRuns: 4,
    rbi: 11, walks: 6, intentionalWalks: 2, strikeouts: 9,
    hitByPitch: 0, sacrificeFlies: 1, avg: 0.286, ops: 1.036,
  },
  {
    seasonYear: 2024, batterId: "eagles-3", pitcherId: "fighters-6",
    atBats: 16, hits: 4, doubles: 1, triples: 0, homeRuns: 0,
    rbi: 2, walks: 2, intentionalWalks: 0, strikeouts: 4,
    hitByPitch: 0, sacrificeFlies: 0, avg: 0.250, ops: 0.750,
  },
  // buffaloes batters vs non-buffaloes pitchers
  {
    seasonYear: 2024, batterId: "buffaloes-1", pitcherId: "eagles-6",
    atBats: 25, hits: 7, doubles: 2, triples: 0, homeRuns: 1,
    rbi: 4, walks: 3, intentionalWalks: 0, strikeouts: 6,
    hitByPitch: 0, sacrificeFlies: 0, avg: 0.280, ops: 0.840,
  },
  {
    seasonYear: 2024, batterId: "buffaloes-2", pitcherId: "hawks-4",
    atBats: 30, hits: 7, doubles: 1, triples: 0, homeRuns: 1,
    rbi: 3, walks: 3, intentionalWalks: 0, strikeouts: 9,
    hitByPitch: 0, sacrificeFlies: 0, avg: 0.233, ops: 0.700,
  },
  {
    seasonYear: 2024, batterId: "buffaloes-3", pitcherId: "marines-4",
    atBats: 13, hits: 3, doubles: 1, triples: 0, homeRuns: 0,
    rbi: 1, walks: 1, intentionalWalks: 0, strikeouts: 3,
    hitByPitch: 0, sacrificeFlies: 0, avg: 0.231, ops: 0.692,
  },
  // lions batters vs non-lions pitchers
  {
    seasonYear: 2024, batterId: "lions-1", pitcherId: "fighters-5",
    atBats: 27, hits: 7, doubles: 2, triples: 0, homeRuns: 1,
    rbi: 5, walks: 3, intentionalWalks: 0, strikeouts: 7,
    hitByPitch: 1, sacrificeFlies: 0, avg: 0.259, ops: 0.815,
  },
  {
    seasonYear: 2024, batterId: "lions-2", pitcherId: "buffaloes-4",
    atBats: 22, hits: 5, doubles: 0, triples: 0, homeRuns: 2,
    rbi: 4, walks: 2, intentionalWalks: 1, strikeouts: 6,
    hitByPitch: 0, sacrificeFlies: 0, avg: 0.227, ops: 0.818,
  },
  {
    seasonYear: 2024, batterId: "lions-3", pitcherId: "eagles-5",
    atBats: 17, hits: 5, doubles: 1, triples: 1, homeRuns: 0,
    rbi: 2, walks: 2, intentionalWalks: 0, strikeouts: 3,
    hitByPitch: 0, sacrificeFlies: 1, avg: 0.294, ops: 0.912,
  },
  // fighters batters vs non-fighters pitchers
  {
    seasonYear: 2024, batterId: "fighters-1", pitcherId: "marines-5",
    atBats: 24, hits: 7, doubles: 2, triples: 0, homeRuns: 1,
    rbi: 4, walks: 4, intentionalWalks: 0, strikeouts: 6,
    hitByPitch: 0, sacrificeFlies: 0, avg: 0.292, ops: 0.875,
  },
  {
    seasonYear: 2024, batterId: "fighters-2", pitcherId: "lions-4",
    atBats: 20, hits: 7, doubles: 2, triples: 1, homeRuns: 1,
    rbi: 5, walks: 3, intentionalWalks: 0, strikeouts: 4,
    hitByPitch: 1, sacrificeFlies: 0, avg: 0.350, ops: 1.050,
  },
  {
    seasonYear: 2024, batterId: "fighters-3", pitcherId: "hawks-6",
    atBats: 13, hits: 3, doubles: 0, triples: 0, homeRuns: 0,
    rbi: 1, walks: 1, intentionalWalks: 0, strikeouts: 4,
    hitByPitch: 0, sacrificeFlies: 0, avg: 0.231, ops: 0.692,
  },
];
