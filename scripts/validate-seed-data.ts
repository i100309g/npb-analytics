#!/usr/bin/env tsx
/**
 * シードデータの整合性チェック
 * 統計的に不可能な値や重複エントリを検出する
 */
import { battingStatsCentral } from "../prisma/seed-data/batting-stats-central";
import { battingStatsPacific } from "../prisma/seed-data/batting-stats-pacific";
import { pitchingStatsCentral } from "../prisma/seed-data/pitching-stats-central";
import { pitchingStatsPacific } from "../prisma/seed-data/pitching-stats-pacific";

let errors = 0;

function fail(msg: string) {
  console.error(`❌ ${msg}`);
  errors++;
}

// ── 打撃成績チェック ─────────────────────────────────────────────
const battingStats = [...battingStatsCentral, ...battingStatsPacific];

// 重複チェック
const battingKeys = new Set<string>();
for (const b of battingStats) {
  const key = `${b.playerId}:${b.seasonYear}`;
  if (battingKeys.has(key)) {
    fail(`打撃成績 重複エントリ: ${key}`);
  }
  battingKeys.add(key);
}

// 値の範囲チェック
for (const b of battingStats) {
  const tag = `batting ${b.playerId} ${b.seasonYear}`;
  if (b.avg !== undefined && b.avg !== null && b.avg > 1.0) {
    fail(`${tag}: avg=${b.avg} > 1.0 (不正な打率)`);
  }
  if (b.obp !== undefined && b.obp !== null && b.obp > 1.0) {
    fail(`${tag}: obp=${b.obp} > 1.0 (不正な出塁率)`);
  }
  if (b.slg !== undefined && b.slg !== null && b.slg > 4.0) {
    fail(`${tag}: slg=${b.slg} > 4.0 (不正な長打率)`);
  }
  if (b.hits !== undefined && b.atBats !== undefined && b.hits !== null && b.atBats !== null && b.hits > b.atBats) {
    fail(`${tag}: hits=${b.hits} > atBats=${b.atBats}`);
  }
  if (b.homeRuns !== undefined && b.hits !== undefined && b.homeRuns !== null && b.hits !== null && b.homeRuns > b.hits) {
    fail(`${tag}: homeRuns=${b.homeRuns} > hits=${b.hits}`);
  }
}

// ── 投手成績チェック ─────────────────────────────────────────────
const pitchingStats = [...pitchingStatsCentral, ...pitchingStatsPacific];

const pitchingKeys = new Set<string>();
for (const p of pitchingStats) {
  const key = `${p.playerId}:${p.seasonYear}`;
  if (pitchingKeys.has(key)) {
    fail(`投手成績 重複エントリ: ${key}`);
  }
  pitchingKeys.add(key);
}

for (const p of pitchingStats) {
  const tag = `pitching ${p.playerId} ${p.seasonYear}`;
  if (p.era !== undefined && p.era !== null && p.era > 50) {
    fail(`${tag}: era=${p.era} > 50 (不正な防御率)`);
  }
  if (p.inningsPitched !== undefined && p.inningsPitched !== null && p.inningsPitched > 300) {
    fail(`${tag}: inningsPitched=${p.inningsPitched} > 300`);
  }
}

// ── 結果 ──────────────────────────────────────────────────────────
console.log(`打撃成績: ${battingStats.length}件チェック完了`);
console.log(`投手成績: ${pitchingStats.length}件チェック完了`);

if (errors > 0) {
  console.error(`\n合計 ${errors} 件のエラーが見つかりました`);
  process.exit(1);
} else {
  console.log("✅ すべてのチェックに合格しました");
}
