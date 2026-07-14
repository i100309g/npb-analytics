#!/usr/bin/env tsx
/**
 * セイバーメトリクス分析エージェント
 *
 * DBから全選手の成績を読み込み、Claude APIで注目株を分析する。
 * 出力:
 *   - reports/YYYY-MM-DD.md     (Markdown履歴)
 *   - prisma/seed-data/report-data.ts (Webサイト用の構造化データ)
 *
 * 使用方法:
 *   ANTHROPIC_API_KEY=sk-... npx tsx scripts/analyze-stats.ts [--year 2025]
 *
 * 環境変数:
 *   ANTHROPIC_API_KEY  必須: Anthropic APIキー
 */
import * as fs from "fs";
import * as path from "path";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "../lib/prisma";
import { calcSaber, calcLeagueAvg, shrinkStats, wOBALabel } from "../lib/sabermetrics";

// ── CLI引数 ───────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const yearFlag = args.indexOf("--year");
const year = yearFlag !== -1 ? parseInt(args[yearFlag + 1], 10) : new Date().getFullYear();

// ── 型定義 ────────────────────────────────────────────────────────────────────

export interface BattingHighlight {
  rank: number;
  playerId: string;
  playerName: string;
  teamName: string;
  highlight: string;   // Claudeによる注目理由
  wOBA: number;
  ops: number;
  avg: number;
  homeRuns: number;
  rbi: number;
  plateAppearances: number;
}

export interface PitchingHighlight {
  rank: number;
  playerId: string;
  playerName: string;
  teamName: string;
  highlight: string;   // Claudeによる注目理由
  era: number;
  whip: number;
  kPer9: number;
  wins: number;
  saves: number;
  inningsPitched: number;
}

export interface ReportData {
  date: string;          // YYYY-MM-DD
  season: number;        // 対象年度
  overview: string;      // Claudeによるリーグ全体コメント
  battingHighlights: BattingHighlight[];
  pitchingHighlights: PitchingHighlight[];
  generatedAt: string;   // ISO timestamp
}

// ── Claude APIのレスポンス型 ──────────────────────────────────────────────────

interface ClaudeResponse {
  overview: string;
  battingHighlights: Array<{
    rank: number;
    playerId: string;
    highlight: string;
  }>;
  pitchingHighlights: Array<{
    rank: number;
    playerId: string;
    highlight: string;
  }>;
}

// ── 打撃成績の取得・分析 ──────────────────────────────────────────────────────

async function fetchBattingData(targetYear: number) {
  const stats = await prisma.battingStat.findMany({
    where: { seasonYear: targetYear },
    include: { player: { include: { team: true } } },
  });

  // セイバーメトリクスを計算し、十分な打席数の選手のみ残す
  const MIN_PA = 100;
  type BattingWithSaber = typeof stats[0] & { wOBA: number };
  const withSaber: BattingWithSaber[] = [];

  const rawSabers = stats
    .map(s => calcSaber(s))
    .filter((s): s is NonNullable<typeof s> => s !== null);

  const leagueAvg = calcLeagueAvg(rawSabers);

  for (const s of stats) {
    const raw = calcSaber(s);
    if (!raw || raw.pa < MIN_PA) continue;
    const shrunk = shrinkStats(raw, leagueAvg);
    withSaber.push({ ...s, wOBA: shrunk.wOBA });
  }

  // wOBA降順でソート
  return withSaber.sort((a, b) => b.wOBA - a.wOBA);
}

// ── 投手成績の取得 ────────────────────────────────────────────────────────────

async function fetchPitchingData(targetYear: number) {
  const MIN_IP = 20;
  const stats = await prisma.pitchingStat.findMany({
    where: {
      seasonYear: targetYear,
      inningsPitched: { gte: MIN_IP },
    },
    include: { player: { include: { team: true } } },
    orderBy: { era: "asc" },
  });
  return stats;
}

// ── Claude APIに渡すプロンプトを構築 ─────────────────────────────────────────

