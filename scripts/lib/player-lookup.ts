/**
 * 選手名 → ID ルックアップ
 * 推論は一切行わない。マッチしない場合は undefined を返す。
 */
import * as fs from "fs";
import * as path from "path";

const PLAYERS_FILE = path.join(__dirname, "../../prisma/seed-data/players-central.ts");
const PACIFIC_FILE = path.join(__dirname, "../../prisma/seed-data/players-pacific.ts");

function normalize(name: string): string {
  return name.replace(/[\s　・ ]/g, "");
}

interface PlayerEntry {
  id: string;
  teamId: string;
  name: string;
}

function extractPlayers(content: string): PlayerEntry[] {
  const entries: PlayerEntry[] = [];
  // id: "xxx", teamId: "yyy", name: "zzz" の行を抽出
  const re = /id:\s*"([^"]+)"[^}]*?teamId:\s*"([^"]+)"[^}]*?name:\s*"([^"]+)"/gs;
  let m;
  while ((m = re.exec(content)) !== null) {
    entries.push({ id: m[1], teamId: m[2], name: m[3] });
  }
  return entries;
}

export function buildLookup(teamId: string): Map<string, string> {
  const map = new Map<string, string>(); // normName → playerId
  const ambiguous = new Set<string>();

  const files = [PLAYERS_FILE, PACIFIC_FILE].filter(f => {
    try { fs.accessSync(f); return true; } catch { return false; }
  });

  for (const file of files) {
    const content = fs.readFileSync(file, "utf-8");
    const players = extractPlayers(content).filter(p => p.teamId === teamId);

    for (const p of players) {
      const full = normalize(p.name);
      map.set(full, p.id);

      // 姓のみ（最初の漢字グループ）でも登録（ユニークな場合のみ）
      const familyOnly = p.name.replace(/\s.*/, ""); // 最初のスペース以前
      const normFamily = normalize(familyOnly);
      if (normFamily !== full) {
        if (map.has(normFamily) && map.get(normFamily) !== p.id) {
          ambiguous.add(normFamily); // 重複するので削除
        } else if (!ambiguous.has(normFamily)) {
          map.set(normFamily, p.id);
        }
      }
    }
  }

  // 重複姓を削除
  for (const k of ambiguous) map.delete(k);

  return map;
}

export function lookupId(map: Map<string, string>, name: string): string | undefined {
  const norm = normalize(name.replace(/^\*/, ""));
  return map.get(norm);
}
