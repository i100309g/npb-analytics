# /import-stats — 選手成績インポート

TSV形式の成績データを貼り付けるとシードファイルに直接書き込みます。推論なし・事実のみ更新。

## 使い方

```
/import-stats
```

その後、以下を伝えてください：
1. **チームID** (例: `baystars`, `giants`, `tigers`, `carp`, `dragons`, `swallows`)
2. **種別** (`batting` または `pitching`)
3. **TSVデータ**（公式サイトからコピーした成績表をそのまま貼り付け）

## 実行コマンド

### 打撃成績

```bash
echo "<TSV_DATA>" | npx tsx scripts/import-batting.ts <teamId>
```

### 投手成績

```bash
echo "<TSV_DATA>" | npx tsx scripts/import-pitching.ts <teamId>
```

## TSV列順

### 打撃（batting）

```
選手名  打率  試合  打席  打数  安打  二塁打  三塁打  本塁打  塁打  打点  得点  三振  四球  死球  犠打  犠飛  盗塁  盗塁死  併殺打  出塁率  長打率  OPS  得点圏打率  失策
```

### 投手（pitching）

```
選手名  防御率  登板  先発  交代完了  勝利  敗戦  ホールド  HP  セーブ  勝率  投球回  打者  被安打  被本塁打  奪三振  奪三振率  与四球  与死球  暴投  失点  自責点  被打率  K/BB  WHIP
```

## 注意事項

- `-` は 0 として処理
- マッチしない選手名は `WARN` を表示してスキップ（推論なし）
- 既存セクションは完全に上書き、新チームは末尾に追加
- 更新後は `npm run seed` でDBに反映

## エージェントへの指示

ユーザーがTSVデータを貼り付けたら：
1. チームIDと種別を確認（不明なら質問）
2. 上記コマンドを実行（stdin経由でTSVを渡す）
3. 出力の WARN を報告し、マッチしなかった選手名を確認
4. 成功したら `npm run seed` を実行してDBを更新
5. コミットとプッシュを行う
