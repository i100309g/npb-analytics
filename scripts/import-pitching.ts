#!/usr/bin/env tsx
/**
 * 投手成績インポートスクリプト
 *
 * Usage:
 *   echo "<TSV>" | ./node_modules/.bin/tsx scripts/import-pitching.ts <teamId>
 *
 * TSV列順（npb.jp 実際の順序）:
 *   選手名(0) 試合(1) 勝(2) 負(3) SV(4) H(5) HP(6) 完封(7) 先発(8) 完投(9) 勝率(10)
 *   被打者(11) 投球回(12) 被安打(13) 被本塁打(14) 与四球(15) 暴投(16) 与死球(17)
 *   奪三振(18) 奪三振率(19) ?(20) 失点(21) 自責点(22) 防御率(23)
 *
 * - "-" は 0 として扱う（登板なし選手）
 * - 推論なし: マッチしない選手名は WARN を出力してスキップ
 * - WHIP・K/9 は列が存在しないため IP・奪三振・四球から算出
 */
import * as readline from "readline";
import * as fs from "fs";
import * as path from "path";
import { buildLookup, lookupId } from "./lib/player-lookup";

const args = process.argv.slice(2);
const teamId = args[0];
if (!teamId) {
  console.error("Usage: tsx scripts/import-pitching.ts <teamId> [--year <year>]");
  process.exit(1);
}
const yearFlag = args.indexOf("--year");
const year = yearFlag !== -1 ? parseInt(args[yearFlag + 1], 10) : 2025;
if (isNaN(year)) {
  console.error("--year には数値を指定してください");
  process.exit(1);
}

const lookup = buildLookup(teamId);

function num(s: string): number {
  if (!s || s === "-" || s === "") return 0;
  return parseFloat(s);
}

/** 投球回を小数に変換 ("6.1" → 6.333...) */
function parseIP(s: string): number {
  if (!s || s === "-" || s === "") return 0;
  const parts = s.split(".");
  const full = parseInt(parts[0], 10) || 0;
  const thirds = parts[1] ? parseInt(parts[1], 10) : 0;
  return full + thirds / 3;
}

interface PitchingRow {
  playerId: string;
  games: number;
  starts: number;
  completeGames: number;
  shutouts: number;
  wins: number;
  losses: number;
  saves: number;
  holds: number;
  inningsPitched: number;
  hitsAllowed: number;
  homeRunsAllowed: number;
  strikeouts: number;
  walksAllowed: number;
  hitBatters: number;
  runsAllowed: number;
  earnedRuns: number;
  era: number;
  whip: number;
  kPer9: number;
}

const rows: PitchingRow[] = [];
const unmatched: string[] = [];
const rl = readline.createInterface({ input: process.stdin });

rl.on("line", (line) => {
  const cols = line.split("\t");
  if (cols.length < 20) return;

  const name = cols[0].trim();
  if (name === "選手名" || !name) return;

  if (cols.slice(1).every(c => c.trim() === "-" || c.trim() === "")) return;

  const games = num(cols[1]);
  if (games === 0) return;

  const id = lookupId(lookup, name);
  if (!id) {
    unmatched.push(name);
    return;
  }

  const ip    = parseIP(cols[12]);
  const walks = num(cols[15]);
  const ks    = num(cols[18]);
  const ha    = num(cols[13]);

  rows.push({
    playerId:        id,
    games,
    starts:          num(cols[8]),
    completeGames:   num(cols[9]),
    shutouts:        num(cols[7]),
    wins:            num(cols[2]),
    losses:          num(cols[3]),
    holds:           num(cols[5]),
    saves:           num(cols[4]),
    inningsPitched:  ip,
    hitsAllowed:     ha,
    homeRunsAllowed: num(cols[14]),
    strikeouts:      ks,
    walksAllowed:    walks,
    hitBatters:      num(cols[17]),
    runsAllowed:     num(cols[21]),
    earnedRuns:      num(cols[22]),
    era:             num(cols[23]),
    whip:            ip > 0 ? (ha + walks) / ip : 0,
    kPer9:           ip > 0 ? (ks * 9) / ip : 0,
  });
});

