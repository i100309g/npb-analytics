export type League = "セントラル" | "パシフィック";

export interface Team {
  id: string;
  name: string;
  shortName: string;
  league: League;
  city: string;
  color: string;
  wins: number;
  losses: number;
  draws: number;
}

export interface Player {
  id: string;
  teamId: string;
  name: string;
  position: string;
  // Batter stats
  avg?: number;
  hr?: number;
  rbi?: number;
  ops?: number;
  // Pitcher stats
  era?: number;
  wins?: number;
  losses?: number;
  so?: number;
}

export const teams: Team[] = [
  { id: "giants", name: "読売ジャイアンツ", shortName: "巨人", league: "セントラル", city: "東京", color: "#FF6600", wins: 68, losses: 58, draws: 17 },
  { id: "tigers", name: "阪神タイガース", shortName: "阪神", league: "セントラル", city: "兵庫", color: "#FFE100", wins: 74, losses: 55, draws: 14 },
  { id: "baystars", name: "横浜DeNAベイスターズ", shortName: "DeNA", league: "セントラル", city: "神奈川", color: "#004B93", wins: 71, losses: 57, draws: 15 },
  { id: "carp", name: "広島東洋カープ", shortName: "広島", league: "セントラル", city: "広島", color: "#CC0000", wins: 66, losses: 60, draws: 17 },
  { id: "dragons", name: "中日ドラゴンズ", shortName: "中日", league: "セントラル", city: "愛知", color: "#003087", wins: 62, losses: 65, draws: 16 },
  { id: "swallows", name: "東京ヤクルトスワローズ", shortName: "ヤクルト", league: "セントラル", city: "東京", color: "#00A040", wins: 55, losses: 72, draws: 16 },
  { id: "hawks", name: "福岡ソフトバンクホークス", shortName: "SB", league: "パシフィック", city: "福岡", color: "#F6D100", wins: 80, losses: 49, draws: 14 },
  { id: "marines", name: "千葉ロッテマリーンズ", shortName: "ロッテ", league: "パシフィック", city: "千葉", color: "#000000", wins: 70, losses: 57, draws: 16 },
  { id: "eagles", name: "東北楽天ゴールデンイーグルス", shortName: "楽天", league: "パシフィック", city: "宮城", color: "#860019", wins: 65, losses: 62, draws: 16 },
  { id: "buffaloes", name: "オリックス・バファローズ", shortName: "Bs", league: "パシフィック", city: "大阪", color: "#0F2E7A", wins: 62, losses: 65, draws: 16 },
  { id: "lions", name: "埼玉西武ライオンズ", shortName: "西武", league: "パシフィック", city: "埼玉", color: "#00568C", wins: 55, losses: 73, draws: 15 },
  { id: "fighters", name: "北海道日本ハムファイターズ", shortName: "日ハム", league: "パシフィック", city: "北海道", color: "#003D7D", wins: 52, losses: 75, draws: 16 },
];

export const players: Player[] = [
  { id: "p1", teamId: "hawks", name: "近藤 健介", position: "外野手", avg: 0.323, hr: 18, rbi: 82, ops: 0.982 },
  { id: "p2", teamId: "tigers", name: "森下 翔太", position: "外野手", avg: 0.311, hr: 22, rbi: 91, ops: 0.921 },
  { id: "p3", teamId: "baystars", name: "牧 秀悟", position: "二塁手", avg: 0.298, hr: 29, rbi: 98, ops: 0.905 },
  { id: "p4", teamId: "giants", name: "岡本 和真", position: "一塁手", avg: 0.285, hr: 36, rbi: 112, ops: 0.953 },
  { id: "p5", teamId: "carp", name: "秋山 翔吾", position: "外野手", avg: 0.302, hr: 8, rbi: 55, ops: 0.812 },
  { id: "p6", teamId: "marines", name: "角中 勝也", position: "外野手", avg: 0.291, hr: 5, rbi: 42, ops: 0.771 },
  { id: "p7", teamId: "eagles", name: "浅村 栄斗", position: "二塁手", avg: 0.276, hr: 24, rbi: 87, ops: 0.861 },
  { id: "p8", teamId: "swallows", name: "村上 宗隆", position: "三塁手", avg: 0.262, hr: 31, rbi: 94, ops: 0.893 },
  { id: "p9", teamId: "hawks", name: "有原 航平", position: "投手", era: 2.18, wins: 14, losses: 5, so: 182 },
  { id: "p10", teamId: "tigers", name: "青柳 晃洋", position: "投手", era: 2.65, wins: 12, losses: 7, so: 158 },
  { id: "p11", teamId: "baystars", name: "東 克樹", position: "投手", era: 2.35, wins: 15, losses: 6, so: 167 },
  { id: "p12", teamId: "giants", name: "戸郷 翔征", position: "投手", era: 2.51, wins: 13, losses: 8, so: 176 },
  { id: "p13", teamId: "eagles", name: "田中 将大", position: "投手", era: 3.12, wins: 10, losses: 9, so: 134 },
  { id: "p14", teamId: "lions", name: "今井 達也", position: "投手", era: 2.89, wins: 11, losses: 10, so: 161 },
  { id: "p15", teamId: "buffaloes", name: "山本 由伸", position: "投手", era: 1.98, wins: 16, losses: 4, so: 215 },
  { id: "p16", teamId: "dragons", name: "柳 裕也", position: "投手", era: 3.01, wins: 9, losses: 11, so: 142 },
];

export function getTeamById(id: string): Team | undefined {
  return teams.find((t) => t.id === id);
}

export function getPlayersByTeam(teamId: string): Player[] {
  return players.filter((p) => p.teamId === teamId);
}

export function getWinRate(team: Team): number {
  return team.wins / (team.wins + team.losses);
}
