#!/usr/bin/env tsx
/**
 * NPB公式ロスターページ専用スクレイパー
 *
 * Usage:
 *   tsx scripts/fetch-npb-roster.ts <url> [--debug]
 *
 * NPBロスターページ（https://npb.jp/bis/teams/rst_*.html）を取得し、
 * import-players.ts が受け付けるTSV形式に変換して標準出力に出す。
 *
 * 出力TSV列順:
 *   ポジション  背番号  選手名  フリガナ  投  打  生年月日  出身地  身長  体重  国籍
 *
 * ページ構造の前提:
 *   - ポジションは <h4> タグ（"投手" "捕手" "内野手" "外野手" "育成選手"）
 *   - 各セクションにテーブルがあり、列順は: 背番号 選手名 よみ 投打 生年月日 身長 体重 出身地 [経歴]
 *   - 投打は "右右" "右左" "左左" "両右" 等の2文字
 *   - 生年月日は "1999.10.09" 形式
 *   - 国籍は出身地が都道府県なら "日本"、それ以外は "外国"
 */

const url = process.argv[2];
const debug = process.argv.includes("--debug");

if (!url) {
  console.error("Usage: tsx scripts/fetch-npb-roster.ts <url> [--debug]");
  process.exit(1);
}

// 都道府県リスト（nationality判定用）
const PREFECTURES = new Set([
  "北海道","青森","岩手","宮城","秋田","山形","福島",
  "茨城","栃木","群馬","埼玉","千葉","東京","神奈川",
  "新潟","富山","石川","福井","山梨","長野",
  "岐阜","静岡","愛知","三重",
  "滋賀","京都","大阪","兵庫","奈良","和歌山",
  "鳥取","島根","岡山","広島","山口",
  "徳島","香川","愛媛","高知",
  "福岡","佐賀","長崎","熊本","大分","宮崎","鹿児島","沖縄",
]);

// ポジション見出し → 値マッピング
const POSITION_MAP: Record<string, string> = {
  "投手": "投手",
  "捕手": "捕手",
  "内野手": "内野手",
  "外野手": "外野手",
  "育成選手": "内野手",   // 育成は一旦内野手で登録、手動修正を想定
};

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&nbsp;/g, " ");
}

function stripTags(s: string): string {
  return decodeHtml(s.replace(/<[^>]+>/g, "")).trim();
}

/** "右右" → { throws: "右", bats: "右" } */
function parseThrowsBats(s: string): { throws: string; bats: string } | null {
  const clean = s.trim();
  if (clean.length < 2) return null;
  // 投打順: 最初の文字=投、2番目=打
  // "右右" "右左" "左左" "左右" "両右" "右両"(稀)
  const first  = clean[0];  // 投
  const second = clean[1];  // 打
  const validChars = ["右", "左", "両"];
  if (!validChars.includes(first) || !validChars.includes(second)) return null;
  return { throws: first, bats: second };
}

/** "1999.10.09" or "1999年10月9日" → "1999-10-09" */
function parseDate(s: string): string {
  const dot = s.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})$/);
  if (dot) {
    return `${dot[1]}-${dot[2].padStart(2, "0")}-${dot[3].padStart(2, "0")}`;
  }
  const jp = s.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/);
  if (jp) {
    return `${jp[1]}-${jp[2].padStart(2, "0")}-${jp[3].padStart(2, "0")}`;
  }
  return s; // そのまま返す
}

/** "183cm" or "183" → 183 */
function parseCm(s: string): number {
  return parseInt(s.replace(/[^0-9]/g, ""), 10) || 0;
}

interface PlayerRow {
  position: string;
  jerseyNumber: string;
  name: string;
  kana: string;
  throws: string;
  bats: string;
  birthDate: string;
  birthPlace: string;
  height: number;
  weight: number;
  nationality: string;
}

