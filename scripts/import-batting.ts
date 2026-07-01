#!/usr/bin/env tsx
/**
 * 打撃成績インポートスクリプト
 *
 * Usage:
 *   echo "<TSV>" | ./node_modules/.bin/tsx scripts/import-batting.ts <teamId> [--year <year>]
 *
 * TSV列順（npb.jp 実際の順序）:
 *   選手名(0) 試合(1) 打席(2) 打数(3) 得点(4) 安打(5) 二塁打(6) 三塁打(7) 本塁打(8) 塁打(9)
 *   打点(10) 犠打(11) 盗塁死(12) 盗塁(13) 犠飛(14) 四球(15) 故意四球(16) 死球(17)
 *   三振(18) 併殺打(19) 打率(20) 長打率(21) 出塁率(22) OPS(23)
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
  intentionalWalks: number;
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
  if (cols.length < 20) return; // ヘッダー行やデータ不足はスキップ（実テーブルは23列）

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

  const runs    = num(cols[4]);   // 得点
  const hits    = num(cols[5]);   // 安打
  const doubles = num(cols[6]);   // 二塁打
  const triples = num(cols[7]);   // 三塁打
  const hr      = num(cols[8]);   // 本塁打
  // col[9] = 塁打(TB) — skip
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
    rbi:                num(cols[10]),  // 打点
    runs,
    strikeouts:         num(cols[18]),  // 三振
    walks:              num(cols[15]),  // 四球
    intentionalWalks:   num(cols[16]),  // 故意四球
    hitByPitch:         num(cols[17]),  // 死球
    sacrificeHits:      num(cols[11]),  // 犠打
    sacrificeFlies:     num(cols[14]),  // 犠飛
    stolenBases:        num(cols[13]),  // 盗塁
    caughtStealing:     num(cols[12]),  // 盗塁死
    doublePlayGrounded: num(cols[19]),  // 併殺打
    avg: num(cols[20]),  // 打率
    slg: num(cols[21]),  // 長打率
    obp: num(cols[22]),  // 出塁率
    ops: num(cols[23]),  // OPS
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
    `intentionalWalks: ${String(r.intentionalWalks).padStart(2)}, ` +
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
