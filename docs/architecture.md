# アーキテクチャ設計書

## システム概要

```
NPB 公式サイト
    │ (GitHub Actions 日次 fetch)
    ▼
prisma/seed-data/*.ts   ← TypeScript ソース（成績データ）
    │ (npm run seed)
    ▼
dev.db (SQLite)
    │ (Prisma クライアント, ビルド時読み込み)
    ▼
Next.js ビルド → out/ (静的 HTML/JS)
    │
    ▼
GitHub Pages
```

静的エクスポート（`output: "export"`）のため、**データはビルド時に DB から読み込まれ、ランタイムでの DB アクセスはありません**。

---

## データモデル（Prisma スキーマ）

### 球団・球場

```
Stadium          Team
─────────        ────────────
id (PK)          id (PK)          例: "giants", "hawks"
name             name             例: "読売ジャイアンツ"
city             shortName        例: "巨人"
capacity         league           "セントラル" | "パシフィック"
surface          city
roofType         color            CSS カラーコード
openedYear       foundedYear
                 stadiumId (FK)
```

### 選手

```
Player
────────────────
id (PK)          例: "giants-55", "hawks-3"
teamId (FK)
name             漢字表記
nameKana         カナ表記（ルックアップに使用）
jerseyNumber
position         "投手" | "捕手" | "一塁手" | "二塁手" | "三塁手" | "遊撃手" | "外野手"
bats             "右" | "左" | "両"
throws           "右" | "左"
birthDate        YYYY-MM-DD
birthPlace
height / weight
nationality
active           Boolean（登録抹消時 false）
```

### 順位・試合

```
Season           Standing
──────           ────────
year (PK)        id (PK, autoincrement)
                 seasonYear (FK)
                 teamId (FK)
                 league / rank / wins / losses / draws
                 winRate / gamesBehind / runsFor / runsAgainst
                 UNIQUE(seasonYear, teamId)

Game
────
date / homeTeamId / awayTeamId / homeScore / awayScore
stadiumId / attendance / duration / gameType
```

### 成績

```
BattingStat                    PitchingStat
───────────                    ────────────
playerId / seasonYear          playerId / seasonYear
games / plateAppearances       games / starts / completeGames / shutouts
atBats / hits / singles        wins / losses / saves / holds / blownSaves
doubles / triples / homeRuns   inningsPitched / hitsAllowed
rbi / runs / walks             runsAllowed / earnedRuns
intentionalWalks / hitByPitch  walksAllowed / intentionalWalks
strikeouts / stolenBases       hitBatters / strikeouts / homeRunsAllowed
caughtStealing                 era / whip / kPer9 / bbPer9 / qualityStarts
doublePlayGrounded
sacrificeHits / sacrificeFlies
avg / obp / slg / ops
UNIQUE(playerId, seasonYear)   UNIQUE(playerId, seasonYear)

FieldingStat
────────────
playerId / seasonYear / position
games / putouts / assists / errors / doublePlays / fieldingPct
UNIQUE(playerId, seasonYear, position)
```

### その他

```
Award            Matchup（打者 vs 投手 対戦成績）
─────            ────────────────────────────────
seasonYear       seasonYear / batterId / pitcherId
playerId         atBats / hits / doubles / triples / homeRuns
awardName        rbi / walks / intentionalWalks
league           strikeouts / hitByPitch / sacrificeFlies / avg / ops
```

---

## ページ構成

### `/` — 順位表（`app/page.tsx`）

- **Server Component**
- `Standing` テーブルからシーズン別順位を取得
- セントラル / パシフィック に分けて表示
- チーム名クリックで `/teams/[id]` へ遷移

### `/teams/[id]` — チーム詳細（`app/teams/[id]/page.tsx`）

- **Server Component** + Client Component（`TeamStats.tsx`）
- `generateStaticParams()` で全 12 球団を静的生成
- `params: Promise<{ id: string }>` — Next.js 16 では params が Promise になった
- 打撃・投手・守備の 3 タブ切替（クライアントサイド）
- 年度切替ボタン（2025 / 2026）

### `/players` — 全選手成績（`app/players/page.tsx`）

- **Server Component** + Client Component（`PlayersClient.tsx`）
- 打撃成績を avg 降順、投手成績を era 昇順で取得
- 年度・種別の切替はクライアントサイド

### `/lineup/[teamId]` — 打順シミュレーター（`app/lineup/[teamId]/page.tsx`）

- **Server Component** + Client Component（`LineupOptimizer.tsx`）
- `generateStaticParams()` で全 12 球団を静的生成
- サーバー側で選手データ取得 → クライアントへシリアライズ
- クライアント側で Markov Chain 計算（`lib/markov.ts`）

---

## コンポーネント構成

