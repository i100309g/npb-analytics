#!/usr/bin/env tsx
/**
 * 打撃成績インポートスクリプト
 *
 * Usage:
 *   echo "<TSV>" | ./node_modules/.bin/tsx scripts/import-batting.ts <teamId> [--year <year>]
 *
 * TSV列順（npb.jp 実際の順序）:
 *   選手名(0) 試合(1) 打席(2) 打数(3) 安打(4) 二塁打(5) 三塁打(6) 本塁打(7) 塁打(8)
 *   打点(9) 得点(10) 三振(11) 四球(12) 死球(13) 犠打(14) 犠飛(15) 盗塁(16)
 *   盗塁死(17) 併殺打(18) 打率(19) 出塁率(20) 長打率(21) OPS(22)
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
  const games = num(cols[1]);
  const pa    = num(cols[2]);
  const ab    = num(cols[3]);
  if (pa === 0 && ab === 0) return;

  const id = lookupId(lookup, name);
  if (!id) {
    unmatched.push(name);
    return;
  }

  const hits    = num(cols[4]);
  const doubles = num(cols[5]);
  const triples = num(cols[6]);
  const hr      = num(cols[7]);
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
    rbi:                num(cols[9]),
    runs:               num(cols[10]),
    strikeouts:         num(cols[11]),
    walks:              num(cols[12]),
    hitByPitch:         num(cols[13]),
    sacrificeHits:      num(cols[14]),
    sacrificeFlies:     num(cols[15]),
    stolenBases:        num(cols[16]),
    caughtStealing:     num(cols[17]),
    doublePlayGrounded: num(cols[18]),
    avg: num(cols[19]),
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
    `  { playerId: "${r.playerId}", seasonYear: ${year}, ` +
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

  // シードファイルを更新（リーグ別）
  const PACIFIC = ["hawks", "lions", "fighters", "marines", "eagles", "buffaloes"];
  const league  = PACIFIC.includes(teamId) ? "pacific" : "central";
  const seedFile = path.join(__dirname, `../prisma/seed-data/batting-stats-${league}.ts`);
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
