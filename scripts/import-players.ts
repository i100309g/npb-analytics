#!/usr/bin/env tsx
/**
 * 選手データインポートスクリプト
 *
 * Usage:
 *   echo "<TSV>" | ./node_modules/.bin/tsx scripts/import-players.ts <teamId> [--file central|pacific]
 *
 * TSV列順:
 *   ポジション  背番号  選手名  フリガナ  投  打  生年月日  出身地  身長  体重  国籍
 *
 * ポジション値: 投手/捕手/一塁手/二塁手/三塁手/遊撃手/外野手/内野手
 * 投・打: 右/左/両(打のみ)
 * 国籍: 日本/外国
 *
 * - 選手名の完全一致でDBと照合（推論なし）
 * - 一致: ID維持・フィールド更新
 * - 不一致: 新規ID採番（teamId-{次の番号}）
 * - TSVに含まれないDB選手: WARN出力（自動変更なし）
 */
import * as readline from "readline";
import * as fs from "fs";
import * as path from "path";

const args = process.argv.slice(2);
const teamId = args[0];
if (!teamId) {
  console.error("Usage: tsx scripts/import-players.ts <teamId> [--file central|pacific]");
  process.exit(1);
}
const fileFlag = args.indexOf("--file");
const fileKey = fileFlag !== -1 ? args[fileFlag + 1] : "central";
if (fileKey !== "central" && fileKey !== "pacific") {
  console.error('--file must be "central" or "pacific"');
  process.exit(1);
}

const SEED_FILE = path.join(
  __dirname,
  `../prisma/seed-data/players-${fileKey}.ts`
);

function normalize(name: string): string {
  return name.replace(/[\s　・ ]/g, "");
}

interface PlayerEntry {
  id: string;
  teamId: string;
  jerseyNumber: number;
  name: string;
  nameKana: string;
  position: string;
  bats: string;
  throws: string;
  birthDate: string;
  birthPlace: string;
  height: number;
  weight: number;
  nationality: string;
  active: boolean;
}

// ── ファイルから既存選手データを解析 ──────────────────────────

