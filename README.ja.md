🇬🇧 [English](README.md) • 🇻🇳 [Tiếng Việt](README.vi.md) • 🇪🇸 [Español](README.es.md) • 🇧🇷 [Português](README.pt-BR.md) • 🇯🇵 **日本語** • 🇨🇳 [简体中文](README.zh-CN.md) <br>
🇰🇷 [한국어](README.ko.md) • 🇩🇪 [Deutsch](README.de.md) • 🇫🇷 [Français](README.fr.md) • 🇷🇺 [Русский](README.ru.md) • 🇮🇩 [Bahasa Indonesia](README.id.md)

<p align="center">
  <img src="icons/icon-128.png" alt="TabRest Logo" width="128" height="128">
</p>

<h1 align="center">TabRest</h1>

<p align="center">
  タブを休ませて、メモリを解放する - 非アクティブなタブを自動的にアンロードする Chrome 拡張機能です。
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Manifest-V3-blue?logo=googlechrome" alt="Manifest V3">
  <img src="https://img.shields.io/github/actions/workflow/status/lamngockhuong/tabrest/ci.yml?branch=main&logo=github" alt="CI Status">
  <img src="https://img.shields.io/badge/code_style-biome-60a5fa?logo=biome" alt="Code Style: Biome">
  <img src="https://img.shields.io/badge/JavaScript-ES_Modules-f7df1e?logo=javascript&logoColor=black" alt="JavaScript ES Modules">
  <img src="https://img.shields.io/github/license/lamngockhuong/tabrest" alt="License">
</p>

## 機能

- **非アクティブなタブの自動アンロード** - 設定可能なタイマー (5 分から 4 時間)
- **メモリしきい値** - RAM が 60-95% を超えるとアンロード
- **タブごとのメモリ上限** - JS heap が 100MB-1GB を超えるタブをアンロード
- **起動時のアンロード** - ブラウザ起動時にメモリを解放
- **手動操作** - 現在/左/右/その他のタブをアンロード
- **重複タブを閉じる** - 現在のウィンドウでワンクリック重複排除
- **タブ検索** - タイトルまたは URL でタブ一覧をリアルタイムフィルタリング
- **タブグループ** - タブグループ全体をアンロード
- **サイドパネルモード** - Chrome のサイドパネルで TabRest を開く (オプション)
- **タブ/サイトのスヌーズ** - タブまたはドメインを一時的に保護 (30 分 - 2 時間)
- **破棄前の警告トースト** - 自動破棄前にページ上で 3 秒間警告を表示
- **ビジュアルインジケーター** - 破棄済みタブのタイトルにカスタマイズ可能なプレフィックス (💤) を表示
- **ホワイトリスト** - サイトを自動アンロードから保護 (localhost と IP をサポート)
- **インポート/エクスポート** - ホワイトリスト、ブラックリスト、セッションを JSON にバックアップ
- **セッション** - タブセットを保存して復元
- **スクロール位置の復元** - タブの再読み込み時にスクロール位置を復元
- **YouTube タイムスタンプ** - 再読み込み後に最後の再生位置から動画を再開
- **オフライン時はスキップ** - ネットワーク未接続時はタブを破棄しない
- **アイドル時のみモード** - コンピューターがアイドル状態のときのみ自動アンロード
- **電源モード** - 省電力、通常、高パフォーマンスのプロファイル
- **自動アンロード通知** - タブがアンロードされたときに通知を受け取る
- **メモリツールチップ** - 統計にカーソルを合わせてタブごとに節約できる推定 RAM を確認
- **オンボーディングウィザード** - 初回起動時のインタラクティブな複数ステップのセットアップ
- **オプトインのエラーレポート** - Sentry による匿名クラッシュレポート (デフォルト無効) と手動バグレポート送信
- **変更履歴の自動表示** - マイナー/メジャーアップデート時にリリースノートを自動で開く
- **オプションのホスト権限** - フォーム保護は有効にした場合のみアクセスを要求
- **RAM 使用率の表示** - ポップアップのヘッダーでリアルタイム RAM % を確認
- **統計** - アンロードされたタブ数と節約されたメモリを追跡
- **多言語対応** - 英語とベトナム語をサポート

## キーボードショートカット

| ショートカット | 操作                         |
| -------------- | ---------------------------- |
| `Alt+Shift+D`  | 現在のタブをアンロード       |
| `Alt+Shift+O`  | その他のタブをアンロード     |
| `Alt+Shift+→`  | 右側のタブをアンロード       |
| `Alt+Shift+←`  | 左側のタブをアンロード       |

## インストール

### ソースからインストール

1. このリポジトリをクローンする
2. Chrome で `chrome://extensions` を開く
3. 「デベロッパーモード」を有効にする (右上)
4. 「パッケージ化されていない拡張機能を読み込む」をクリック
5. プロジェクトフォルダーを選択する

### Chrome Web Store からインストール

近日公開予定。

## 仕組み

TabRest は Chrome のネイティブ API `chrome.tabs.discard()` を使用してタブをアンロードします。破棄されたタブは次のようになります。

- タブバーに表示されたままになる
- スクロール位置とフォームデータを保持する
- クリックするとすぐに再読み込みされる
- 非アクティブ中はメモリを解放する

## プロジェクト構成

```text
tabrest/
├── manifest.json           # 拡張機能の設定 (MV3)
├── _locales/               # i18n 翻訳 (en, vi)
├── src/
│   ├── background/         # service worker モジュール
│   ├── content/            # Form checker、YouTube tracker
│   ├── popup/              # ポップアップ / サイドパネル UI
│   ├── options/            # 設定ページ
│   ├── pages/              # オンボーディング、変更履歴
│   └── shared/             # 共有ユーティリティ
├── icons/                  # 拡張機能のアイコン
├── website/                # Astro ドキュメントサイト (tabrest.ohnice.app)
└── docs/                   # プロジェクトドキュメント
```

## 開発

```bash
pnpm install          # 依存関係をインストール
pnpm run lint         # Biome でコードをチェック
pnpm run lint:fix     # lint の問題を自動修正
pnpm run format       # コードをフォーマット
pnpm run ci           # CI をフルで実行 (validate + lint)
```

## プロモーション素材

Chrome Web Store のプロモーション画像は `assets/` に SVG ソースとして保存されています。

```bash
./scripts/generate-promo-images.sh   # PNG ファイルを生成
```

## プライバシー

- データ収集なし
- 外部サーバーなし
- すべての設定はローカルに保存
- [プライバシーポリシー](docs/privacy-policy.md) を参照

## スポンサー

この拡張機能が役に立った場合は、開発をサポートすることをご検討ください。

[![GitHub Sponsors](https://img.shields.io/badge/GitHub_Sponsors-Support-ea4aaa?logo=githubsponsors&logoColor=white)](https://github.com/sponsors/lamngockhuong)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy_Me_A_Coffee-Support-FFDD00?logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/lamngockhuong)
[![MoMo](https://img.shields.io/badge/MoMo-Support-ae2070)](https://me.momo.vn/khuong)

## その他のプロジェクト

- [GitHub Flex](https://github.com/lamngockhuong/github-flex) - 生産性機能で GitHub のインターフェースを強化するクロスブラウザー拡張機能
- [Termote](https://github.com/lamngockhuong/termote) - モバイル/デスクトップから PWA 経由でリモート操作できる CLI ツール (Claude Code、GitHub Copilot、あらゆるターミナルに対応)

## ライセンス

MIT
