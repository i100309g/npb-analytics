# ⚾ NPB Analytics

日本プロ野球（NPB）の選手成績・チーム順位を可視化する静的 Web アプリです。  
毎日 GitHub Actions が NPB 公式サイトからデータを自動取得し、シードデータを更新します。

## 機能

| ページ | 説明 |
|--------|------|
| `/` | セントラル・パシフィック両リーグの順位表 |
| `/teams/[id]` | チーム別 打撃・投手・守備成績（年度切替あり） |
| `/players` | 全球団の打撃成績ランキング・投手成績ランキング |
| `/lineup/[teamId]` | **打順シミュレーター** — Markov Chain で得点期待値を計算 |

## 技術スタック

| カテゴリ | 採用技術 |
|----------|----------|
| フレームワーク | Next.js 16 (App Router, `output: "export"`) |
| スタイル | Tailwind CSS v4 |
| DB | SQLite (`better-sqlite3`) + Prisma v7 |
| ランタイム | Node.js 22, tsx |
| CI/CD | GitHub Actions（日次自動更新 + GitHub Pages デプロイ） |

## セットアップ

```bash
# 依存関係インストール
npm ci

# Prisma クライアント生成
npx prisma generate

# DB 作成 + シードデータ投入
npm run seed

# 開発サーバー起動
npm run dev
```

> [!NOTE]
> `output: "export"` のため、`next dev` は動きます。
> 本番ビルドは `npm run build` で `out/` に静的ファイルを生成します。

## ディレクトリ構成

```
npb-analytics/
├── app/                        # Next.js App Router ページ
│   ├── layout.tsx              # ルートレイアウト（ヘッダー含む）
│   ├── page.tsx                # トップ：順位表
│   ├── teams/[id]/             # チーム詳細
│   ├── players/                # 選手成績ランキング
│   └── lineup/[teamId]/        # 打順シミュレーター
├── lib/
│   ├── prisma.ts               # Prisma クライアントシングルトン
│   ├── sabermetrics.ts         # wOBA / BABIP / ISO 計算
│   └── markov.ts               # Markov Chain 打順シミュレーション
├── prisma/
│   ├── schema.prisma           # DB スキーマ
│   ├── seed.ts                 # シードスクリプト
│   └── seed-data/              # チーム・選手・成績データ（TS ソース）
├── scripts/
│   ├── import-batting.ts       # 打撃成績インポーター
│   ├── import-pitching.ts      # 投手成績インポーター
│   ├── import-players.ts       # 選手ロスターインポーター
│   ├── update-stats.ts         # 全チーム自動更新オーケストレーター
│   ├── validate-seed-data.ts   # シードデータ整合性チェック
│   └── lib/player-lookup.ts    # 選手名 → ID ルックアップ
├── config/
│   └── npb-urls.ts             # NPB 公式サイト URL 設定
└── .github/workflows/
    └── update-stats.yml        # 日次自動更新ワークフロー
```

## npm スクリプト

```bash
npm run seed              # DB にシードデータを投入
npm run validate          # シードデータの整合性チェック
npm run import:batting    # 打撃成績を手動インポート（stdin から TSV を受け取る）
npm run import:pitching   # 投手成績を手動インポート
npm run import:players    # 選手ロスターを手動インポート
npm run update:batting    # NPB サイトからデータ取得 → インポート（全チーム）
npm run update:pitching   # 同上（投手）
npm run update:2025       # 2025 年度の打撃・投手を全チーム更新
npm run update:2026       # 2026 年度の打撃・投手を全チーム更新
```

詳細は [docs/data-import.md](docs/data-import.md) を参照してください。

## 自動更新

`.github/workflows/update-stats.yml` が毎日 00:00 JST に起動します。

1. NPB 公式サイトから全 12 球団の成績を取得
2. `prisma/seed-data/` を更新
3. `validate-seed-data.ts` で整合性チェック（失敗時は中断）
4. DB を再シード
5. 変更があれば自動コミット

GitHub Actions の手動実行（`workflow_dispatch`）では年度・チーム・種別を指定できます。

## アーキテクチャ詳細

[docs/architecture.md](docs/architecture.md) を参照してください。
