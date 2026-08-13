# Country Lyrics

素の HTML / CSS / JavaScript の演奏用歌詞アプリです。ビルドはありません。
`server.py` は静的配信と、日本語訳のための翻訳窓口 `POST /api/translate` を提供します。

## 起動方法

翻訳を使う場合は、DeepL のキーを **KeyVault 経由で環境変数 `DEEPL_KEY`** に渡して起動してください。
キーはコードにもファイルにも置きません。

    vault exec Deepl DEEPL_KEY -- python3 ~/OUTLAW/Lyrics/server.py

起動後、ブラウザで http://localhost:8080 を開きます。

`DEEPL_KEY` を渡さずに（`python3 server.py` のように）起動してもアプリは立ち上がり、
翻訳以外の機能はすべて動きます。その状態で翻訳を実行すると、画面に
「DEEPL_KEY が渡されていません。vault exec 経由で起動してください」と表示されます。

## 日本語の対訳について

- 曲データに `lyricsJa`（日本語訳）と `lyricsJaSource`（`"deepl"` / `"manual"` / `""`）を持ちます。
- 歌詞を取得すると、訳が空の曲だけ自動で DeepL 翻訳します。手で直した訳（`manual`）は上書きしません。
- 曲一覧の「未訳をまとめて翻訳」で一括翻訳できます。途中で止められます。
- DeepL 無料枠は月 50 万文字です。送信した文字数を月ごとに記録し、画面に「今月 ○○ 文字 / 500,000」と表示します。
  45 万文字で警告、50 万文字で送信を止めます。
- 演奏画面の表示モードの最後に「対訳（mode-bilingual）」を追加しています。英語の下に日本語を出す練習用モードです。
