# データインポート手順書

## 概要

NPB Analytics のデータは `prisma/seed-data/` に TypeScript ファイルとして管理されています。  
データの更新には 2 通りの方法があります：

1. **自動更新**（推奨）: GitHub Actions が毎日 00:00 JST に実行
2. **手動インポート**: スクリプトを直接実行

---

## 自動更新（GitHub Actions）

### 日次スケジュール

`.github/workflows/update-stats.yml` が毎日 15:00 UTC（00:00 JST）に起動。

### 手動トリガー

GitHub Actions の `workflow_dispatch` から手動実行可能。パラメータ：

| パラメータ | 説明 | 例 |
|-----------|------|----|
| `year` | 対象年度（空白で全年度） | `2026` |
| `team` | 特定チームのみ（空白で全チーム） | `baystars` |
| `type` | 種別 | `batting` / `pitching` / `players` / `all` |

---

## 手動インポート手順

### 1. 準備

```bash
npm ci
npx prisma generate
```

### 2. 選手ロスターの更新

```bash
npm run update:players
# または特定チームのみ
npx tsx scripts/update-stats.ts --type players --team giants
```

### 3. 打撃成績の更新

```bash
# 全チーム・全年度
npm run update:batting

# 特定年度
npm run update:2025

# 特定チーム
npx tsx scripts/update-stats.ts --type batting --team hawks --year 2025
```

### 4. 投手成績の更新

```bash
npm run update:pitching

# または
npx tsx scripts/update-stats.ts --type pitching --year 2026
```

### 5. 検証

```bash
npm run validate
```

### 6. DB に反映

```bash
npm run seed
```

---

## 手動 TSV インポート（上級者向け）

NPB 公式サイトからコピーしたデータを直接インポートする方法。

### 打撃成績

```bash
echo "<TSV形式のデータ>" | npm run import:batting -- <teamId> [--year <year>]
```

または `fetch-table.ts` と組み合わせて:

```bash
npx tsx scripts/fetch-table.ts "https://npb.jp/bis/2025/stats/idb1_g.html" \
  | npx tsx scripts/import-batting.ts giants --year 2025
```

### 投手成績

```bash
npx tsx scripts/fetch-table.ts "https://npb.jp/bis/2025/stats/idp1_h.html" \
  | npx tsx scripts/import-pitching.ts hawks --year 2025
```

### チーム ID と NPB URL コード対応

| チーム ID | チーム名 | URL コード |
|-----------|---------|-----------|
| `giants` | 読売ジャイアンツ | `g` |
| `tigers` | 阪神タイガース | `t` |
| `baystars` | 横浜DeNAベイスターズ | `db` |
| `carp` | 広島東洋カープ | `c` |
| `dragons` | 中日ドラゴンズ | `d` |
| `swallows` | 東京ヤクルトスワローズ | `s` |
| `hawks` | 福岡ソフトバンクホークス | `h` |
| `lions` | 埼玉西武ライオンズ | `l` |
| `fighters` | 北海道日本ハムファイターズ | `f` |
| `marines` | 千葉ロッテマリーンズ | `m` |
| `eagles` | 東北楽天ゴールデンイーグルス | `e` |
| `buffaloes` | オリックス・バファローズ | `b` |

---

## seed-data ファイルの手動編集

### 形式（打撃成績の例）

```typescript
// prisma/seed-data/batting-stats-central.ts

export const battingStatsCentral = [
  // ── giants 2025 ──────────────────────
  { playerId: "giants-55", seasonYear: 2025, games:  143, plateAppearances:  601, atBats:  527,
    hits:  175, singles:  120, doubles:  31, triples: 2, homeRuns:  22, rbi:   85,
    runs:   88, walks:   60, intentionalWalks:  10, hitByPitch:   5, strikeouts:  110,
    stolenBases:   8, caughtStealing: 2, doublePlayGrounded:  12,
    sacrificeHits:   4, sacrificeFlies:   5,
    avg: 0.332, obp: 0.401, slg: 0.521, ops: 0.922 },
];
```

### セクションヘッダーのルール

**必ず以下の形式にすること:**

```
// ── teamId year ──────────────────────
```

- `teamId` は英語 ID（`giants`, `hawks` など）
- スペースや記号の差異でスクリプトが誤動作する
- インポートスクリプトはこのヘッダーを探してセクション全体を置換する

---

## トラブルシューティング

### Q. インポート後に選手名が「WARN: ... → ID不明, スキップ」と出る

**原因**: `scripts/lib/player-lookup.ts` が選手名を解決できない。

**確認方法**:
```bash
# player-lookup が使う名簿ファイルを確認
ls prisma/seed-data/players-*.ts
```

**対処**:
1. まず `npm run update:players` で名簿を最新化
2. それでも解決しない場合は `prisma/seed-data/players-*.ts` に手動で選手を追加

### Q. `ops: 0.000` になっている

**原因（既知）**: NPB.jp 打撃テーブルは HTML で `colspan` を使用するため、パース後のセル数が 23 になる。`cols[23]` は存在しない。

**対処**: `import-batting.ts` が `Math.round((obp + slg) * 1000) / 1000` で OPS を計算するよう修正済み（commit: `f32bde4`）。古いデータは再インポートすれば修正される。

### Q. 成績データが重複してシード失敗する

**原因**: 同じ `(playerId, seasonYear)` が複数存在する。

**確認**:
```bash
npm run validate
```

**対処**: `seed.ts` は `upsert()` を使用しているため、DB での重複は起きない。シードデータファイルに重複があれば手動で削除。

### Q. 打撃成績が全て0になっている（デグレ）

**原因**: `import-batting.ts` の `cols.length < N` のチェックが誤っている可能性。

**確認**: NPB.jp の打撃テーブルは 23 セル/行。`N` は `20` が正しい。`24` にすると 23 < 24 = true で全行スキップされる。

```typescript
// 正しい値
if (cols.length < 20) return;
```

### Q. GitHub Actions でプッシュ競合が発生する

複数の workflow が同時実行されると、最初のプッシュ後に 2 番目が競合で失敗する。  
再実行するか、手動でブランチを pull してから push する。

---

## データ検証（`npm run validate`）

`scripts/validate-seed-data.ts` が以下を検証します：

| チェック項目 | 条件 |
|------------|------|
| 打率上限 | `avg > 1.0` は異常 |
| 出塁率上限 | `obp > 1.0` は異常 |
| 長打率上限 | `slg > 4.0` は異常（満塁ホームランでも 4.0） |
| 安打数 | `hits > atBats` は異常 |
| 本塁打数 | `homeRuns > hits` は異常 |
| 重複チェック | `(playerId, seasonYear)` の重複 |

検証失敗時は非ゼロで終了し、GitHub Actions のシード投入ステップを中断します。