```
app/layout.tsx                  ルートレイアウト
├── app/page.tsx                順位表（Server）
├── app/teams/[id]/
│   ├── page.tsx                チーム詳細（Server）
│   └── TeamStats.tsx           打撃・投手・守備タブ（Client）
├── app/players/
│   ├── page.tsx                選手成績 データフェッチ（Server）
│   └── PlayersClient.tsx       フィルター・テーブル表示（Client）
└── app/lineup/[teamId]/
    ├── page.tsx                データフェッチ（Server）
    └── LineupOptimizer.tsx     打順組み立て・シミュレーション（Client）
```

**ルール:**
- `"use client"` が付いたファイルはブラウザで実行される
- データ取得（Prisma）は必ず Server Component（`page.tsx`）で行う
- Client Component へはシリアライズ可能な plain object のみ渡す

---

## セイバーメトリクス計算（`lib/sabermetrics.ts`）

| 指標 | 説明 |
|------|------|
| wOBA | 打席価値の加重平均（NPB 近似 weights） |
| ISO | SLG − AVG（長打力） |
| BABIP | インプレー打率 |
| K% / BB% | 三振率・四球率 |
| Bayesian Shrinkage | 打席数が少ない選手をリーグ平均に近づける補正 |

## Markov Chain シミュレーション（`lib/markov.ts`）

- **状態**: outs(0–2) × runners bitmask(0–7) = 24 状態 + TERMINAL
- **遷移**: 各打者の打席確率（四球・単打・二塁打・三塁打・本塁打・三振・ゲッツー・その他アウト）
- **出力**: 9イニング合計得点期待値、イニング別内訳
- **最適化**: wOBA 降順スタート + ランダムスタート × 4 の山登り法

---

## データ更新フロー

```
config/npb-urls.ts
  └── NPB 公式 URL (チームコード → 年度別 URL)

update-stats.ts (オーケストレーター)
  ├── fetchTsv(url) で HTML テーブルを TSV 変換
  ├── import-batting.ts  (stdin TSV → seed-data 更新)
  ├── import-pitching.ts (stdin TSV → seed-data 更新)
  └── import-players.ts  (ロスターページ → seed-data 更新)

validate-seed-data.ts (整合性チェック)
  ├── avg / obp > 1 のチェック
  ├── hits > atBats のチェック
  └── 重複 (playerId, seasonYear) チェック

prisma/seed.ts (DB 投入)
  └── upsert で重複対応
```

### インポートスクリプトの仕様

**NPB.jp 打撃テーブルの列構造（実際）:**

| col | 項目 | 備考 |
|-----|------|------|
| 0 | 選手名 | `*` 付きは打席なし選手 |
| 1 | 試合 | |
| 2 | 打席 | |
| 3 | 打数 | |
| 4 | **得点** | ← 注意: 安打ではない |
| 5 | 安打 | |
| 6 | 二塁打 | |
| 7 | 三塁打 | |
| 8 | 本塁打 | |
| 9 | 塁打 | スキップ（colspan により実際の列数は 23） |
| 10 | 打点 | |
| 11 | 犠打 | |
| 12 | 盗塁死 | |
| 13 | 盗塁 | |
| 14 | 犠飛 | |
| 15 | 四球 | |
| 16 | 故意四球 | |
| 17 | 死球 | |
| 18 | 三振 | |
| 19 | 併殺打 | |
| 20 | 打率 | |
| 21 | 長打率 | |
| 22 | 出塁率 | |
| cols[23] は存在しない | OPS は cols[22] + cols[21] から計算 |

> **重要**: NPB.jp 打撃テーブルは選手名セルに `colspan` が設定されており、HTML パース後の実セル数は **23** になる。`cols.length < 20` でヘッダー行を除外する（`< 24` にすると全行フィルタされる）。

---

## シードデータ構造

```
prisma/seed-data/
├── teams.ts                    # 全 12 球団
├── stadiums.ts                 # 全球場
├── seasons.ts                  # シーズン年度
├── standings.ts                # 順位データ
├── players-central.ts          # セントラル選手名簿
├── players-pacific.ts          # パシフィック選手名簿
├── batting-stats-central.ts    # セントラル打撃成績
├── batting-stats-pacific.ts    # パシフィック打撃成績
├── pitching-stats-central.ts   # セントラル投手成績
└── pitching-stats-pacific.ts   # パシフィック投手成績
```

### セクションヘッダー形式（重要）

インポートスクリプトがセクションを検索・置換するため、**以下の形式を厳守**:

```typescript
// ── teamId year ──────────────────────
{ playerId: "...", seasonYear: 2025, ... },
```

- `// ── ` (全角ダッシュ + 半角スペース)
- `teamId`（英語 ID、例: `giants`, `hawks`）
- ` year`（半角スペース + 4桁年）
- ` ──────────────────────`（スペース + ダッシュ）

この形式でないと `import-batting.ts` / `import-pitching.ts` が既存セクションを上書きできず、データが重複します。
