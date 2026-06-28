#!/usr/bin/env tsx
/**
 * 打撃成績インポートスクリプト
 *
 * Usage:
 *   echo "<TSV>" | ./node_modules/.bin/tsx scripts/import-batting.ts <teamId> [--year <year>]
 *
 * TSV列順（公式サイト形式）:
 *   選手名 打率 試合 打席 打数 安打 二塁打 三塁打 本塁打 塁打 打点 得点 三振 四球 死球 犠打 犠飛 盗塁 盗塁死 併殺打 出塁率 長打率 OPS 得点圏打率 失策
 *
 * - "-" は 0 として扱う（打席なし選手）
 * - 推論なし: マッチしない選手名は WARN を出力してスキップ
 */
import * as readline from "readline";
import * as fs from "fs";
import * as path from "path";
import { buildLookup, lookupId } from "./lib/player-lookup";

const args = process.argv.slice(2);
const teamId = args[0];
if (!teamId) {
  console.error("Usage: tsx scripts/import-batting.ts <teamId> [--year <year>]");
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

interface BattingRow {
  playerId: string;
  games: number;
  plateAppearances: number;
  atBats: number;
  hits: number;
  singles: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  rbi: number;
  runs: number;
  strikeouts: number;
  walks: number;
  hitByPitch: number;
  sacrificeHits: number;
  sacrificeFlies: number;
  stolenBases: number;
  caughtStealing: number;
  doublePlayGrounded: number;
  avg: number;
  obp: number;
  slg: number;
  ops: number;
}

const rows: BattingRow[] = [];
const unmatched: string[] = [];
const rl = readline.createInterface({ input: process.stdin });

rl.on("line", (line) => {
  const cols = line.split("\t");
  if (cols.length < 20) return; // ヘッダー行やデータ不足はスキップ

  const name = cols[0].trim();
  if (name === "選手名" || !name) return; // ヘッダー行スキップ

  // 全列が"-"なら出場なし → スキップ
  if (cols.slice(1).every(c => c.trim() === "-" || c.trim() === "")) return;

  // 打席数=0(または"-")かつ試合もなし → スキップ
  const games = num(cols[2]);
  const pa = num(cols[3]);
  const ab = num(cols[4]);
  if (pa === 0 && ab === 0) return;

  const id = lookupId(lookup, name);
  if (!id) {
    unmatched.push(name);
    return;
  }

  const hits    = num(cols[5]);
  const doubles = num(cols[6]);
  const triples = num(cols[7]);
  const hr      = num(cols[8]);
  const singles = Math.max(0, hits - doubles - triples - hr);

  rows.push({
    playerId:           id,
    games,
    plateAppearances:   pa,
    atBats:             ab,
    hits,
    singles,
    doubles,
    triples,
    homeRuns:           hr,
    rbi:                num(cols[10]),
    runs:               num(cols[11]),
    strikeouts:         num(cols[12]),
    walks:              num(cols[13]),
    hitByPitch:         num(cols[14]),
    sacrificeHits:      num(cols[15]),
    sacrificeFlies:     num(cols[16]),
    stolenBases:        num(cols[17]),
    caughtStealing:     num(cols[18]),
    doublePlayGrounded: num(cols[19]),
    avg: num(cols[1]),
    obp: num(cols[20]),
    slg: num(cols[21]),
    ops: num(cols[22]),
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

  // TypeScript行を生成
  const tsLines = rows.map(r =>
    `  { playerId: "${r.playerId.padEnd(14)}", seasonYear: ${year}, ` +
    `games: ${String(r.games).padStart(3)}, ` +
    `plateAppearances: ${String(r.plateAppearances).padStart(3)}, ` +
    `atBats: ${String(r.atBats).padStart(3)}, ` +
    `hits: ${String(r.hits).padStart(3)}, ` +
    `singles: ${String(r.singles).padStart(3)}, ` +
    `doubles: ${String(r.doubles).padStart(2)}, ` +
    `triples: ${r.triples}, ` +
    `homeRuns: ${String(r.homeRuns).padStart(2)}, ` +
    `rbi: ${String(r.rbi).padStart(3)}, ` +
    `runs: ${String(r.runs).padStart(3)}, ` +
    `walks: ${String(r.walks).padStart(2)}, ` +
    `intentionalWalks: 0, ` +
    `hitByPitch: ${String(r.hitByPitch).padStart(2)}, ` +
    `strikeouts: ${String(r.strikeouts).padStart(3)}, ` +
    `stolenBases: ${String(r.stolenBases).padStart(2)}, ` +
    `caughtStealing: ${r.caughtStealing}, ` +
    `doublePlayGrounded: ${String(r.doublePlayGrounded).padStart(2)}, ` +
    `sacrificeHits: ${String(r.sacrificeHits).padStart(2)}, ` +
    `sacrificeFlies: ${String(r.sacrificeFlies).padStart(2)}, ` +
    `avg: ${r.avg.toFixed(3)}, obp: ${r.obp.toFixed(3)}, slg: ${r.slg.toFixed(3)}, ops: ${r.ops.toFixed(3)} },`
  );

  // シードファイルを更新
  const seedFile = path.join(__dirname, "../prisma/seed-data/batting-stats-central.ts");
  const content = fs.readFileSync(seedFile, "utf-8");

  // チームセクションの開始・終了マーカーを探す
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

  // 次のチームセクション or ファイル末尾を探す
  const nextSection = content.indexOf("\n  // ──", startIdx + 1);
  const endIdx = nextSection === -1 ? content.lastIndexOf("];") : nextSection;

  // セクション見出し行を残してデータ部分だけ置換
  const headerEnd = content.indexOf("\n", startIdx) + 1;
  const teamHeader = content.slice(startIdx, headerEnd);
  const newContent =
    content.slice(0, startIdx) +
    teamHeader +
    tsLines.join("\n") + "\n" +
    content.slice(endIdx);

  fs.writeFileSync(seedFile, newContent);
  console.log(`✅ ${teamId} ${year}: ${rows.length}件でバッティング成績を更新`);
  if (unmatched.length > 0) {
    console.log(`⚠️  スキップ: ${unmatched.join(", ")}`);
  }
});
