#!/usr/bin/env tsx
/**
 * 全チームの成績を自動更新するオーケストレーター
 *
 * Usage:
 *   tsx scripts/update-stats.ts [options]
 *
 * Options:
 *   --type   batting | pitching | players  (省略時: batting + pitching)
 *   --team   <teamId>                      (省略時: 全チーム)
 *   --year   <year>                        (省略時: config/npb-urls.ts の全年度)
 *   --dry-run                              フェッチのみ、ファイル書き込みなし
 *
 * 前提: config/npb-urls.ts に URL が設定済みであること
 */

import { execSync, spawnSync } from "child_process";
import * as path from "path";
import { teamUrls } from "../config/npb-urls";

const argv = process.argv.slice(2);
function getFlag(f: string): string | null {
  const i = argv.indexOf(f);
  return i !== -1 ? argv[i + 1] ?? null : null;
}
const hasFlag = (f: string) => argv.includes(f);

const typeFilter = getFlag("--type") as "batting" | "pitching" | "players" | null;
const teamFilter = getFlag("--team");
const yearFilter = getFlag("--year") ? parseInt(getFlag("--year")!, 10) : null;
const dryRun     = hasFlag("--dry-run");

const ROOT = path.join(__dirname, "..");

function log(msg: string)  { console.log(`[update-stats] ${msg}`); }
function warn(msg: string) { console.warn(`[update-stats] ⚠️  ${msg}`); }
function ok(msg: string)   { console.log(`[update-stats] ✅ ${msg}`); }

// ── HTML テーブル → TSV 変換 ──────────────────────────────────

async function fetchTsv(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; npb-analytics/1.0)",
      "Accept-Language": "ja,en;q=0.9",
      "Accept": "text/html,application/xhtml+xml",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  const html = await res.text();

  function decode(s: string) {
    return s
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
      .replace(/&nbsp;/g, " ");
  }
  function strip(s: string) { return decode(s.replace(/<[^>]+>/g, "")).trim(); }

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
        cells.push(strip(cm[1]).replace(/\t|\n/g, " "));
      }
      if (cells.length > 0) rows.push(cells.join("\t"));
    }
    if (rows.length > 0) tables.push(rows.join("\n"));
  }

  if (tables.length === 0) throw new Error("テーブルが見つかりません");
  // 成績テーブルは通常 最大のテーブルを選ぶ（ナビゲーションテーブルを除外）
  const largest = tables.reduce((a, b) => a.length >= b.length ? a : b);
  return largest;
}

/** import スクリプトを stdin 経由で実行 */
function runImport(script: string, teamId: string, year: number, tsv: string, extraArgs: string[] = []) {
  const scriptPath = path.join(ROOT, "scripts", script);
  const result = spawnSync(
    "npx", ["tsx", scriptPath, teamId, "--year", String(year), ...extraArgs],
    { input: tsv, encoding: "utf-8", cwd: ROOT }
  );
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.status !== 0) throw new Error(`${script} が失敗（exit ${result.status}）`);
}

/** NPBロスターページを専用スクレイパーで取得 */
function fetchRosterTsv(url: string): string {
  const scriptPath = path.join(ROOT, "scripts", "fetch-npb-roster.ts");
  const result = spawnSync("npx", ["tsx", scriptPath, url], { encoding: "utf-8", cwd: ROOT });
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0 || !result.stdout) {
    throw new Error(`fetch-npb-roster が失敗（exit ${result.status}）`);
  }
  return result.stdout;
}

// ── メイン処理 ────────────────────────────────────────────────

async function processTeam(teamId: string) {
  const cfg = teamUrls[teamId];
  if (!cfg) return;

  // players（ロスター）
  if (!typeFilter || typeFilter === "players") {
    if (cfg.rosterUrl) {
      log(`${teamId} / players フェッチ中...`);
      try {
        const tsv = fetchRosterTsv(cfg.rosterUrl);
        if (dryRun) {
          log(`[dry-run] ${teamId}/players — ${tsv.split("\n").length}行`);
        } else {
          const file = cfg.league === "pacific" ? "--file pacific" : "--file central";
          runImport("import-players.ts", teamId, 0, tsv, file.split(" "));
          ok(`${teamId} / players 完了`);
        }
      } catch (e) {
        warn(`${teamId} / players 失敗: ${e}`);
      }
    }
  }

  // batting / pitching（年度別成績）
  const statsTypes: Array<{ type: "batting" | "pitching"; urlKey: "battingUrl" | "pitchingUrl"; script: string }> = [
    { type: "batting",  urlKey: "battingUrl",  script: "import-batting.ts"  },
    { type: "pitching", urlKey: "pitchingUrl", script: "import-pitching.ts" },
  ];

  for (const { type, urlKey, script } of statsTypes) {
    if (typeFilter && typeFilter !== type) continue;

    const years = yearFilter
      ? cfg.stats.filter(s => s.year === yearFilter)
      : cfg.stats;

    for (const s of years) {
      const url = s[urlKey];
      if (!url) continue;

      log(`${teamId} / ${type} ${s.year} フェッチ中: ${url}`);
      try {
        const tsv = await fetchTsv(url);
        if (dryRun) {
          log(`[dry-run] ${teamId}/${type}/${s.year} — ${tsv.split("\n").length}行`);
          continue;
        }
        runImport(script, teamId, s.year, tsv);
        ok(`${teamId} / ${type} ${s.year} 完了`);
      } catch (e) {
        warn(`${teamId} / ${type} ${s.year} 失敗: ${e}`);
      }
    }
  }
}

async function main() {
  const targets = Object.keys(teamUrls).filter(id => !teamFilter || id === teamFilter);

  if (targets.length === 0) {
    console.error(teamFilter
      ? `チームID "${teamFilter}" が config/npb-urls.ts にありません`
      : "対象チームがありません"
    );
    process.exit(1);
  }

  for (const teamId of targets) {
    await processTeam(teamId);
  }

  if (!dryRun && (!typeFilter || typeFilter !== "players")) {
    log("シードDB更新中...");
    try {
      execSync("npx tsx prisma/seed.ts", { cwd: ROOT, stdio: "inherit" });
      ok("DB更新完了");
    } catch {
      warn("seed.ts の実行に失敗。手動で npm run seed を実行してください。");
    }
  }

  log("全処理完了");
}

main().catch(e => { console.error(e); process.exit(1); });