rl.on("close", () => {
  if (unmatched.length > 0) {
    console.error(`\n⚠️  マッチしない選手名（${unmatched.length}件）:`);
    for (const n of unmatched) console.error(`   WARN: "${n}" → ID不明, スキップ`);
    console.error("");
  }

  if (rows.length === 0) {
    console.error("エラー: インポートできる行がありません");
    process.exit(1);
  }

  const tsLines = rows.map(r => {
    const ip = r.inningsPitched;
    const bbPer9 = ip > 0 ? (r.walksAllowed * 9) / ip : 0;
    return (
      `  { playerId: "${r.playerId}", seasonYear: ${year}, ` +
      `games: ${String(r.games).padStart(3)}, ` +
      `starts: ${String(r.starts).padStart(2)}, ` +
      `completeGames: ${r.completeGames}, ` +
      `shutouts: ${r.shutouts}, ` +
      `wins: ${String(r.wins).padStart(2)}, ` +
      `losses: ${String(r.losses).padStart(2)}, ` +
      `saves: ${String(r.saves).padStart(2)}, ` +
      `holds: ${String(r.holds).padStart(2)}, ` +
      `blownSaves: 0, ` +
      `inningsPitched: ${ip.toFixed(2)}, ` +
      `hitsAllowed: ${String(r.hitsAllowed).padStart(3)}, ` +
      `runsAllowed: ${String(r.runsAllowed).padStart(3)}, ` +
      `earnedRuns: ${String(r.earnedRuns).padStart(3)}, ` +
      `walksAllowed: ${String(r.walksAllowed).padStart(2)}, ` +
      `intentionalWalks: 0, ` +
      `hitBatters: ${String(r.hitBatters).padStart(2)}, ` +
      `strikeouts: ${String(r.strikeouts).padStart(3)}, ` +
      `homeRunsAllowed: ${String(r.homeRunsAllowed).padStart(2)}, ` +
      `era: ${r.era.toFixed(2)}, ` +
      `whip: ${r.whip.toFixed(2)}, ` +
      `kPer9: ${r.kPer9.toFixed(2)}, ` +
      `bbPer9: ${bbPer9.toFixed(2)}, ` +
      `qualityStarts: 0 },`
    );
  });

  const PACIFIC = ["hawks", "lions", "fighters", "marines", "eagles", "buffaloes"];
  const league  = PACIFIC.includes(teamId) ? "pacific" : "central";
  const seedFile = path.join(__dirname, `../prisma/seed-data/pitching-stats-${league}.ts`);
  const content = fs.readFileSync(seedFile, "utf-8");

  const sectionComment = `// ── ${teamId} ${year}`;
  const startIdx = content.indexOf(sectionComment);
  if (startIdx === -1) {
    const insertPos = content.lastIndexOf("];");
    const newSection = `\n  // ── ${teamId} ${year} ──────────────────────\n${tsLines.join("\n")}\n`;
    const updated = content.slice(0, insertPos) + newSection + content.slice(insertPos);
    fs.writeFileSync(seedFile, updated);
    console.log(`✅ ${teamId} ${year}: ${rows.length}件追加（新規セクション）`);
    return;
  }

  const nextSection = content.indexOf("\n  // ──", startIdx + 1);
  const endIdx = nextSection === -1 ? content.lastIndexOf("];") : nextSection;

  const headerEnd = content.indexOf("\n", startIdx) + 1;
  const teamHeader = content.slice(startIdx, headerEnd);
  const newContent =
    content.slice(0, startIdx) +
    teamHeader +
    tsLines.join("\n") + "\n" +
    content.slice(endIdx);

  fs.writeFileSync(seedFile, newContent);
  console.log(`✅ ${teamId} ${year}: ${rows.length}件で投手成績を更新`);
  if (unmatched.length > 0) {
    console.log(`⚠️  スキップ: ${unmatched.join(", ")}`);
  }
});