function buildPrompt(
  targetYear: number,
  batters: Awaited<ReturnType<typeof fetchBattingData>>,
  pitchers: Awaited<ReturnType<typeof fetchPitchingData>>,
): string {
  const top20Batters = batters.slice(0, 20);
  const top20Pitchers = pitchers.slice(0, 20);

  const batterRows = top20Batters.map((s, i) =>
    `${i + 1}. ${s.player.name}（${s.player.team.shortName}）` +
    ` wOBA:${s.wOBA.toFixed(3)} OPS:${(s.ops ?? 0).toFixed(3)}` +
    ` AVG:${(s.avg ?? 0).toFixed(3)} HR:${s.homeRuns ?? 0}` +
    ` RBI:${s.rbi ?? 0} PA:${s.plateAppearances ?? 0}` +
    ` playerId:${s.playerId}`
  ).join("\n");

  const pitcherRows = top20Pitchers.map((s, i) =>
    `${i + 1}. ${s.player.name}（${s.player.team.shortName}）` +
    ` ERA:${s.era.toFixed(2)} WHIP:${s.whip.toFixed(2)}` +
    ` K/9:${s.kPer9.toFixed(1)} W:${s.wins} SV:${s.saves}` +
    ` IP:${s.inningsPitched.toFixed(1)}` +
    ` playerId:${s.playerId}`
  ).join("\n");

  return `あなたはNPB（日本プロ野球）のセイバーメトリクス専門アナリストです。
以下の${targetYear}年シーズンの成績データを分析し、注目選手を選んでください。

## ${targetYear}年 打撃成績ランキング（wOBA順、100打席以上）

${batterRows}

## ${targetYear}年 投手成績ランキング（ERA順、20投球回以上）

${pitcherRows}

## 指示

上記のデータをもとに、以下のJSON形式で分析レポートを返してください。
コードブロック（\`\`\`json）で囲んでください。

打撃部門から5選手、投手部門から5選手を選び、各選手のhighlightは日本語で100〜200文字で書いてください。
overviewは${targetYear}年シーズンの全体的な傾向を200〜300文字で書いてください。

{
  "overview": "リーグ全体の傾向についての分析コメント",
  "battingHighlights": [
    {
      "rank": 1,
      "playerId": "選手のplayerId（上のリストからそのまま使う）",
      "highlight": "この選手が注目される理由（セイバーメトリクスの観点から）"
    }
  ],
  "pitchingHighlights": [
    {
      "rank": 1,
      "playerId": "選手のplayerId",
      "highlight": "この選手が注目される理由"
    }
  ]
}`;
}

// ── Claudeのレスポンスを解析 ─────────────────────────────────────────────────

function parseClaudeResponse(text: string): ClaudeResponse {
  const match = text.match(/```json\s*([\s\S]*?)```/);
  if (!match) {
    throw new Error("Claude のレスポンスにJSONブロックが見つかりません");
  }
  return JSON.parse(match[1]) as ClaudeResponse;
}

// ── レポートを組み立てる ──────────────────────────────────────────────────────

function buildReport(
  claudeData: ClaudeResponse,
  batters: Awaited<ReturnType<typeof fetchBattingData>>,
  pitchers: Awaited<ReturnType<typeof fetchPitchingData>>,
  targetYear: number,
  today: string,
): ReportData {
  const batterMap = new Map(batters.map(s => [s.playerId, s]));
  const pitcherMap = new Map(pitchers.map(s => [s.playerId, s]));

  const battingHighlights: BattingHighlight[] = claudeData.battingHighlights
    .map(h => {
      const s = batterMap.get(h.playerId);
      if (!s) return null;
      return {
        rank: h.rank,
        playerId: s.playerId,
        playerName: s.player.name,
        teamName: s.player.team.name,
        highlight: h.highlight,
        wOBA: s.wOBA,
        ops: s.ops ?? 0,
        avg: s.avg ?? 0,
        homeRuns: s.homeRuns ?? 0,
        rbi: s.rbi ?? 0,
        plateAppearances: s.plateAppearances ?? 0,
      };
    })
    .filter((h): h is BattingHighlight => h !== null);

  const pitchingHighlights: PitchingHighlight[] = claudeData.pitchingHighlights
    .map(h => {
      const s = pitcherMap.get(h.playerId);
      if (!s) return null;
      return {
        rank: h.rank,
        playerId: s.playerId,
        playerName: s.player.name,
        teamName: s.player.team.name,
        highlight: h.highlight,
        era: s.era,
        whip: s.whip,
        kPer9: s.kPer9,
        wins: s.wins,
        saves: s.saves,
        inningsPitched: s.inningsPitched,
      };
    })
    .filter((h): h is PitchingHighlight => h !== null);

  return {
    date: today,
    season: targetYear,
    overview: claudeData.overview,
    battingHighlights,
    pitchingHighlights,
    generatedAt: new Date().toISOString(),
  };
}

// ── Markdownレポートを生成 ────────────────────────────────────────────────────

