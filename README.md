
# Relational Abilities Index - 日本語版
このプログラムは，[Relational Abilities Index](https://github.com/JamieCummins/relational-abilities-index)(RAI) を日本語に翻訳し，Webブラウザから実施可能なプログラムとして開発されています。
**Node.js** 環境で動作し，**server.js**があるディレクトリでターミナルを起動し，`npm run start` によって起動できます。

プログラム自体は`GPL-3.0 license`としてますが，RAIの商用利用の際にはRAI開発元 (例えばhttps://raiseyouriq.com/) にご連絡をお願いいたします。

---
## 📁ディレクトリ構成と📝ファイルについて

### Experimental version (`RAI67-ja_v1.0` / `RAI128-ja_v1.0`)
- 信頼性と妥当性の検証時に使用した初期バージョンである。
- とりあえず動くことを重視して作成されており、コードの整理はされていない。

### Cross-platform version (`RAI67-ja_v2.0` / `RAI128-ja_v2.0`)
- 課題内容はExperimental versionと同じである。
- JavaScriptをモジュール化しており、編集・改変がしやすい構成になっている。
- 同時に書き込みが生じた際にも競合しないよう、簡易的な対策を講じている。
- レイアウトが異なるデバイス（PC、タブレット、スマートフォン）でも崩れないよう設計されている。

#### `relation.csv`
- 課題で使用される、無意味つづり以外の文章を収録している。
- `type_X`は無意味つづりの順番を入れ替えるためのフラグであり、`RAI128`でのみ使用されている。
- この仕様により、`RAI128`では出力される`RAI-ja_result.csv`の問題文・質問文が画面表示と一致しない（将来的に修正する可能性あり）。

#### `stimulus.csv`
- 課題で使用される3文字の無意味つづりを収録している。
- 1行が1セットになっており、課題中はランダムに刺激セットが選ばれる。
- 刺激セット内でも表示順序はランダム化される。

---

## 🔰課題について

以下のスクリーンショットは、**Experimental version `RAI67-ja_v1.0`** のものである。
`http://localhost:8000`にアクセスすると、次の画面が表示される。

![img 1](/img/1.png)

参加者ID、メールアドレス、年齢、性別をすべて入力しなければモーダルが表示され、次に進めない。  
この時点で`RAI-ja_results.csv`が作成され、データ記録が開始される。

![img 2](/img/2.png)

「課題を開始する」ボタンをクリックすると課題が開始される。

![img 3](/img/3.png)

これはRAI-67の25問目の課題画面である。  
右上には、課題の進捗状況と制限時間が表示されている。  
「はい」と「いいえ」の選択肢はランダムに配置されるが、同じ配置が3回以上連続することはない。  
回答はサーバーのターミナルに表示されるが、**課題中には保存されない**。

![img 4](/img/4.png)

課題終了後の画面（デモンストレーション用に意図的にエラーを発生させている）。  
エラーが発生すると「データが記録できませんでした。」と表示される。  
このとき、データの再送信ボタンおよびCSV保存ボタンが表示される。  
これらのボタンが機能しない場合に備え、ブラウザのコンソールにも記録が出力される。

![img 5](/img/5.png)

---

## 💻Node.js アプリケーションの実行方法

このプログラムは **Node.js** 環境で動作します。以下の手順に従って、ローカル環境で実行してください。

### 必要な環境

- [Node.js](https://nodejs.org/)（推奨バージョン: 18.x 以上）
- npm（Node.js に同梱）

### セットアップと実行手順

```bash
# 1. このリポジトリをクローン
git clone https://github.com/678-asakura/relational-abilities-index-ja.git
```

### ▶ 実行方法（例: `RAI67-ja_v2.0`）
以下の手順で各プログラムを個別に起動できます。

```bash
# 1. 対象ディレクトリに移動
cd "Cross-platform version/RAI67-ja_v2.0"

# 2. 依存パッケージをインストール（初回のみ）
npm install

# 3. アプリケーションを起動
npm run start
```

---
## ⚙️細かな仕様

(ほぼ開発メモ)
1. Webブラウザは最新のものでないと課題が機能しないことがある。
1. CSSに**CDNのBootstrap**を使用している。
   - そのため，インターネット環境がないと見た目が崩れる。
   - サーバー内にCSSを埋め込んで対応することも可能。
1. 記録データの`.csv`ファイルを開いていると保存ができない。
   - 記録のエラーのほとんどが`.csv`ファイルを開いている場合。
   - 加えてサーバーの再起動で対応できなければご連絡ください。
1. RAI128の`RAI-ja_result.csv`では呈示された刺激文が表示された刺激文でないことがある。
   - 開発時の設計ミス。読み込むファイルを改変したら表示されたものと一致する。
   - 機能的には問題ないので修正していません (いつか更新することがあれば)。
1. 読み込みが終われば基本的には課題終了まで回線が切れていても問題ないはず。
   - 動作も軽いので機械やブラウザのスペック差もほとんどでないはず。
1. 時間切れのときに5秒のタイムアウトを設定できる。
   - 時間切れ間際のクリック連打による誤作動防止だが結局使わず。
   - コードを読めばそんな機能が他にあるかも。

---
# Relational Abilities Index - Japanese Version

>##### 📢 Attribution Notice
>###### Parts of this documentation were created or refined with the assistance of AI tools to improve clarity and readability.

This program is a web-based implementation of the [Relational Abilities Index](https://github.com/JamieCummins/relational-abilities-index)(RAI), translated into Japanese.  
It runs in a **Node.js** environment. Open a terminal in the directory where `server.js` is located, and start the server by running `npm run start`.

The program itself is distributed under the `GPL-3.0 license`,  
but if you wish to use the RAI for **commercial purposes**, please contact the original developers (e.g., [https://raiseyouriq.com/](https://raiseyouriq.com/)).

---
## 📁 Directory Structure and 📝 File Overview

### Experimental version (`RAI67-ja_v1.0` / `RAI128-ja_v1.0`)
- Initial versions used for validating reliability and validity.
- Code prioritizes functionality over organization; not well structured.

### Cross-platform version (`RAI67-ja_v2.0` / `RAI128-ja_v2.0`)
- Same task content as the Experimental version.
- JavaScript has been modularized for easier editing and modification.
- Simple measures are implemented to avoid conflicts when simultaneous writing occurs.
- Layout remains stable across different screen sizes, making it compatible with PCs, tablets, and smartphones.

#### `relation.csv`
- Contains all text used in the task except for the nonsense syllables.
- `type_X` is a flag for swapping the order of nonsense syllables, used only in `RAI128`.
- Due to this setup, problem and question texts in `RAI-ja_result.csv` for `RAI128` may differ from the on-screen display (may be corrected in a future update).

#### `stimulus.csv`
- Contains three-letter nonsense syllables used in the task.
- Each row represents a stimulus set, and one set is randomly selected for each problem.
- Within each set, the placement of syllables is randomized during the task.

---

## 🔰 About the Task

The screenshots below are from **Experimental version `RAI67-ja_v1.0`**.

Accessing `http://localhost:8000` should display this screen:

![img 1](/img/1.png)

Participants must fill in ID, email address, age, and gender.  
Otherwise, a modal will appear and prevent proceeding.  
At this point, a `RAI-ja_results.csv` file will be created and data will begin being recorded.

![img 2](/img/2.png)

Click the "Start Task" button to begin the RAI.

![img 3](/img/3.png)

This is the task screen at item 25 of RAI-67.  
At the top right, a progress block and a timer are displayed.  
The "Yes" and "No" options are randomized, but the same order will not be repeated more than three times consecutively.  
Responses are shown in the server terminal but **are not saved during the task**.

![img 4](/img/4.png)

End screen after completing the task (an error is intentionally triggered for demonstration purposes).  
If an error occurs, "Data could not be saved" is displayed.  
Buttons for resending or saving the data as CSV are provided.  
In case those buttons fail, the browser console also records the responses.

![img 5](/img/5.png)

---
## 💻 Running the Node.js Application

This program runs in a **Node.js** environment.  
Follow the steps below to set up and run it locally.

### Requirements
- [Node.js](https://nodejs.org/) (Recommended version: 18.x or higher)
- npm (bundled with Node.js)

### Setup

```bash
# 1. Clone this repository
git clone https://github.com/678-asakura/relational-abilities-index-ja.git
```

### ▶ Running the Application (example: `RAI67-ja_v2.0`)

You can run each program individually by following these steps:

```bash
# 1. Move to the target directory
cd "Cross-platform version/RAI67-ja_v2.0"

# 2. Install required packages (only needed once)
npm install

# 3. Start the application
npm run start
```

---
## ⚙️ Detailed Specifications

*(Primarily development notes)*

1. The task may not function properly unless the web browser is up-to-date.
2. **Bootstrap via CDN** is used for styling.
   - Without an internet connection, the appearance may break.
   - It is possible to embed the CSS directly into the server if needed.
3. If the `.csv` data file is open, saving may fail.
   - Most recording errors occur when the `.csv` file is open.
   - If restarting the server does not resolve the issue, please contact the developer.
4. In `RAI128`, the stimuli shown in `RAI-ja_result.csv` may not match the stimuli actually presented.
   - This is due to a design oversight during development.  
     Modifying the input files will make them consistent.
   - Functionally, there are no issues, so this has not been corrected (may be updated in the future).
5. Once loading is complete, the task can basically proceed even if the network connection is lost.
   - The task is lightweight, and device or browser performance differences should have minimal impact.
6. A 5-second timeout can be set when time runs out.
   - Intended to prevent errors caused by rapid clicking near timeout, but ultimately not used.
   - There may be other similar mechanisms if you read through the code.

---
✌('ω')✌