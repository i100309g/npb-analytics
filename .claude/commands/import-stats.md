# /import-stats — NPB データインポート

TSV形式のデータを貼り付けるとシードファイルに直接書き込みます。推論なし・事実のみ更新。

## 使い方

```
/import-stats
```

その後、以下を伝えてください：
1. **チームID** (例: `baystars`, `giants`, `tigers`, `carp`, `dragons`, `swallows`)
2. **種別** (`batting` / `pitching` / `players`)
3. **TSVデータ**（公式サイトからコピーしたデータをそのまま貼り付け）

## 実行コマンド

### 打撃成績

```bash
echo "<TSV_DATA>" | npx tsx scripts/import-batting.ts <teamId>
```

### 投手成績

```bash
echo "<TSV_DATA>" | npx tsx scripts/import-pitching.ts <teamId>
```

### 選手データ

```bash
echo "<TSV_DATA>" | npx tsx scripts/import-players.ts <teamId> [--file central|pacific]
```

`--file` は省略すると `central`。パ・リーグは `--file pacific` を指定。

## TSV列順

### 打撃（batting）

```
選手名  打率  試合  打席  打数  安打  二塁打  三塁打  本塁打  塁打  打点  得点  三振  四球  死球  犠打  犠飛  盗塁  盗塁死  併殺打  出塁率  長打率  OPS  得点圏打率  失策
```

### 投手（pitching）

```
選手名  防御率  登板  先発  交代完了  勝利  敗戦  ホールド  HP  セーブ  勝率  投球回  打者  被安打  被本塁打  奪三振  奪三振率  与四球  与死球  暴投  失点  自責点  被打率  K/BB  WHIP
```

### 選手データ（players）

```
ポジション  背番号  選手名  フリガナ  投  打  生年月日  出身地  身長  体重  国籍
```

ポジション値: `投手` / `捕手` / `一塁手` / `二塁手` / `三塁手` / `遊撃手` / `外野手` / `内野手`

投打: `右` / `左` / `両`（打のみ）

国籍: `日本` / `外国`

## 照合ロジック（全スクリプト共通）

| 種別 | 照合キー | 一致時 | 不一致時 |
|------|----------|--------|---------|
| batting | 選手名（正規化） | 既存セクションを置換 | WARN・スキップ |
| pitching | 選手名（正規化） | 既存セクションを置換 | WARN・スキップ |
| players | 選手名（正規化） | ID維持・フィールド更新 | 新規ID採番・追加 |

- 正規化 = スペース/・を除去した完全一致。推論なし。
- `players` でDB選手がTSVにいない場合 → WARN出力（`active: false` は自動変更しない）

## 自動フェッチモード（URLを設定済みの場合）

`config/npb-urls.ts` にURLが設定されていれば、コピペ不要で自動更新できる：

```bash
npm run update:stats              # 全チーム（batting + pitching）
npm run update:batting            # 全チームの打撃のみ
npm run update:pitching           # 全チームの投手のみ
npx tsx scripts/update-stats.ts --team baystars          # 1チームのみ
npx tsx scripts/update-stats.ts --team baystars --dry-run  # 試し実行（書き込みなし）
```

URLの設定方法（一度だけ実施）：
1. `config/npb-urls.ts` を開く
2. 各チームの `battingUrl` / `pitchingUrl` / `rosterUrl` に公式ページのURLを貼る
3. 以降は `npm run update:stats` だけで自動更新

## 注意事項

- `-` は 0 として処理
- 更新後は必ず `npm run seed` でDBに反映（`update:stats` は自動実行）
- コミット前に `git diff prisma/seed-data/` で差分を確認

## エージェントへの指示

### ユーザーがTSVを貼り付けた場合

1. チームIDと種別を確認（不明なら質問）
2. 対象スクリプトを実行（stdin経由でTSVを渡す）
3. 出力のWARNを全てユーザーに報告する
4. 選手データで退団候補が出た場合 → ユーザーに確認してから `active: false` に手動更新
5. `npm run seed` を実行してDBを更新
6. `git diff prisma/seed-data/` で変更内容を確認・報告
7. コミットとプッシュを行う

### ユーザーがURLを提供した場合

1. `config/npb-urls.ts` の該当チームの該当URLフィールドを更新する
2. `npx tsx scripts/update-stats.ts --team <teamId> --dry-run` で動作確認
3. 問題なければ `npx tsx scripts/update-stats.ts --team <teamId>` で本実行
4. WARNをユーザーに報告
5. コミットとプッシュを行う