function parseRosterHtml(html: string): PlayerRow[] {
  const players: PlayerRow[] = [];
  let currentPosition = "";

  // h4タグとtableタグを順番に処理するためにHTMLを分割
  // h4か table の開始位置を順番に取得
  const tokens: Array<{ type: "h4" | "table"; content: string; pos: number }> = [];

  const h4Re = /<h[34][^>]*>([\s\S]*?)<\/h[34]>/gi;
  let m: RegExpExecArray | null;
  while ((m = h4Re.exec(html)) !== null) {
    tokens.push({ type: "h4", content: m[1], pos: m.index });
  }

  const tableRe = /<table[\s\S]*?<\/table>/gi;
  while ((m = tableRe.exec(html)) !== null) {
    tokens.push({ type: "table", content: m[0], pos: m.index });
  }

  tokens.sort((a, b) => a.pos - b.pos);

  for (const token of tokens) {
    if (token.type === "h4") {
      const heading = stripTags(token.content).trim();
      if (debug) console.error(`[DEBUG] 見出し: "${heading}"`);
      const mapped = Object.keys(POSITION_MAP).find(k => heading.includes(k));
      if (mapped) currentPosition = POSITION_MAP[mapped];
      continue;
    }

    // tableの処理
    if (!currentPosition) {
      if (debug) console.error("[DEBUG] ポジション未確定のテーブルをスキップ");
      continue;
    }

    const rows: string[][] = [];
    const rowRe = /<tr[\s\S]*?<\/tr>/gi;
    let rm: RegExpExecArray | null;
    while ((rm = rowRe.exec(token.content)) !== null) {
      const cells: string[] = [];
      const cellRe = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
      let cm: RegExpExecArray | null;
      while ((cm = cellRe.exec(rm[0])) !== null) {
        cells.push(stripTags(cm[1]).replace(/\r?\n/g, "").trim());
      }
      if (cells.length >= 7) rows.push(cells);
    }

    // ヘッダー行をスキップ（背番号 or No. が入っている行）
    const dataRows = rows.filter(r => {
      const first = r[0].trim();
      return /^\d+$/.test(first); // 背番号は数字のみ
    });

    if (debug) console.error(`[DEBUG] ポジション "${currentPosition}" - ${dataRows.length}行`);

    for (const cols of dataRows) {
      // 列: 背番号 選手名 よみ 投打 生年月日 身長 体重 出身地 [経歴...]
      // ただしページによって列数や順番が異なる可能性あり
      const jerseyNumber = cols[0].trim();
      const name         = cols[1].trim();
      const kana         = cols[2].trim();
      const throwsBats   = parseThrowsBats(cols[3]);
      const birthDate    = parseDate(cols[4].trim());
      const height       = parseCm(cols[5]);
      const weight       = parseCm(cols[6]);
      const birthPlace   = cols[7]?.trim() ?? "";

      if (!name || !jerseyNumber) continue;

      const nationality = PREFECTURES.has(birthPlace) ? "日本" : "外国";

      if (!throwsBats) {
        if (debug) console.error(`WARN: ${name} — 投打 "${cols[3]}" を解析できませんでした`);
        continue;
      }

      players.push({
        position: currentPosition,
        jerseyNumber,
        name,
        kana,
        throws: throwsBats.throws,
        bats:   throwsBats.bats,
        birthDate,
        birthPlace,
        height,
        weight,
        nationality,
      });
    }
  }

  return players;
}

async function main() {
  if (debug) console.error(`[DEBUG] フェッチ中: ${url}`);

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

  const players = parseRosterHtml(html);

  if (players.length === 0) {
    console.error("選手データが取得できませんでした。--debug フラグで詳細を確認してください。");
    process.exit(1);
  }

  if (debug) console.error(`[DEBUG] 合計 ${players.length}人`);

  // ヘッダー行
  console.log("ポジション\t背番号\t選手名\tフリガナ\t投\t打\t生年月日\t出身地\t身長\t体重\t国籍");

  for (const p of players) {
    console.log([
      p.position,
      p.jerseyNumber,
      p.name,
      p.kana,
      p.throws,
      p.bats,
      p.birthDate,
      p.birthPlace,
      p.height,
      p.weight,
      p.nationality,
    ].join("\t"));
  }
}

main();
