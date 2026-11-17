/** TaxSort の言葉（日本語）。規則は en.ts を参照。 */

import type { Translation } from "./en.ts";

const ja: Translation = {
  // ─── ui ───
  "ui.app.welcome": "取引を IRS の行ごとに仕分けし、あなたの鍵の下に保管します。",
  "ui.app.loading": "読み込み中…",
  "ui.app.signedOutNote": "メール不要。パスワード不要。KYC 不要。",
  "ui.app.privacyLink": "プライバシーポリシー",
  "ui.app.statusFailed": "MCP に接続できませんでした",
  "ui.app.retry": "再試行",
  "ui.app.connecting": "TaxSort MCP に接続しています…",
  "ui.app.connected": "<service/> v{{version}} に接続しました",
  "ui.app.fingerprintTitle": "オペレーターの npub の指紋です。TaxSort からの DM と一致するか確かめてください",
  "ui.app.vaultNotConfigured": "（保管庫はまだ設定されていません）",

  "ui.nav.sessions": "セッション",
  "ui.nav.sessionsTitle": "課税年度ごとのセッションを作成し、切り替えます",
  "ui.nav.import": "インポート",
  "ui.nav.importTitle": "銀行の CSV ファイルをアップロードします",
  "ui.nav.accounts": "口座",
  "ui.nav.accountsTitle": "口座の種類を設定し、別名と取引を確認します",
  "ui.nav.transactions": "取引",
  "ui.nav.transactionsTitle": "インポートした取引を閲覧・検索します",
  "ui.nav.categorize": "→ 分類する →",
  "ui.nav.categorizeTitle": "インポートした取引を AI で分類します",
  "ui.nav.categorized": "分類済み",
  "ui.nav.categorizedTitle": "分類ごとの合計を見ます",
  "ui.nav.subscriptions": "サブスクリプション",
  "ui.nav.subscriptionsTitle": "定期的な請求と、お金の漏れを見つけます",
  "ui.nav.advisor": "アドバイザー",
  "ui.nav.advisorTitle": "TaxSort について財務アドバイザーに質問します",
  "ui.nav.taxCode": "税法",
  "ui.nav.taxCodeTitle": "IRS の条文を章と節まで調べます",
  "ui.nav.feedback": "フィードバック",
  "ui.nav.feedbackTitle": "不具合の報告、機能の要望、質問",
  "ui.nav.usage": "利用状況と費用",
  "ui.nav.usageTitle": "AI の利用状況と推定費用",
  "ui.nav.wallet": "ウォレット",
  "ui.nav.walletTitle": "クレジット残高と Lightning でのチャージ",
  "ui.nav.settings": "設定",
  "ui.nav.settingsTitle": "自動ロックの時間、共有、このアプリについて",
  "ui.nav.privacy": "プライバシー",
  "ui.nav.privacyTitle": "データの守り方",
  "ui.nav.logOut": "ログアウト",
  "ui.nav.profile": "プロフィール",
  "ui.nav.session": "セッション：",
  "ui.nav.collaborators_other": "共同作業者 {{count}} 人",

  "ui.lock.title": "セッションがタイムアウトしました",
  "ui.lock.pasteNsec": "続けるには、サインインに使った nsec を貼り付けてください。",
  "ui.lock.enterPassphrase": "続けるには、パスフレーズを入力してください。Nostr の DM でサインインしたときに返信したパスフレーズです。",
  "ui.lock.passphrasePlaceholder": "パスフレーズ…",
  "ui.lock.wrongKey": "このブラウザーがサインインに使った鍵ではありません。",
  "ui.lock.wrongPassphrase": "パスフレーズが違います。",
  "ui.lock.verifying": "確認中…",
  "ui.lock.unlock": "ロック解除",
  "ui.lock.signOut": "サインアウト（もう一度サインインします）",

  // ─── views ───
  "views.common.refresh": "更新",
  "views.common.cancel": "キャンセル",
  "views.common.loading": "読み込み中…",
  "views.common.saving": "保存中…",
  "views.common.save": "保存",
  "views.common.done": "完了",
  "views.common.search": "検索",
  "views.common.clear": "クリア",
  "views.common.applying": "適用中…",
  "views.common.clearing": "消去中…",
  "views.common.manual": "手動",
  "views.common.rule": "ルール",
  "views.common.transactions_other": "{{count}} 件の取引",

  "views.table.date": "日付",
  "views.table.description": "内容",
  "views.table.amount": "金額",
  "views.table.account": "口座",
  "views.table.category": "分類",
  "views.table.all": "すべて",
  "views.table.group": "グループ",
  "views.table.groupOrder": "グループの順序",
  "views.table.sortBy": "並べ替え",
  "views.table.sortDirection": "並べ替えの向き",
  "views.table.groupNone": "グループなし",
  "views.table.groupCategory": "分類",
  "views.table.groupSubcategory": "小分類",
  "views.table.groupTaxLine": "税務上の行（IRS）",
  "views.table.groupMonth": "月",
  "views.table.groupAccount": "口座",
  "views.table.groupMerchant": "取引先",
  "views.table.groupMonthCategory": "月 + 分類",
  "views.table.groupCategorySub": "分類 + 小分類",
  "views.table.searchPlaceholder": "内容を検索（正規表現）…",
  "views.table.expandAll": "すべて開く",
  "views.table.collapseAll": "すべて閉じる",
  "views.table.indistinguishable": "区別できない重複",
  "views.table.firstPage": "最初のページ",
  "views.table.lastPage": "最後のページ",
  "views.table.prev": "← 前へ",
  "views.table.next": "次へ →",
  "views.table.page": "{{page}} / {{pages}} ページ（全 {{total}} 件）",

  "views.sessions.title": "税務セッション",
  "views.sessions.closeSession": "セッションを閉じる",
  "views.sessions.new": "新しいセッション",
  "views.sessions.newPlaceholder": "例：2025 年の税金",
  "views.sessions.creating": "作成中…",
  "views.sessions.create": "作成 →",
  "views.sessions.yours": "あなたのセッション",
  "views.sessions.row_other": "{{count}} 件の取引 · {{date}} 更新",
  "views.sessions.none": "まだセッションがありません。上で作成して始めましょう。",
  "views.sessions.share": "複数の端末で同じ npub を使うと、セッションを共有できます。",

  "views.import.title": "取引をインポート",
  "views.import.clearAll": "すべての取引を消去…",
  "views.import.confirmClear": "すべての取引と分類を削除しますか？",
  "views.import.yesClear": "はい、消去します",
  "views.import.cleared": "{{transactions}} 件の取引と {{classifications}} 件の分類を消去しました。",
  "views.import.sources": "インポート済みのソース",
  "views.import.confirmRemove": "「{{account}}」の取引 {{count}} 件をすべて削除しますか？\nそれらの分類も削除されます。",
  "views.import.removeTitle": "{{account}} の取引をすべて削除",
  "views.import.drop": "CSV ファイルをドロップするか、クリックして選択してください",
  "views.import.assign": "各ファイルを口座に割り当ててください。口座名が同じファイルは同じソースとして扱います。",
  "views.import.size": "{{size}} KB",
  "views.import.account": "口座：",
  "views.import.accountPlaceholder": "例：Chase 8890",
  "views.import.grouped": "まとめ済み",
  "views.import.groupedTitle": "複数のファイルがこの口座名を共有しています",
  "views.import.reading": "{{file}} を読み込み中…",
  "views.import.importing": "{{file}} をインポート中…",
  "views.import.importingButton": "インポート中…",
  "views.import.importFiles": "ファイルをインポート",
  "views.import.results": "インポートの結果",
  "views.import.added": "新規 {{count}} 件",
  "views.import.deduped": "· 重複 {{count}} 件を除去",
  "views.import.ambiguous": "· あいまい {{count}} 件",
  "views.import.totalInSession_other": "セッション内の取引は {{count}} 件",
  "views.import.reviewAccounts": "口座を確認 →",
  "views.import.classify": "Claude で分類 →",
  "views.import.viewTransactions": "取引を見る",

  "views.accounts.title": "口座",
  "views.accounts.intro": "各口座の種類を設定すると、重なった CSV からの重複や、ご自身の口座間の振替を分類器が見分けられます。良い結果を得るには、分類する<b>前に</b>口座の種類を設定してください。",
  "views.accounts.loading": "口座を読み込み中…",
  "views.accounts.empty": "まだ取引がインポートされていません。先に CSV をインポートしてください。",
  "views.accounts.aliases": "検出された口座の別名（下 4 桁が同じ）",
  "views.accounts.aliasesNote": "分類器は、別名の口座の取引を重複の可能性があるものとして扱います。",
  "views.accounts.sources": "ソース：",
  "views.accounts.loadingTransactions": "取引を読み込み中…",
  "views.accounts.noTransactions": "取引が見つかりません。",
  "views.accounts.type.bank": "銀行",
  "views.accounts.type.bankHint": "当座または普通預金",
  "views.accounts.type.card": "カード",
  "views.accounts.type.cardHint": "クレジットカードまたはデビットカード",
  "views.accounts.type.investment": "投資",
  "views.accounts.type.investmentHint": "証券口座または暗号資産",
  "views.accounts.type.loan": "ローン",
  "views.accounts.type.loanHint": "住宅、自動車、学資",
  "views.accounts.type.unknown": "不明",
  "views.accounts.type.unknownHint": "まだ分類されていません",

  "views.transactions.title": "取引",
  "views.transactions.about": "取引は、分類する前の、インポートしたままの CSV の行を表示します。未処理の会計仕訳帳です。",
  "views.transactions.loadFailed": "取引を読み込めませんでした",
  "views.transactions.show": "表示",
  "views.transactions.scopeAll": "すべての取引",
  "views.transactions.scopeTax": "税務項目（Sch A + C）",
  "views.transactions.scopeC": "Schedule C のみ",
  "views.transactions.scopeA": "Schedule A のみ",
  "views.transactions.amountPlaceholder": "例：<-95, [0..10), !33",
  "views.transactions.amountTitle": "金額の絞り込み：<, <=, >, >=, =, !=, !N, not N, gt/gte/lt/lte/eq/neq N, [lo..hi), (lo..hi], lo..hi",
  "views.transactions.clearFilters": "絞り込みを解除",
  "views.transactions.subFilter": "小分類で絞り込み中：<b>{{sub}}</b>",
  "views.transactions.noMatch": "この条件に合う取引はありません。",
  "views.transactions.ambiguousInCsv": "CSV 内で区別できない重複",
  "views.transactions.classification": "分類",
  "views.transactions.removeTitle": "分類を外す",
  "views.transactions.confirmRevert": "分類を外しますか？この取引は未分類に戻ります。",
  "views.transactions.findSimilar": "似た取引を探す",
  "views.transactions.ruleHeading": "ルールを作成しますか？",
  "views.transactions.ruleApply": "この正規表現に合う取引に <b>{{category}} / {{sub}}</b> を適用します：",
  "views.transactions.saveRule": "ルールを保存",
  "views.transactions.skip": "スキップ",
  "views.transactions.ruleSaved": "ルールを保存しました：<code>/{{pattern}}/</code> → {{category}} / {{sub}}",
  "views.transactions.applyAll": "合うものすべてに適用",
  "views.transactions.ruleApplied_other": "ルールを適用しました：{{count}} 件の取引を更新",

  "views.classify.title": "分類",
  "views.classify.total": "合計",
  "views.classify.categorized": "分類済み",
  "views.classify.uncategorized": "未分類",
  "views.classify.running": "分類中…",
  "views.classify.paused": "一時停止中",
  "views.classify.complete": "完了",
  "views.classify.importFirst": "先に取引をインポートしてください",
  "views.classify.ready": "分類の準備ができました",
  "views.classify.error": "問題が発生しました",
  "views.classify.usage": "AI の利用：",
  "views.classify.calls": "{{count}} 回の呼び出し",
  "views.classify.tokensIn": "入力 {{count}}",
  "views.classify.tokensOut": "出力 {{count}}",
  "views.classify.tokensTotal": "合計 {{count}} トークン",
  "views.classify.runHeading": "Claude AI で分類する",
  "views.classify.runIntro": "未分類の取引を、ブラウザーから直接 Claude で分類します。先にルールを適用し、残りを AI が分類します。",
  "views.classify.categorizeN": "未分類の {{count}} 件を分類",
  "views.classify.allDone": "すべて分類済みです",
  "views.classify.confirmRecategorize": "{{count}} 件すべての取引を分類し直しますか？\n\n分類済みのものや手で編集したものも含め、すべての取引にもう一度 Claude AI をかけます。ルールを改善したときに使ってください。",
  "views.classify.recategorizeAll": "すべて分類し直す（{{count}}）",
  "views.classify.confirmReset": "すべての分類を削除しますか？取引は残ります。",
  "views.classify.resetDone": "{{count}} 件の分類を消去しました。",
  "views.classify.resetAll": "すべての分類をリセット",
  "views.classify.importFirstDot": "先に取引をインポートしてください。",
  "views.classify.pause": "分類を一時停止",
  "views.classify.resume": "分類を再開",
  "views.classify.pausedAt": "{{pct}}% で一時停止中",
  "views.classify.refreshStats": "数値を更新",
  "views.classify.rulesHeading": "分類ルール",
  "views.classify.applyNow": "今すぐルールを適用",
  "views.classify.newRule": "+ 新しいルール",
  "views.classify.rulesIntro": "ルールは、内容のパターンに合わせて、インポートした取引に分類を付けます。インポートしたデータは変更しません。分類は別に保存されます。「今すぐルールを適用」で、すべてのルールをすべての取引にもう一度かけます。ルールをクリックすると編集できます。",
  "views.classify.applied_other": "ルールを適用しました：{{count}} 件の取引を更新しました。",
  "views.classify.searchRules": "ルールを検索（パターン、分類、小分類）…",
  "views.classify.patternLabel": "内容のパターン（正規表現、大文字小文字を区別しない）",
  "views.classify.matches_other": "{{count}} 件一致",
  "views.classify.checking": "確認中…",
  "views.classify.patternPlaceholder": "例：mr cooper|nationstar|rocket mortgage",
  "views.classify.category": "分類",
  "views.classify.subcategory": "小分類（{{count}}）",
  "views.classify.subcategoryCustom": "小分類（{{count}} + 独自 {{custom}}）",
  "views.classify.select": "選択…",
  "views.classify.amountFilter": "金額の条件",
  "views.classify.any": "指定なし",
  "views.classify.amountValue": "金額",
  "views.classify.renameTo": "名前の変更（任意）",
  "views.classify.renamePlaceholder": "新しい内容",
  "views.classify.updateRule": "ルールを更新",
  "views.classify.saveRule": "ルールを保存",
  "views.classify.noRules": "まだルールがありません。",
  "views.classify.ruleAmount": "金額 {{op}} {{value}}",
  "views.classify.ruleRename": "名前を変更：「{{name}}」",
  "views.classify.customHeading": "独自の分類",
  "views.classify.newCategory": "+ 新しい分類",
  "views.classify.customIntro": "組み込みの一覧にない小分類を追加します。AI の分類器もそれを覚えます。",
  "views.classify.customCategoryPlaceholder": "例：Personal",
  "views.classify.subcategoryLabel": "小分類",
  "views.classify.customSubPlaceholder": "例：ガソリン代",
  "views.classify.addCategory": "分類を追加",
  "views.classify.noCustom": "独自の分類はありません。たいていは組み込みの分類で足ります。",
  "views.classify.errors": "分類のエラー",
  "views.classify.recent": "最近分類したもの",

  "views.donut.classified": "分類済み",
  "views.donut.needsReview": "要確認",
  "views.donut.other": "その他",

  "views.reason.duplicateOf": "重複元",
  "views.reason.twin": "対",
  "views.reason.goTo": "取引 {{id}} へ移動",

  "views.summary.title": "分類済み",
  "views.summary.about": "分類済みは、AI が分類した取引を表示します。ルールと AI が税務上の分類を付けた後の会計仕訳帳です。",
  "views.summary.count": "分類済み {{count}} 件",
  "views.summary.noMatch": "この条件に合う分類済みの取引はありません。",

  "views.subscriptions.title": "サブスクリプション",
  "views.subscriptions.lede": "定期的な請求と、忘れていたお金の漏れを見つけます",
  "views.subscriptions.scanning": "スキャン中…",
  "views.subscriptions.rescan": "もう一度スキャン",
  "views.subscriptions.scan": "サブスクリプションを探す",
  "views.subscriptions.phase.fetching": "取引を読み込み中…",
  "views.subscriptions.phase.analyzing": "定期的なパターンを探しています…",
  "views.subscriptions.phase.enriching": "解約のリンクを調べています…",
  "views.subscriptions.working": "処理中…",
  "views.subscriptions.recurring": "定期的なサブスクリプション",
  "views.subscriptions.spent": "支出の合計（データ内）",
  "views.subscriptions.projected": "年間の見込み費用",
  "views.subscriptions.none": "定期的なサブスクリプションは見つかりませんでした。よかったですね！",
  "views.subscriptions.freq.daily": "毎日",
  "views.subscriptions.freq.weekly": "毎週",
  "views.subscriptions.freq.monthly": "毎月",
  "views.subscriptions.freq.quarterly": "四半期ごと",
  "views.subscriptions.freq.annual": "毎年",
  "views.subscriptions.per.daily": "/日",
  "views.subscriptions.per.weekly": "/週",
  "views.subscriptions.per.monthly": "/月",
  "views.subscriptions.per.quarterly": "/四半期",
  "views.subscriptions.per.annual": "/年",
  "views.subscriptions.perYear": "{{amount}}/年",
  "views.subscriptions.charges_other": "{{count}} 回の請求",
  "views.subscriptions.firstSeen": "初回：",
  "views.subscriptions.lastSeen": "最終：",
  "views.subscriptions.totalSpent": "支出の合計：",
  "views.subscriptions.cancel": "解約 / 購読停止 →",
  "views.subscriptions.cancelVia": "{{method}} で解約",
  "views.subscriptions.noCancelInfo": "解約の情報はありません",
  "views.subscriptions.emptyIntro": "インポートした取引をスキャンして、定期的なサブスクリプションを見つけます。",
  "views.subscriptions.emptyNote": "毎日、毎週、毎月、四半期ごと、毎年のパターンを見つけ、できるときは解約のリンクも調べます。",

  "views.advisor.title": "財務アドバイザー",
  "views.advisor.lede": "TaxSort の使い方について、何でも聞いてください",
  "views.advisor.whatToAsk": "何を聞けますか？",
  "views.advisor.thinking": "考えています…",
  "views.advisor.placeholder": "財務アドバイザーに質問する…",
  "views.advisor.ask": "質問",
  "views.advisor.error": "エラー：{{error}}",
  "views.advisor.you": "私",
  "views.advisor.prompt.1": "TaxSort で何ができますか？",
  "views.advisor.prompt.2": "銀行の取引はどうやってインポートしますか？",
  "views.advisor.prompt.3": "Schedule A と Schedule C の違いは何ですか？",
  "views.advisor.prompt.4": "分類はどのように行われますか？",
  "views.advisor.prompt.5": "CSV をインポートした後は何をすればよいですか？",
  "views.advisor.prompt.6": "配偶者とセッションを共有するにはどうすればよいですか？",
  "views.advisor.prompt.7": "インポートした取引の「あいまい」とはどういう意味ですか？",
  "views.advisor.prompt.8": "納得できない分類を修正するにはどうすればよいですか？",
  "views.advisor.fact.1": "IRS は毎年 1 億 5,000 万件を超える個人の確定申告を処理しています。",
  "views.advisor.fact.2": "米国の税法は 1 万ページを超えます。規則はさらに 8 万ページ以上あります。",
  "views.advisor.fact.3": "ホームオフィス控除で、自営業者は年に 1,500 ドル以上節約できることがあります。",
  "views.advisor.fact.4": "米国の人々は納税のために年間 65 億時間を費やしています。",
  "views.advisor.fact.5": "小規模事業の経営者は、平均で年に 240 時間を税金に費やしています。",
  "views.advisor.fact.6": "Section 179 により、対象となる設備の全額を購入した年に控除できます。",
  "views.advisor.fact.7": "2025 年の標準控除は、単身申告で 15,000 ドル、夫婦合算申告で 30,000 ドルです。",
  "views.advisor.fact.8": "IRC §274(n) により、ビジネスの食事は 50% が控除対象です。2021〜2022 年には一時的に 100% でした。",
  "views.advisor.fact.9": "SALT 控除の上限 10,000 ドルは、2017 年の Tax Cuts and Jobs Act で導入されました。",
  "views.advisor.fact.10": "自営業税は 15.3% です。内訳は Social Security が 12.4%、Medicare が 2.9% です。",
  "views.advisor.fact.11": "IRS は、年間 6,880 億ドルの税の不足（納めるべきなのに納められていない税）があると見積もっています。",
  "views.advisor.fact.12": "慈善寄付は、調整後総所得の最大 60% まで相殺できます。",
  "views.advisor.fact.13": "米国で最初の所得税は、南北戦争の資金のために 1861 年に課されました。",
  "views.advisor.fact.14": "アルベルト・アインシュタインは「世界で一番理解しにくいのは所得税だ」と言ったと伝えられています。",
  "views.advisor.fact.15": "控除を項目別に申告する納税者は約 10% だけです。残りは標準控除を選びます。",
  "views.advisor.fact.16": "四半期ごとの予定納税の期限は、4 月 15 日、6 月 15 日、9 月 15 日、1 月 15 日です。",

  "views.researcher.title": "税法リサーチャー",
  "views.researcher.lede": "IRS の条文を章と節まで調べます",
  "views.researcher.whatToResearch": "何を調べられますか？",
  "views.researcher.researching": "調べています…",
  "views.researcher.placeholder": "IRS の税法について質問する…",
  "views.researcher.research": "調べる",
  "views.researcher.attributed": "{{name}} の言葉とされる",
  "views.researcher.prompt.1": "ホームオフィスのインターネット代は控除できますか？",
  "views.researcher.prompt.2": "ビジネスの食事を控除するルールは何ですか？",
  "views.researcher.prompt.3": "SALT 控除の上限はいくらで、どの条文で定められていますか？",
  "views.researcher.prompt.4": "健康保険料を Schedule C で控除できますか？",
  "views.researcher.prompt.5": "IRC §170 で慈善寄付とみなされるものは何ですか？",
  "views.researcher.prompt.6": "医療費の AGI 7.5% の下限とは何ですか？",
  "views.researcher.prompt.7": "顧客との打ち合わせに車で行った距離は控除できますか？",
  "views.researcher.prompt.8": "事業用の設備を減価償却するルールは何ですか？",
  "views.researcher.quote.misesBoom": "信用拡張によってもたらされた好景気の最終的な崩壊を避ける手立てはない。",
  "views.researcher.quote.hemingway": "失政に陥った国の最初の万能薬は通貨の膨張であり、二番目は戦争である。",
  "views.researcher.quote.friedman": "インフレとは、立法なき課税である。",
  "views.researcher.quote.morgan": "金こそが貨幣だ。それ以外はすべて信用にすぎない。",
  "views.researcher.quote.colbert": "課税の技術とは、ガチョウが鳴き声をできるだけ上げないようにして、できるだけ多くの羽根をむしり取ることにある。",
  "views.researcher.quote.bastiat": "国家とは、誰もが他の誰かの犠牲の上に生きようと努める、大いなる虚構である。",
  "views.researcher.quote.goldwater": "所得税は、政府のどの行いよりも多くの犯罪者を生み出した。",
  "views.researcher.quote.parker": "神がお金をどう思っているか知りたければ、神がお金を与えた人々を見るといい。",
  "views.researcher.quote.lenin": "ブルジョワジーを打ち砕く方法は、課税とインフレという石臼の間ですりつぶすことだ。",
  "views.researcher.quote.greenspan": "金本位制がなければ、インフレによる没収から貯蓄を守る方法はない。",
  "views.researcher.quote.cicero": "予算は均衡させ、国庫は満たし、公的債務は減らすべきである。",
  "views.researcher.quote.paul": "中央銀行は社会主義の一形態だ。それは貨幣と信用の社会化である。",
  "views.researcher.quote.voltaire": "紙幣はいずれ本来の価値、すなわちゼロに戻る。",
  "views.researcher.quote.galbraith": "貨幣の研究は、経済学のどの分野にもまして、複雑さが真実を偽るため、あるいは真実から逃れるために使われる分野である。",
  "views.researcher.quote.ammous": "法定通貨こそが、あらゆる経済危機の主な原因である。",
  "views.researcher.quote.gates": "ビットコインは技術の離れ業だ。",
  "views.researcher.quote.satoshi": "従来の通貨の根本的な問題は、それを機能させるために必要な信頼の大きさにある。",
  "views.researcher.quote.shaw": "ピーターから奪ってポールに払う政府は、いつでもポールの支持を当てにできる。",

  "views.feedback.title": "フィードバック",
  "views.feedback.submitHeading": "フィードバックを送る",
  "views.feedback.intro": "不具合の報告、機能の要望、質問は GitHub の Issue として管理されます。GitHub のアカウントは不要です。",
  "views.feedback.cat.feedback": "一般的なご意見",
  "views.feedback.cat.bug": "不具合の報告",
  "views.feedback.cat.feature": "機能の要望",
  "views.feedback.cat.question": "質問",
  "views.feedback.titlePlaceholder": "短い要約…",
  "views.feedback.bodyPlaceholder": "問題、アイデア、または質問を書いてください…",
  "views.feedback.submitting": "送信中…",
  "views.feedback.submit": "送信",
  "views.feedback.failed": "Issue を作成できませんでした。",
  "views.feedback.recent": "最近の Issue",
  "views.feedback.state.open": "未解決",
  "views.feedback.state.closed": "解決済み",
  "views.feedback.state.submitted": "送信済み",
  "views.feedback.comments_other": "コメント {{count}} 件",
  "views.feedback.none": "まだフィードバックはありません。",

  "views.settings.title": "設定",
  "views.settings.timeout": "自動ロック",
  "views.settings.timeoutIntro": "しばらく操作がないとアプリをロックします。解除にはパスフレーズ（サインインに使ったもの）が必要です。",
  "views.settings.minutes_other": "{{count}} 分",
  "views.settings.hour": "1 時間",
  "views.settings.never": "しない",
  "views.settings.current": "現在：{{value}}",
  "views.settings.noTimeout": "ロックしない",
  "views.settings.currentSession": "現在のセッション",
  "views.settings.about": "このアプリについて",
  "views.settings.aboutWhat": "TaxSort MCP：Schedule A と C のための取引分類器",
  "views.settings.aboutPowered": "Tollbooth DPYC · Neon Postgres · Claude AI で動いています",
  "views.settings.identity": "ID：",
  "views.settings.sharing": "共有：複数の端末や複数の人で同じ npub を使ってください。",

  "views.profile.heading": "プロフィール",
  "views.profile.credit": "クレジット残高",
  "views.profile.timezone": "タイムゾーン",
  "views.profile.timezoneNote": "この端末に保存されます。",
  "views.profile.theme": "テーマ",
  "views.profile.light": "ライト",
  "views.profile.dark": "ダーク",
  "views.profile.system": "システム",
  "views.profile.language": "言語",
  "views.profile.aiHeading": "AI による分類の利用状況",
  "views.profile.aiNone": "分類の記録はまだありません。",
  "views.profile.unknownModel": "不明",
  "views.profile.runs": "実行回数：",
  "views.profile.calls": "呼び出し：",
  "views.profile.input": "入力：",
  "views.profile.output": "出力：",
  "views.profile.cost": "費用：",
  "views.profile.estimated": "Anthropic の推定費用",
  "views.profile.tokensAcross": "API 呼び出し {{calls}} 回で {{tokens}} トークン",
  "views.profile.inSats": "sats に換算",
  "views.profile.sats": "{{count}} sats",
  "views.profile.atPrice": "1 BTC ≈ {{price}} として",
  "views.profile.whyMatters": "<b>なぜ大切か：</b>TaxSort は取引の分類に Claude AI を使っています。オペレーターはこの AI の利用料を Anthropic に支払い、その費用を Tollbooth での Lightning のマイクロペイメントでパトロンに転嫁しています。",
  "views.profile.transparency": "あなたの通行料クレジットは、AI の実費とオペレーターの経費をまかないます。何に支払っているかがはっきり見えます。隠れた上乗せも、サブスクリプションの罠もありません。",

  "views.privacy.body": `# TaxSort プライバシーポリシー

## Don't Pester Your Customer™ (DPYC™)

TaxSort は **DPYC™ の考え方**の上に作られています。ソフトウェアがふつう利用者をどう扱うかとは、きっぱり違うやり方です。原則はシンプルです。*あなたの身元、あなたのデータ、あなたのお金、あなたのルール。*

よくある SaaS は、試す前から名前、メール、電話番号、勤務先、住所、支払いカードを求めます。あなたのデータを業者に売り、「パートナー」と共有し、わざと解約しにくくしたサブスクリプションに縛りつけます。メールや通知、少ない価値から最大の収益を絞り出すための誘導で、あなたを煩わせます。

**DPYC™ はそのすべてを拒みます。**

---

## アカウントなし。メールなし。KYC なし。

TaxSort は**あなたの現実の身元を一切知りません。**次のものを求めることはありません：

- ❌ 名前
- ❌ メールアドレス
- ❌ 電話番号
- ❌ 住所
- ❌ 社会保障番号
- ❌ 政府発行の身分証
- ❌ クレジットカード
- ❌ 銀行口座

**アカウント作成も、登録フォームも、パスワードもありません。**ハッキングされるものも、漏れるものも、召喚状で差し出すものもありません。

---

## Nostr の鍵：あなた自身の身元

TaxSort でのあなたの身元は **Nostr の鍵ペア**です。公開鍵と秘密鍵を、誰の許可もなく、あなた自身の端末で作ります。

### あなたの npub（公開鍵）
- \`npub1...\` で始まる bech32 形式の文字列
- 共有しても安全です。TaxSort はこれであなたのセッションとデータを見つけます
- 郵便受けの住所のようなものです。誰でも送れますが、開けられるのはあなただけです

### あなたの nsec（秘密鍵）
- \`nsec1...\` で始まる bech32 形式の文字列
- **端末の外に出ることはありません。**TaxSort が求めることも、見ることも、保存することもありません
- Nostr のメッセージに署名し、対応する npub の持ち主であることを示します
- 郵便受けの鍵のようなものです。持っていることが持ち主の証明になります

### なぜ Nostr の鍵なのか
- **自己主権：**あなたが作ります。与えたり取り上げたりする権威はありません。
- **持ち運べる：**どの Nostr アプリでも使えます。TaxSort に縛られません。
- **暗号学的：**secp256k1 楕円曲線（Bitcoin と同じ）に基づきます。偽造できません。
- **仮名性：**政府の登録ではなく、数学に結びついています。

---

## Secure Courier：秘密を明かさずに持ち主であることを証明する

初めて TaxSort を使うとき、暗号化された Nostr DM のやり取りである **Secure Courier** で、npub があなたのものかを確かめます：

1. TaxSort があなたの npub に Nostr のダイレクトメッセージを送ります
2. あなたは好きなパスフレーズで返信します
3. 返信は**あなたの nsec で署名**されます（Nostr クライアントが自動で行います）
4. 署名が、nsec を明かすことなく npub があなたのものだと証明します

これは**ゼロ知識による本人証明**です。その npub の秘密鍵を誰かが持っていることはわかりますが、それが誰かは何もわかりません。

### パスフレーズがデータを守る
確認のときに選んだパスフレーズから、データベースに保存する税務データの暗号鍵を作ります。つまり：

- 取引の内容、金額、分類は保存時に暗号化されます
- 暗号鍵は*あなたの*パスフレーズから作られます。私たちが選ぶものではありません
- パスフレーズを忘れると、データは取り戻せません（意図した設計です）

---

## 自動ロックとロック解除

TaxSort は、設定した時間（既定は 15 分）操作がないと自動でロックします。解除するには：

1. TaxSort があなたの npub に Nostr の DM を送ります
2. あなたは "Approve Unlock" と返信します
3. 署名付きの返信が、キーボードの前にいるのが今もあなただと証明します

これで、ロックされていない端末に近づいた人が税務データに触れることはできません。解除に必要なのは**あなたの nsec**（Nostr クライアント経由）で、推測されたり肩越しに見られたりするパスワードではありません。

---

## Bitcoin Lightning：決済代行業者なしで支払う

TaxSort の料金は、Tollbooth DPYC™ プロトコルによる **Bitcoin Lightning のマイクロペイメント**で支払います。つまり：

- **クレジットカード不要。**Stripe も PayPal もありません。あなたが TaxSort を使っていることを決済業者は知りません。
- **サブスクリプションなし。**クレジット残高を前払いし、ツールの呼び出しごとに支払います。いつでもやめられます。
- **返金の手続きなし。**使っていないクレジットは 7 日間失効しません。自動更新もありません。
- **支払いの監視なし。**Lightning の支払いは人から人へ直接届きます。銀行の明細に「TaxSort」と載ることはありません。
- **即時決済。**クレジットは数日ではなく数秒で届きます。

### DPYC™ 社会契約
TaxSort は [DPYC™ 社会契約](https://github.com/lonniev/dpyc-community)の一員です。これらの原則を共有する、独立して運営される MCP サービスのネットワークです。各オペレーターは自分のサーバーを動かし、自分で価格を決め、自分のパトロンに責任を負います。中央の権威も、プラットフォーム手数料も、アプリストアの取り分もありません。

---

## 保存するもの

| データ | 場所 | 暗号化 | 読める人 |
|------|-------|-----------|-----------------|
| あなたの npub | Neon Postgres | なし（公開情報） | オペレーター |
| 確認の状態 | Neon Postgres | なし | オペレーター |
| パスフレーズのハッシュ | Neon Postgres | 一方向ハッシュ | 誰も読めない |
| 税務セッション | Neon Postgres | 保存時 | オペレーター + あなた |
| 取引 | Neon Postgres | 保存時 | オペレーター + あなた |
| 分類 | Neon Postgres | 保存時 | オペレーター + あなた |
| クレジット残高 | Neon Postgres | 暗号化 | オペレーター |
| Lightning の請求書 | BTCPay Server | BTCPay の暗号化 | オペレーター |

**保存しないもの：**あなたの nsec、本名、メール、IP アドレス（経路は Cloudflare が扱います）、ブラウザーの指紋、分析やテレメトリのデータ。

---

## Claude AI に送るもの

分類機能や AI アドバイザーを使うと、取引の内容と金額が分類のために Anthropic の Claude API に送られます。つまり：

- Anthropic は取引のテキストを短時間だけ処理し、私たちのために保存することはありません
- Anthropic の[データ保持ポリシー](https://www.anthropic.com/privacy)が適用されます
- 送るのは必要な情報（日付、内容、金額、口座）だけです
- あなたの npub、パスフレーズ、あなたを特定できる情報は Anthropic に**送りません**

---

## 決してしないこと

- 🚫 あなたのデータを売る
- 🚫 あなたのデータを広告主と共有する
- 🚫 政府発行の身分証を求める
- 🚫 当局に報告する（あなたが誰か知りません）
- 🚫 宣伝メールを送る（あなたのメールを持っていません）
- 🚫 サブスクリプションを自動更新する（サブスクリプションはありません）
- 🚫 あなたをデータから締め出す（データはあなたが管理する npub に結びついています）
- 🚫 やめにくくする（いつでもデータを書き出せ、いつでもセッションを削除できます）

---

## オープンソースで検証可能

TaxSort のソースコードは公開されています：

- **MCP サーバー：**[github.com/lonniev/taxsort-mcp](https://github.com/lonniev/taxsort-mcp)
- **Tollbooth SDK：**[github.com/lonniev/tollbooth-dpyc](https://github.com/lonniev/tollbooth-dpyc)
- **ライセンス：**Apache 2.0

どんなデータが集められ、どう保存され、どこに送られるかを正確に確かめられます。隠れた分析も、追跡ピクセルも、第三者のスクリプトもありません。

---

*Don't Pester Your Customer™：あなたの税務データは、あなた以外の誰のものでもないからです。*

*ノートン・ジャスター著『[The Phantom Tollbooth](https://en.wikipedia.org/wiki/The_Phantom_Tollbooth)』（1961 年）に着想を得ています。*
`,

  "lib.mcp.unknownError": "不明なエラー",
  "lib.classify.noKey": "使える Anthropic の API キーがありません。",
  "lib.classify.parseFailed": "{{round}} 回目：AI の回答を読み取れませんでした",
  "lib.classify.outOfCredits": "AI 分類サービスのクレジットが切れました。TaxSort のオペレーターに Anthropic API の残高をチャージするよう依頼してください。",
  "lib.subscriptions.failed": "サブスクリプションのスキャンに失敗しました",
};

export default ja;
