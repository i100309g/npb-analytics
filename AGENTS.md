# NPB Analytics — AI 向け開発ガイド

## プロジェクト概要

NPB（日本プロ野球）の成績を可視化する静的 Web アプリ。  
Next.js 16 App Router + `output: "export"` で静的 HTML を生成し、GitHub Pages でホストする。

**重要**: このプロジェクトは Next.js 16 を使用しており、15 以前とはいくつかの API が異なる。  
以下のルールをすべて読んでから実装を始めること。

---

## Next.js 16 固有のルール

### params は必ず await する

```typescript
// ✅ 正しい（Next.js 15+）
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  ...
}

// ❌ 古い書き方（Next.js 14 以前）
export default function Page({ params }: { params: { id: string } }) {
  const { id } = params;  // エラーになる
}
```

### 静的エクスポートの制約

`output: "export"` のため以下は使用不可:
- `next/headers`（cookies / headers）
- `useRouter().push()` によるサーバーサイドリダイレクト
- `revalidate` / ISR（動的再生成）
- Route Handlers（`app/api/`）

### generateStaticParams

動的ルート（`[id]`）を持つページは必ず `generateStaticParams()` を実装する:

```typescript
export async function generateStaticParams() {
  const teams = await prisma.team.findMany({ select: { id: true } });
  return teams.map((t) => ({ id: t.id }));
}
```

---

## アーキテクチャルール

### Server Component vs Client Component

| 用途 | どちらを使うか |
|------|--------------|
| DB 取得（Prisma） | **Server Component のみ** |
| インタラクション（useState, onClick） | Client Component（`"use client"` が必要） |
| Markov Chain 計算 | Client Component（重い計算はブラウザ側） |

**Client Component に渡せるのは plain object のみ**（Prisma の型オブジェクトはそのまま渡せない — シリアライズ可能な形に変換する）。

### データ取得

- Prisma のクエリは必ず `page.tsx`（Server Component）で実行する
- `lib/prisma.ts` のシングルトンを使う（`import { prisma } from "@/lib/prisma"`）
- ページ間で共通するクエリは `lib/db/` に切り出す

### ファイル配置

```
app/[route]/
├── page.tsx          # Server Component（DB 取得・静的生成）
└── XxxClient.tsx     # Client Component（インタラクション）
```

---

## コーディング規約

### TypeScript

- `any` は使用禁止
- Prisma が返す型は `typeof prisma.xxx.findMany` の戻り値を使う（手動型定義は重複）
- 共有型は `lib/types.ts` に置く（まだない場合は作成して良い）

### スタイル（Tailwind CSS v4）

- クラス名は Tailwind のユーティリティのみ使用
- インラインスタイルはチームカラー（`team.color`）など動的な値のみ許可
- レスポンシブ: `sm:` / `md:` プレフィックスを活用する

### コメント

- コードが何をするかは書かない（変数名・関数名で伝える）
- **なぜ** そうしているかが自明でない場合のみ書く
- 特に NPB.jp サイト固有の挙動（colspan 問題など）は必ずコメントを残す

---

## DB・シードデータルール

### 絶対にやってはいけないこと

1. **`seed-data/` を直接削除・上書きしない** — 自動更新で生成されたデータが消える
2. **`prisma/seed.ts` で `create()` を使わない** — `upsert()` を使う（重複 unique 制約エラー）
3. **インポートスクリプトを手動で壊さない** — 特に `cols.length < 20` の判定（`< 24` にすると全行スキップされる）

### seed-data のセクションヘッダー形式（必須）

```typescript
// ── teamId year ──────────────────────
```

この形式でないとインポートスクリプトのセクション置換が失敗し、データが重複する。  
日本語チーム名（`// ── 読売ジャイアンツ ──`）は使用禁止。

### upsert パターン

```typescript
await prisma.battingStat.upsert({
  where: { playerId_seasonYear: { playerId: b.playerId, seasonYear: b.seasonYear } },
  update: b,
  create: b,
});
```

---

## よくある落とし穴

| 状況 | 原因 | 対処 |
|------|------|------|
| 打撃成績が全て 0 | `cols.length < N` の N が大きすぎる | `N = 20` に戻す |
| OPS が 0.000 | NPB.jp は 23 セル/行なので cols[23] は undefined | `obp + slg` で計算 |
| 選手名がスキップされる | `*山田修義` のように先頭に `*` がある | `lookupId` が自動除去済み |
| シードが unique 制約エラー | `create()` を使っている | `upsert()` に変更 |
| インポートでセクション重複 | ヘッダー形式が標準でない | `// ── teamId year ──` 形式に統一 |

---

## 開発ワークフロー

### 変更を加えたら

```bash
# 1. 型チェック
npx tsc --noEmit

# 2. DB が必要な変更なら seed を確認
npm run seed

# 3. ビルド確認
npm run build
```

### データを変更したら

```bash
# 整合性チェック
npm run validate

# DB 再投入
npm run seed
```

### GitHub Actions のデバッグ

- ワークフローは `claude/implement-claude-tasks-M9bIu` ブランチで実行
- 手動実行: Actions タブ → 「成績自動更新」→ Run workflow
- ログは GitHub Actions の UI で確認

---

## 参考リンク

- [アーキテクチャ設計書](docs/architecture.md)
- [データインポート手順書](docs/data-import.md)
- [README](README.md)
