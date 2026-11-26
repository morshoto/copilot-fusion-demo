# 実演録画の準備と確認

## 検証済みの範囲

2026-11-25 に asciinema 3.2.1 で `copilot --version` の端末出力を asciicast v2 に記録し、asciinema-agg 1.9.0 で GIF に変換した。生成された GIF は 1185 × 840、2フレームで、表示内容を画像で確認した。これは録画パイプラインのスモークテストであり、Fusion の実行や Framekit 開発の録画ではない。テスト録画は公開しない。

## 本番手順

1. GitHub / Copilot CLI の認証を確認し、Framekit の対象 Issue と並行 PR を再確認する。固定 SHA から独立 worktree を用意し、実験条件、依頼、権限と利用量の記録先を決める。無関係なディレクトリや外部サービスの権限を一括許可しない。
2. 非公開の作業ディレクトリに新規ファイルとして録画する。ターミナルのサイズと文字の大きさを先に確認し、キャプチャにアカウント情報や通知を表示しない。キーボード入力の記録は有効にしない。

   ```sh
   nix shell nixpkgs#asciinema nixpkgs#asciinema-agg
   asciinema rec -f asciicast-v2 /tmp/fusion-live.cast
   # 録画セッション内で実際の Copilot CLI 操作を行い、exit で終了
   ```

   `/tmp/fusion-live.cast` が既に存在する場合は上書きせず、別名を選ぶ。Fusion の選択、依頼、実際に観測された動作と結果が映るようにする。実際に操作できなければ録画成功としない。
3. **変換前に録画全体を確認する。** asciicast は画面に表示された文字を含む。秘密、個人情報、不要なパス、非公開のプロンプトや回答を含む場合は共有せず、内容を見直して安全な条件で撮り直す。端末ログ、セッション履歴や利用量画面にも注意する。
4. 内容を確認できた録画から GIF を生成し、前後を含む全フレームを確認する。

   ```sh
   agg --theme github-dark --font-size 24 /tmp/fusion-live.cast /tmp/fusion-live.gif
   ffprobe -v error -show_entries stream=width,height,nb_frames -of default=noprint_wrappers=1 /tmp/fusion-live.gif
   ```

5. 読める文字サイズ、経路・結果、再生速度、開始と終了、公開範囲を確認する。時間を短縮した場合は明記し、録画をライブ操作と誤認させない。確認済み GIF を資料に挿入し、再レンダリングして全体の15分通し練習を行う。

## 認証に関する経緯

録画の初回試行は Copilot CLI の認証エラーで停止した。その後 GitHub CLI を再認証し、実録画を取得した。音声合成の尺は参考値であり、発表者の実測ではない。

## 実録画（2026-11-25）

認証回復後、Framekit #796 の回帰テスト作成と修正を Fusion に依頼し、実際の端末出力を2つの GIF にした。[実験の条件・結果と公開範囲](../experiments/framekit-796-development.md)を参照。個人パスとセッション ID を伏せ、待機を短縮した録画である。途中のセッション上限到達と再開は GIF だけでは見えないため、実験記録に明記した。15分の実際の通し練習は未実施。
