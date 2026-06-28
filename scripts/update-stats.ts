#!/usr/bin/env tsx
/**
 * 全チームの成績を自動更新するオーケストレーター
 *
 * Usage:
 *   tsx scripts/update-stats.ts [--type batting|pitching|players] [--team <teamId>]
 *
 * オプション:
 *   --type    更新種別（省略時は batting と pitching を両方実行）
 *   --team    特定チームのみ更新（省略時は設定済みURLの全チーム）
 *   --dry-run フェッチ・変換のみ（ファイル書き込みなし）
 *
 * 事前設定: config/npb-urls.ts に各チームのURLを記述すること
 */

import { execSync, spawnSync } from "child_process";
import * as path from "path";
import { teamUrls, TeamUrlConfig } from "../config/npb-urls";

const args = process.argv.slice(2);

function getFlag(flag: string): string | null {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] ?? null : null;
}
const hasFlag = (flag: string) => args.includes(flag);

const typeFilter = getFlag("--type") as "batting" | "pitching" | "players" | null;
const teamFilter = getFlag("--team");
const dryRun     = hasFlag("--dry-run");

const ROOT = path.join(__dirname, "..");

// ── ユーティリティ ────────────────────────────────────────────

function log(msg: string) { console.log(`[update-stats] ${msg}`); }
function warn(msg: string) { console.warn(`[update-stats] ⚠️  ${msg}`); }
function ok(msg: string)   { console.log(`[update-stats] ✅ ${msg}`); }

/** URLからHTMLテーブルをTSVとして取得 */
async function fetchTsv(url: string, tableIdx = 0): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; npb-analytics/1.0)",
      "Accept-Language": "ja,en;q=0.9",
      "Accept": "text/html,application/xhtml+xml",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  const html = await res.text();

  // 簡易HTMLテーブルパーサー
  function decodeHtml(s: string) {
    return s
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
      .replace(/&nbsp;/g, " ");
  }
  function stripTags(s: string) {
    return decodeHtml(s.replace(/<[^>]+>/g, "").trim());
  }

  const tables: string[] = [];
  const tableRe = /<table[\s\S]*?<\/table>/gi;
  let tm: RegExpExecArray | null;
  while ((tm = tableRe.exec(html)) !== null) {
    const rows: string[] = [];
    const rowRe = /<tr[\s\S]*?<\/tr>/gi;
    let rm: RegExpExecArray | null;
    while ((rm = rowRe.exec(tm[0])) !== null) {
      const cells: string[] = [];
      const cellRe = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
      let cm: RegExpExecArray | null;
      while ((cm = cellRe.exec(rm[0])) !== null) {
        cells.push(stripTags(cm[1]).replace(/\t/g, " ").replace(/\n/g, ""));
      }
      if (cells.length > 0) rows.push(cells.join("\t"));
    }
    if (rows.length > 0) tables.push(rows.join("\n"));
  }

  if (tables.length === 0) throw new Error("テーブルが見つかりません");
  if (tableIdx >= tables.length) throw new Error(`テーブルインデックス ${tableIdx} が範囲外（${tables.length}個）`);
  return tables[tableIdx];
}

/** TSVをパイプでimportスクリプトに渡して実行 */
function runImport(script: string, teamId: string, tsv: string, extraArgs: string[] = []) {
  const scriptPath = path.join(ROOT, "scripts", script);
  const result = spawnSync(
    "npx", ["tsx", scriptPath, teamId, ...extraArgs],
    { input: tsv, encoding: "utf-8", cwd: ROOT }
  );
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.status !== 0) throw new Error(`${script} が失敗（exit ${result.status}）`);
}

// ── メイン処理 ────────────────────────────────────────────────

/** NPBロスターページを専用スクレイパーで取得してTSVに変換 */
function fetchRosterTsv(url: string): string {
  const scriptPath = path.join(ROOT, "scripts", "fetch-npb-roster.ts");
  const result = spawnSync("npx", ["tsx", scriptPath, url], {
    encoding: "utf-8", cwd: ROOT,
  });
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0 || !result.stdout) {
    throw new Error(`fetch-npb-roster.ts が失敗（exit ${result.status}）`);
  }
  return result.stdout;
}

async function processTeam(teamId: string, cfg: TeamUrlConfig) {
  const types: Array<"batting" | "pitching" | "players"> =
    typeFilter ? [typeFilter] : ["batting", "pitching"];

  for (const type of types) {
    const urlKey = type === "players" ? "rosterUrl" : `${type}Url` as keyof TeamUrlConfig;
    const url = cfg[urlKey as keyof TeamUrlConfig] as string | undefined;
    if (!url) {
      warn(`${teamId} の ${type === "players" ? "rosterUrl" : type + "Url"} が未設定 → スキップ`);
      continue;
    }

    log(`${teamId} / ${type} フェッチ中: ${url}`);

    let tsv: string;
    try {
      if (type === "players") {
        tsv = fetchRosterTsv(url);
      } else {
        tsv = await fetchTsv(url, 0);
      }
    } catch (e) {
      warn(`${teamId} / ${type} フェッチ失敗: ${e}`);
      continue;
    }

    if (dryRun) {
      log(`[dry-run] ${teamId} / ${type} — TSV取得成功（${tsv.split("\n").length}行）`);
      continue;
    }

    try {
      const scriptMap = {
        batting:  "import-batting.ts",
        pitching: "import-pitching.ts",
        players:  "import-players.ts",
      } as const;
      const extraArgs = type === "players"
        ? ["--file", cfg.league === "pacific" ? "pacific" : "central"]
        : [];
      runImport(scriptMap[type], teamId, tsv, extraArgs);
      ok(`${teamId} / ${type} 完了`);
    } catch (e) {
      warn(`${teamId} / ${type} インポート失敗: ${e}`);
    }
  }
}

async function main() {
  const targets = Object.entries(teamUrls).filter(([id]) =>
    !teamFilter || id === teamFilter
  );

  if (targets.length === 0) {
    console.error(teamFilter
      ? `チームID "${teamFilter}" が config/npb-urls.ts に見つかりません`
      : "対象チームがありません"
    );
    process.exit(1);
  }

  let anyProcessed = false;
  for (const [teamId, cfg] of targets) {
    const hasAnyUrl = cfg.battingUrl || cfg.pitchingUrl || cfg.rosterUrl;
    if (!hasAnyUrl) continue;
    anyProcessed = true;
    await processTeam(teamId, cfg);
  }

  if (!anyProcessed) {
    warn("config/npb-urls.ts にURLが1件も設定されていません。");
    warn("各チームの battingUrl / pitchingUrl / rosterUrl を設定してください。");
    process.exit(0);
  }

  if (!dryRun) {
    log("シードDB更新中...");
    try {
      execSync("npx tsx prisma/seed.ts", { cwd: ROOT, stdio: "inherit" });
      ok("DB更新完了");
    } catch {
      warn("seed.ts の実行に失敗しました。手動で npm run seed を実行してください。");
    }
  }

  log("全処理完了");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
