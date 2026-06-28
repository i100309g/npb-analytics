#!/usr/bin/env tsx
/**
 * HTMLページからテーブルをTSVとして取得
 *
 * Usage:
 *   tsx scripts/fetch-table.ts <url> [tableIndex]
 *
 * - tableIndex: 0始まり（省略時は0）
 * - テーブルが見つからない場合はエラー終了
 */

const url = process.argv[2];
const tableIndex = parseInt(process.argv[3] ?? "0", 10);

if (!url) {
  console.error("Usage: tsx scripts/fetch-table.ts <url> [tableIndex]");
  process.exit(1);
}

/** HTMLエンティティをデコード */
function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&nbsp;/g, " ");
}

/** タグを除去してテキストを抽出 */
function stripTags(s: string): string {
  return decodeHtml(s.replace(/<[^>]+>/g, "").trim());
}

/** HTML内の全テーブルを抽出してTSV配列として返す */
function extractTables(html: string): string[][] {
  const tables: string[][] = [];

  const tableRe = /<table[\s\S]*?<\/table>/gi;
  let tableMatch: RegExpExecArray | null;

  while ((tableMatch = tableRe.exec(html)) !== null) {
    const tableHtml = tableMatch[0];
    const rows: string[] = [];

    const rowRe = /<tr[\s\S]*?<\/tr>/gi;
    let rowMatch: RegExpExecArray | null;

    while ((rowMatch = rowRe.exec(tableHtml)) !== null) {
      const rowHtml = rowMatch[0];
      const cells: string[] = [];

      const cellRe = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
      let cellMatch: RegExpExecArray | null;

      while ((cellMatch = cellRe.exec(rowHtml)) !== null) {
        cells.push(stripTags(cellMatch[1]).replace(/\t/g, " ").replace(/\n/g, ""));
      }

      if (cells.length > 0) {
        rows.push(cells.join("\t"));
      }
    }

    if (rows.length > 0) tables.push(rows);
  }

  return tables;
}

async function main() {
  let html: string;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; npb-analytics/1.0)",
        "Accept-Language": "ja,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) {
      console.error(`HTTP ${res.status}: ${url}`);
      process.exit(1);
    }
    html = await res.text();
  } catch (e) {
    console.error(`取得失敗: ${e}`);
    process.exit(1);
  }

  const tables = extractTables(html);

  if (tables.length === 0) {
    console.error("テーブルが見つかりません");
    process.exit(1);
  }

  if (tableIndex >= tables.length) {
    console.error(`テーブルインデックス ${tableIndex} が範囲外（${tables.length}個のテーブルを検出）`);
    process.exit(1);
  }

  process.stdout.write(tables[tableIndex].join("\n") + "\n");
}

main();