function extractAllPlayers(content: string): PlayerEntry[] {
  const entries: PlayerEntry[] = [];
  // ブロック全体を取得するため、id: "xxx" を起点に各フィールドを抽出
  const re = /id:\s*"([^"]+)"[^{}]*?teamId:\s*"([^"]+)"[^{}]*?name:\s*"([^"]+)"[^{}]*?nameKana:\s*"([^"]+)"[^{}]*?jerseyNumber:\s*(\d+)[^{}]*?position:\s*"([^"]+)"[^{}]*?bats:\s*"([^"]+)"[^{}]*?throws:\s*"([^"]+)"[^{}]*?birthDate:\s*"([^"]+)"[^{}]*?birthPlace:\s*"([^"]+)"[^{}]*?height:\s*(\d+)[^{}]*?weight:\s*(\d+)[^{}]*?nationality:\s*"([^"]+)"[^{}]*?active:\s*(true|false)/gs;
  let m;
  while ((m = re.exec(content)) !== null) {
    entries.push({
      id:           m[1],
      teamId:       m[2],
      name:         m[3],
      nameKana:     m[4],
      jerseyNumber: parseInt(m[5], 10),
      position:     m[6],
      bats:         m[7],
      throws:       m[8],
      birthDate:    m[9],
      birthPlace:   m[10],
      height:       parseInt(m[11], 10),
      weight:       parseInt(m[12], 10),
      nationality:  m[13],
      active:       m[14] === "true",
    });
  }
  return entries;
}

/** ファイル内で playerId のエントリブロック（{ から }, まで）を探して位置を返す */
function findEntrySpan(content: string, playerId: string): [number, number] | null {
  const idLiteral = `"${playerId}"`;
  const idIdx = content.indexOf(idLiteral);
  if (idIdx === -1) return null;

  // idより前の最も近い { を探す
  let openBrace = -1;
  for (let i = idIdx - 1; i >= 0; i--) {
    if (content[i] === "{") { openBrace = i; break; }
  }
  if (openBrace === -1) return null;

  // idより後の最も近い }, を探す（ネスト考慮不要: 選手エントリは単層）
  const closeIdx = content.indexOf("},", idIdx);
  if (closeIdx === -1) return null;

  return [openBrace, closeIdx + 2];
}

/** 既存エントリの先頭インデント（スペース）を取得 */
function detectIndent(content: string, openBrace: number): string {
  let i = openBrace - 1;
  while (i >= 0 && content[i] === " ") i--;
  return " ".repeat(openBrace - i - 1);
}

// ── 入力TSVをパース ────────────────────────────────────────────

interface TsvRow {
  position: string;
  jerseyNumber: number;
  name: string;
  nameKana: string;
  throws: string;
  bats: string;
  birthDate: string;
  birthPlace: string;
  height: number;
  weight: number;
  nationality: string;
}

const tsv: TsvRow[] = [];
const unmatched: string[] = [];
const rl = readline.createInterface({ input: process.stdin });

rl.on("line", (line) => {
  const cols = line.split("\t");
  if (cols.length < 10) return;

  const pos  = cols[0].trim();
  const num  = cols[1].trim();
  const name = cols[2].trim();
  if (!name || name === "選手名") return;

  const validPositions = ["投手","捕手","一塁手","二塁手","三塁手","遊撃手","外野手","内野手"];
  if (!validPositions.includes(pos)) {
    console.error(`WARN: "${name}" — ポジション "${pos}" は無効。スキップ`);
    return;
  }

  tsv.push({
    position:    pos,
    jerseyNumber: parseInt(num, 10) || 0,
    name,
    nameKana:    cols[3].trim(),
    throws:      cols[4].trim(),
    bats:        cols[5].trim(),
    birthDate:   cols[6].trim(),
    birthPlace:  cols[7].trim(),
    height:      parseInt(cols[8].trim(), 10) || 0,
    weight:      parseInt(cols[9].trim(), 10) || 0,
    nationality: cols[10]?.trim() || "日本",
  });
});

rl.on("close", () => {
  if (tsv.length === 0) {
    console.error("エラー: TSVデータがありません");
    process.exit(1);
  }

  const content = fs.readFileSync(SEED_FILE, "utf-8");
  const allPlayers = extractAllPlayers(content);
  const teamPlayers = allPlayers.filter(p => p.teamId === teamId);

  // 名前正規化でDB選手マップを構築
  const dbByNorm = new Map<string, PlayerEntry>();
  for (const p of teamPlayers) {
    dbByNorm.set(normalize(p.name), p);
  }

  // 次の採番ID
  const allTeamIds = allPlayers
    .filter(p => p.teamId === teamId)
    .map(p => parseInt(p.id.split("-")[1], 10))
    .filter(n => !isNaN(n));
  let nextNum = allTeamIds.length > 0 ? Math.max(...allTeamIds) + 1 : 1;

  // TSVで言及された選手の正規化名セット（DB不在確認用）
  const tsvNorms = new Set(tsv.map(r => normalize(r.name)));

  // DB選手でTSVに含まれない = 退団候補
  const dbOnlyPlayers = teamPlayers.filter(p => !tsvNorms.has(normalize(p.name)));
  if (dbOnlyPlayers.length > 0) {
    console.error(`\n⚠️  DBにいるがTSVにない選手（退団・移籍の可能性）:`);
    for (const p of dbOnlyPlayers) {
      console.error(`   WARN: ${p.name} (${p.id}) — TSVに含まれていません（手動で active: false にしてください）`);
    }
    console.error("");
  }

  // エントリを1行フォーマットに変換
  function formatEntry(p: PlayerEntry): string {
    const id      = `"${p.id}"`.padEnd(16);
    const tId     = `"${p.teamId}"`.padEnd(12);
    const nm      = `"${p.name}"`.padEnd(18);
    const kana    = `"${p.nameKana}"`.padEnd(26);
    const pos     = `"${p.position}" as const`.padEnd(20);
    const bt      = `"${p.bats}" as const`.padEnd(14);
    const th      = `"${p.throws}" as const`.padEnd(14);
    const bd      = `"${p.birthDate}"`;
    const bp      = `"${p.birthPlace}"`.padEnd(16);
    const nat     = `"${p.nationality}"`.padEnd(10);
    return (
      `  { id: ${id}, teamId: ${tId}, name: ${nm}, nameKana: ${kana}, ` +
      `jerseyNumber: ${String(p.jerseyNumber).padStart(2)},  ` +
      `position: ${pos}, bats: ${bt}, throws: ${th}, ` +
      `birthDate: ${bd}, birthPlace: ${bp}, ` +
      `height: ${p.height}, weight: ${p.weight},  ` +
      `nationality: ${nat}, active: ${p.active} },`
    );
  }

  let updated = content;
  let addCount = 0;
  let updateCount = 0;
  const newEntries: string[] = [];

  for (const row of tsv) {
    const norm = normalize(row.name);
    const existing = dbByNorm.get(norm);

    if (existing) {
      // 既存選手: フィールドを更新
      const updated_player: PlayerEntry = {
        ...existing,
        jerseyNumber: row.jerseyNumber,
        position:     row.position,
        bats:         row.bats,
        throws:       row.throws,
        height:       row.height,
        weight:       row.weight,
        nationality:  row.nationality,
        nameKana:     row.nameKana || existing.nameKana,
        active:       true,
      };
      const span = findEntrySpan(updated, existing.id);
      if (span) {
        const newLine = formatEntry(updated_player);
        updated = updated.slice(0, span[0]) + newLine + updated.slice(span[1]);
        updateCount++;
      } else {
        console.error(`WARN: ${existing.id} のエントリをファイル内で見つけられませんでした`);
        unmatched.push(row.name);
      }
    } else {
      // 新規選手: 新しいIDを採番
      const newId = `${teamId}-${nextNum++}`;
      const newPlayer: PlayerEntry = {
        id:           newId,
        teamId,
        jerseyNumber: row.jerseyNumber,
        name:         row.name,
        nameKana:     row.nameKana,
        position:     row.position,
        bats:         row.bats,
        throws:       row.throws,
        birthDate:    row.birthDate,
        birthPlace:   row.birthPlace,
        height:       row.height,
        weight:       row.weight,
        nationality:  row.nationality,
        active:       true,
      };
      newEntries.push(formatEntry(newPlayer));
      addCount++;
    }
  }

  // 新規エントリを末尾の]; の前に追加
  if (newEntries.length > 0) {
    const insertPos = updated.lastIndexOf("];");
    const block = `\n  // ── ${teamId} 新規追加\n` + newEntries.join("\n") + "\n";
    updated = updated.slice(0, insertPos) + block + updated.slice(insertPos);
  }

  fs.writeFileSync(SEED_FILE, updated);

  console.log(`✅ ${teamId}: ${updateCount}件更新, ${addCount}件新規追加`);
  if (unmatched.length > 0) {
    console.log(`⚠️  更新スキップ: ${unmatched.join(", ")}`);
  }
  if (dbOnlyPlayers.length > 0) {
    console.log(`⚠️  退団候補（未変更）: ${dbOnlyPlayers.map(p => p.name).join(", ")}`);
  }
});