function buildMarkdown(report: ReportData): string {
  const lines: string[] = [
    `# NPB ${report.season}年 セイバーメトリクス注目株 — ${report.date}`,
    "",
    `> ${report.overview}`,
    "",
    "---",
    "",
    "## 打撃部門 注目選手",
    "",
  ];

  for (const p of report.battingHighlights) {
    lines.push(`### ${p.rank}. ${p.playerName}（${p.teamName}）`);
    lines.push("");
    lines.push(p.highlight);
    lines.push("");
    lines.push(
      `| wOBA | OPS | AVG | HR | RBI | PA |`,
      `|------|-----|-----|----|-----|----|`,
      `| ${p.wOBA.toFixed(3)} | ${p.ops.toFixed(3)} | ${p.avg.toFixed(3)} | ${p.homeRuns} | ${p.rbi} | ${p.plateAppearances} |`,
      "",
    );
  }

  lines.push("---", "", "## 投手部門 注目選手", "");

  for (const p of report.pitchingHighlights) {
    lines.push(`### ${p.rank}. ${p.playerName}（${p.teamName}）`);
    lines.push("");
    lines.push(p.highlight);
    lines.push("");
    lines.push(
      `| ERA | WHIP | K/9 | W | SV | IP |`,
      `|-----|------|-----|---|----|----|`,
      `| ${p.era.toFixed(2)} | ${p.whip.toFixed(2)} | ${p.kPer9.toFixed(1)} | ${p.wins} | ${p.saves} | ${p.inningsPitched.toFixed(1)} |`,
      "",
    );
  }

  lines.push("---", "", `*Generated by Claude (claude-opus-4-8) on ${report.generatedAt}*`);
  return lines.join("\n");
}

// ── TypeScriptデータファイルを生成 ────────────────────────────────────────────

function buildTsFile(report: ReportData): string {
  return `// このファイルは scripts/analyze-stats.ts が自動生成します。手動編集しないこと。
import type { ReportData } from "../../scripts/analyze-stats";

export const latestReport: ReportData = ${JSON.stringify(report, null, 2)};
`;
}

// ── メイン処理 ────────────────────────────────────────────────────────────────

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("エラー: ANTHROPIC_API_KEY が設定されていません");
    process.exit(1);
  }

  const today = new Date().toISOString().slice(0, 10);
  console.log(`\n📊 ${year}年シーズン 成績分析を開始します（${today}）\n`);

  // ── DBから成績を取得 ───────────────────────────────────────────────────────
  console.log("  DB から打撃成績を取得中...");
  const batters = await fetchBattingData(year);
  console.log(`  → ${batters.length}名（100PA以上）`);

  console.log("  DB から投手成績を取得中...");
  const pitchers = await fetchPitchingData(year);
  console.log(`  → ${pitchers.length}名（20IP以上）`);

  if (batters.length === 0 && pitchers.length === 0) {
    console.error(`\nエラー: ${year}年のデータがDBにありません。先に npm run seed を実行してください。`);
    process.exit(1);
  }

  // ── Claude APIで分析 ───────────────────────────────────────────────────────
  const client = new Anthropic({ apiKey });
  const prompt = buildPrompt(year, batters, pitchers);

  console.log("\n  Claude API（claude-opus-4-8）で分析中...");

  let fullText = "";
  const stream = await client.messages.stream({
    model: "claude-opus-4-8",
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    messages: [{ role: "user", content: prompt }],
  });

  process.stdout.write("  ");
  for await (const chunk of stream) {
    if (
      chunk.type === "content_block_delta" &&
      chunk.delta.type === "text_delta"
    ) {
      fullText += chunk.delta.text;
      process.stdout.write(".");
    }
  }
  console.log(" 完了\n");

  // ── レスポンスを解析・組み立て ─────────────────────────────────────────────
  let claudeData: ClaudeResponse;
  try {
    claudeData = parseClaudeResponse(fullText);
  } catch (err) {
    console.error("Claude のレスポンス解析失敗:", err);
    console.error("Raw response:", fullText);
    process.exit(1);
  }

  const report = buildReport(claudeData, batters, pitchers, year, today);

  // ── reports/ に Markdown を保存 ────────────────────────────────────────────
  const reportsDir = path.join(__dirname, "../reports");
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

  const mdPath = path.join(reportsDir, `${today}.md`);
  fs.writeFileSync(mdPath, buildMarkdown(report));
  console.log(`  ✅ Markdown保存: reports/${today}.md`);

  // ── prisma/seed-data/report-data.ts を更新 ────────────────────────────────
  const tsPath = path.join(__dirname, "../prisma/seed-data/report-data.ts");
  fs.writeFileSync(tsPath, buildTsFile(report));
  console.log(`  ✅ シードデータ更新: prisma/seed-data/report-data.ts`);

  console.log("\n✨ 分析完了！");
  console.log(`   注目打者: ${report.battingHighlights.map(h => h.playerName).join("、")}`);
  console.log(`   注目投手: ${report.pitchingHighlights.map(h => h.playerName).join("、")}`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
