#!/usr/bin/env tsx
/**
 * 投手成績インポートスクリプト
 *
 * Usage:
 *   echo "<TSV>" | ./node_modules/.bin/tsx scripts/import-pitching.ts <teamId>
 *
 * TSV列順（公式サイト形式）:
 *   選手名 防御率 登板 先発 交代完了 勝利 敗戦 ホールド HP セーブ 勝率 投球回 打者 被安打 被本塁打 奪三振 奪三振率 与四球 与死球 暴投 失点 自責点 被打率 K/BB WHIP
 *
 * - "-" は 0 として扱う（登板なし選手）
 * - 推論なし: マッチしない選手名は WARN を出力してスキップ
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

  const games = num(cols[2]);
  if (games === 0) return;

  const id = lookupId(lookup, name);
  if (!id) {
    unmatched.push(name);
    return;
  }

  const ip = parseIP(cols[11]);
  const walks = num(cols[17]);

  rows.push({
    playerId:      id,
    games,
    starts:        num(cols[3]),
    completeGames: num(cols[4]),
    wins:          num(cols[5]),
    losses:        num(cols[6]),
    holds:         num(cols[7]),
    saves:         num(cols[9]),
    inningsPitched: ip,
    hitsAllowed:   num(cols[13]),
    homeRunsAllowed: num(cols[14]),
    strikeouts:    num(cols[15]),
    walksAllowed:  walks,
    hitBatters:    num(cols[18]),
    runsAllowed:   num(cols[20]),
    earnedRuns:    num(cols[21]),
    era:           num(cols[1]),
    whip:          num(cols[24]),
    kPer9:         num(cols[16]),
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
      `  { playerId: "${r.playerId.padEnd(14)}", seasonYear: ${year}, ` +
      `games: ${String(r.games).padStart(3)}, ` +
      `starts: ${String(r.starts).padStart(2)}, ` +
      `completeGames: ${r.completeGames}, ` +
      `shutouts: 0, ` +
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

  const seedFile = path.join(__dirname, "../prisma/seed-data/pitching-stats-central.ts");
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
