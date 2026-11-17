/** TaxSort के शब्द हिंदी में। नियमों के लिए en.ts देखें। */

import type { Translation } from "./en.ts";

const hi: Translation = {
  // ─── ui ───
  "ui.app.welcome": "आपके लेनदेन, IRS की पंक्तियों के अनुसार छाँटे गए, आपकी कुंजी के तहत सुरक्षित।",
  "ui.app.loading": "लोड हो रहा है…",
  "ui.app.signedOutNote": "कोई ईमेल नहीं। कोई पासवर्ड नहीं। कोई KYC नहीं।",
  "ui.app.privacyLink": "गोपनीयता नीति",
  "ui.app.statusFailed": "MCP कनेक्शन विफल रहा",
  "ui.app.retry": "फिर कोशिश करें",
  "ui.app.connecting": "TaxSort MCP से जुड़ रहे हैं…",
  "ui.app.connected": "<service/> v{{version}} से जुड़े",
  "ui.app.fingerprintTitle": "ऑपरेटर के npub का फ़िंगरप्रिंट: जाँच लें कि यह TaxSort के DM से मेल खाता है",
  "ui.app.vaultNotConfigured": "(वॉल्ट अभी सेट नहीं हुआ)",

  "ui.nav.sessions": "सत्र",
  "ui.nav.sessionsTitle": "हर कर-वर्ष के सत्र बनाएँ और उनके बीच बदलें",
  "ui.nav.import": "इंपोर्ट",
  "ui.nav.importTitle": "बैंक की CSV फ़ाइलें अपलोड करें",
  "ui.nav.accounts": "खाते",
  "ui.nav.accountsTitle": "खातों का प्रकार चुनें, उपनाम और लेनदेन देखें",
  "ui.nav.transactions": "लेनदेन",
  "ui.nav.transactionsTitle": "इंपोर्ट किए गए लेनदेन देखें और खोजें",
  "ui.nav.categorize": "→ श्रेणी दें →",
  "ui.nav.categorizeTitle": "इंपोर्ट किए गए लेनदेन को AI से श्रेणी दें",
  "ui.nav.categorized": "श्रेणीबद्ध",
  "ui.nav.categorizedTitle": "श्रेणी के अनुसार कुल देखें",
  "ui.nav.subscriptions": "सब्सक्रिप्शन",
  "ui.nav.subscriptionsTitle": "बार-बार होने वाले शुल्क और पैसे के रिसाव खोजें",
  "ui.nav.advisor": "सलाहकार",
  "ui.nav.advisorTitle": "TaxSort के बारे में वित्तीय सलाहकार से पूछें",
  "ui.nav.taxCode": "कर संहिता",
  "ui.nav.taxCodeTitle": "IRS संहिता की धाराएँ, अध्याय और खंड तक खोजें",
  "ui.nav.feedback": "प्रतिक्रिया",
  "ui.nav.feedbackTitle": "बग बताएँ, सुविधा माँगें, सवाल पूछें",
  "ui.nav.usage": "उपयोग और लागत",
  "ui.nav.usageTitle": "AI का उपयोग और अनुमानित लागत",
  "ui.nav.wallet": "वॉलेट",
  "ui.nav.walletTitle": "क्रेडिट बैलेंस और Lightning टॉप अप",
  "ui.nav.settings": "सेटिंग्स",
  "ui.nav.settingsTitle": "सत्र का टाइमआउट, साझा करना और परिचय",
  "ui.nav.privacy": "गोपनीयता",
  "ui.nav.privacyTitle": "आपका डेटा कैसे सुरक्षित रहता है",
  "ui.nav.logOut": "लॉग आउट",
  "ui.nav.profile": "प्रोफ़ाइल",
  "ui.nav.session": "सत्र:",
  "ui.nav.collaborators_one": "{{count}} सहयोगी",
  "ui.nav.collaborators_other": "{{count}} सहयोगी",

  "ui.lock.title": "सत्र का समय समाप्त",
  "ui.lock.pasteNsec": "जारी रखने के लिए वह nsec चिपकाएँ जिससे आपने साइन इन किया था।",
  "ui.lock.enterPassphrase": "जारी रखने के लिए अपना पासफ़्रेज़ लिखें। यह वही पासफ़्रेज़ है जो आपने Nostr DM से साइन इन करते समय जवाब में भेजा था।",
  "ui.lock.passphrasePlaceholder": "आपका पासफ़्रेज़…",
  "ui.lock.wrongKey": "यह वह कुंजी नहीं है जिससे इस ब्राउज़र ने साइन इन किया था।",
  "ui.lock.wrongPassphrase": "पासफ़्रेज़ गलत है।",
  "ui.lock.verifying": "जाँच रहे हैं…",
  "ui.lock.unlock": "अनलॉक करें",
  "ui.lock.signOut": "साइन आउट करें (आप फिर से साइन इन करेंगे)",

  // ─── views ───
  "views.common.refresh": "रीफ़्रेश",
  "views.common.cancel": "रद्द करें",
  "views.common.loading": "लोड हो रहा है…",
  "views.common.saving": "सहेज रहे हैं…",
  "views.common.save": "सहेजें",
  "views.common.done": "हो गया",
  "views.common.search": "खोजें",
  "views.common.clear": "साफ़ करें",
  "views.common.applying": "लागू कर रहे हैं…",
  "views.common.clearing": "साफ़ कर रहे हैं…",
  "views.common.manual": "हाथ से",
  "views.common.rule": "नियम",
  "views.common.transactions_one": "{{count}} लेनदेन",
  "views.common.transactions_other": "{{count}} लेनदेन",

  "views.table.date": "तारीख",
  "views.table.description": "विवरण",
  "views.table.amount": "राशि",
  "views.table.account": "खाता",
  "views.table.category": "श्रेणी",
  "views.table.all": "सभी",
  "views.table.group": "समूह",
  "views.table.groupOrder": "समूहों का क्रम",
  "views.table.sortBy": "क्रम",
  "views.table.sortDirection": "क्रम की दिशा",
  "views.table.groupNone": "कोई समूह नहीं",
  "views.table.groupCategory": "श्रेणी",
  "views.table.groupSubcategory": "उपश्रेणी",
  "views.table.groupTaxLine": "कर पंक्ति (IRS)",
  "views.table.groupMonth": "महीना",
  "views.table.groupAccount": "खाता",
  "views.table.groupMerchant": "व्यापारी",
  "views.table.groupMonthCategory": "महीना + श्रेणी",
  "views.table.groupCategorySub": "श्रेणी + उपश्रेणी",
  "views.table.searchPlaceholder": "विवरण में खोजें (regex)…",
  "views.table.expandAll": "सब खोलें",
  "views.table.collapseAll": "सब बंद करें",
  "views.table.indistinguishable": "पहचाना न जा सकने वाला डुप्लिकेट",
  "views.table.firstPage": "पहला पेज",
  "views.table.lastPage": "आख़िरी पेज",
  "views.table.prev": "← पिछला",
  "views.table.next": "अगला →",
  "views.table.page": "पेज {{page}} / {{pages}} (कुल {{total}})",

  "views.sessions.title": "कर सत्र",
  "views.sessions.closeSession": "सत्र बंद करें",
  "views.sessions.new": "नया सत्र",
  "views.sessions.newPlaceholder": "जैसे 2025 के कर",
  "views.sessions.creating": "बना रहे हैं…",
  "views.sessions.create": "बनाएँ →",
  "views.sessions.yours": "आपके सत्र",
  "views.sessions.row_one": "{{count}} लेनदेन · {{date}} को अपडेट हुआ",
  "views.sessions.row_other": "{{count}} लेनदेन · {{date}} को अपडेट हुआ",
  "views.sessions.none": "अभी कोई सत्र नहीं है। शुरू करने के लिए ऊपर एक बनाएँ।",
  "views.sessions.share": "कई डिवाइसों पर एक ही npub इस्तेमाल करके सत्र साझा करें।",

  "views.import.title": "लेनदेन इंपोर्ट करें",
  "views.import.clearAll": "सारे लेनदेन साफ़ करें…",
  "views.import.confirmClear": "सारे लेनदेन और वर्गीकरण मिटाएँ?",
  "views.import.yesClear": "हाँ, साफ़ करें",
  "views.import.cleared": "{{transactions}} लेनदेन और {{classifications}} वर्गीकरण साफ़ किए।",
  "views.import.sources": "इंपोर्ट किए गए स्रोत",
  "views.import.confirmRemove": "“{{account}}” के सभी {{count}} लेनदेन हटाएँ?\nउनके वर्गीकरण भी मिट जाएँगे।",
  "views.import.removeTitle": "{{account}} के सभी लेनदेन हटाएँ",
  "views.import.drop": "CSV फ़ाइलें यहाँ छोड़ें या चुनने के लिए क्लिक करें",
  "views.import.assign": "हर फ़ाइल को एक खाते से जोड़ें। एक ही खाता-नाम वाली फ़ाइलें एक ही स्रोत मानी जाती हैं।",
  "views.import.size": "{{size}} KB",
  "views.import.account": "खाता:",
  "views.import.accountPlaceholder": "जैसे Chase 8890",
  "views.import.grouped": "समूहित",
  "views.import.groupedTitle": "कई फ़ाइलें यह खाता-नाम साझा करती हैं",
  "views.import.reading": "{{file}} पढ़ रहे हैं…",
  "views.import.importing": "{{file}} इंपोर्ट कर रहे हैं…",
  "views.import.importingButton": "इंपोर्ट कर रहे हैं…",
  "views.import.importFiles": "फ़ाइलें इंपोर्ट करें",
  "views.import.results": "इंपोर्ट के नतीजे",
  "views.import.added": "{{count}} नए",
  "views.import.deduped": "· {{count}} डुप्लिकेट हटाए",
  "views.import.ambiguous": "· {{count}} अस्पष्ट",
  "views.import.totalInSession_one": "सत्र में {{count}} लेनदेन",
  "views.import.totalInSession_other": "सत्र में {{count}} लेनदेन",
  "views.import.reviewAccounts": "खाते जाँचें →",
  "views.import.classify": "Claude से वर्गीकृत करें →",
  "views.import.viewTransactions": "लेनदेन देखें",

  "views.accounts.title": "खाते",
  "views.accounts.intro": "हर खाते का प्रकार चुनें ताकि वर्गीकरणकर्ता एक-दूसरे पर चढ़ते CSV निर्यात के डुप्लिकेट पकड़ सके और आपके अपने खातों के बीच के ट्रांसफ़र पहचान सके। अच्छे नतीजों के लिए वर्गीकरण से <b>पहले</b> खातों का प्रकार चुनें।",
  "views.accounts.loading": "खाते लोड हो रहे हैं…",
  "views.accounts.empty": "अभी कोई लेनदेन इंपोर्ट नहीं हुआ। पहले CSV इंपोर्ट करें।",
  "views.accounts.aliases": "पहचाने गए खाता-उपनाम (आख़िरी 4 अंक एक जैसे)",
  "views.accounts.aliasesNote": "वर्गीकरणकर्ता उपनाम वाले खातों के लेनदेन को संभावित डुप्लिकेट मानता है।",
  "views.accounts.sources": "स्रोत:",
  "views.accounts.loadingTransactions": "लेनदेन लोड हो रहे हैं…",
  "views.accounts.noTransactions": "कोई लेनदेन नहीं मिला।",
  "views.accounts.type.bank": "बैंक",
  "views.accounts.type.bankHint": "चालू या बचत खाता",
  "views.accounts.type.card": "कार्ड",
  "views.accounts.type.cardHint": "क्रेडिट या डेबिट कार्ड",
  "views.accounts.type.investment": "निवेश",
  "views.accounts.type.investmentHint": "ब्रोकरेज या क्रिप्टो",
  "views.accounts.type.loan": "ऋण",
  "views.accounts.type.loanHint": "गृह, वाहन, शिक्षा",
  "views.accounts.type.unknown": "अज्ञात",
  "views.accounts.type.unknownHint": "अभी श्रेणी नहीं दी गई",

  "views.transactions.title": "लेनदेन",
  "views.transactions.about": "लेनदेन पेज आपकी CSV की पंक्तियाँ वैसे ही दिखाता है जैसे इंपोर्ट हुईं, श्रेणी देने से पहले: बिना प्रोसेस की गई लेखा-बही।",
  "views.transactions.loadFailed": "लेनदेन लोड नहीं हो सके",
  "views.transactions.show": "दिखाएँ",
  "views.transactions.scopeAll": "सभी लेनदेन",
  "views.transactions.scopeTax": "कर से जुड़े आइटम (Sch A + C)",
  "views.transactions.scopeC": "सिर्फ़ Schedule C",
  "views.transactions.scopeA": "सिर्फ़ Schedule A",
  "views.transactions.amountPlaceholder": "जैसे <-95, [0..10), !33",
  "views.transactions.amountTitle": "राशि फ़िल्टर: <, <=, >, >=, =, !=, !N, not N, gt/gte/lt/lte/eq/neq N, [lo..hi), (lo..hi], lo..hi",
  "views.transactions.clearFilters": "फ़िल्टर हटाएँ",
  "views.transactions.subFilter": "उपश्रेणी से फ़िल्टर: <b>{{sub}}</b>",
  "views.transactions.noMatch": "इस फ़िल्टर से कोई लेनदेन मेल नहीं खाता।",
  "views.transactions.ambiguousInCsv": "CSV में पहचाना न जा सकने वाला डुप्लिकेट",
  "views.transactions.classification": "वर्गीकरण",
  "views.transactions.removeTitle": "वर्गीकरण हटाएँ",
  "views.transactions.confirmRevert": "वर्गीकरण हटाएँ? लेनदेन फिर से बिना श्रेणी का हो जाएगा।",
  "views.transactions.findSimilar": "मिलते-जुलते लेनदेन खोजें",
  "views.transactions.ruleHeading": "एक नियम बनाएँ?",
  "views.transactions.ruleApply": "इस regex से मेल खाने वाले लेनदेन पर <b>{{category}} / {{sub}}</b> लागू करें:",
  "views.transactions.saveRule": "नियम सहेजें",
  "views.transactions.skip": "छोड़ें",
  "views.transactions.ruleSaved": "नियम सहेजा गया: <code>/{{pattern}}/</code> → {{category}} / {{sub}}",
  "views.transactions.applyAll": "सभी मेल खाने वालों पर लागू करें",
  "views.transactions.ruleApplied_one": "नियम लागू हुआ: {{count}} लेनदेन अपडेट हुआ",
  "views.transactions.ruleApplied_other": "नियम लागू हुआ: {{count}} लेनदेन अपडेट हुए",

  "views.classify.title": "श्रेणी दें",
  "views.classify.total": "कुल",
  "views.classify.categorized": "श्रेणीबद्ध",
  "views.classify.uncategorized": "बिना श्रेणी",
  "views.classify.running": "श्रेणी दे रहे हैं…",
  "views.classify.paused": "रुका हुआ",
  "views.classify.complete": "पूरा हुआ",
  "views.classify.importFirst": "पहले लेनदेन इंपोर्ट करें",
  "views.classify.ready": "श्रेणी देने के लिए तैयार",
  "views.classify.error": "कुछ गड़बड़ हो गई",
  "views.classify.usage": "AI उपयोग:",
  "views.classify.calls": "{{count}} कॉल",
  "views.classify.tokensIn": "{{count}} इनपुट",
  "views.classify.tokensOut": "{{count}} आउटपुट",
  "views.classify.tokensTotal": "कुल {{count}} टोकन",
  "views.classify.runHeading": "Claude AI से श्रेणी दें",
  "views.classify.runIntro": "बिना श्रेणी वाले लेनदेन को सीधे आपके ब्राउज़र से Claude द्वारा श्रेणी देता है। पहले नियम लागू होते हैं, फिर बाकी को AI श्रेणी देता है।",
  "views.classify.categorizeN": "{{count}} बिना श्रेणी वाले लेनदेन को श्रेणी दें",
  "views.classify.allDone": "सब वर्गीकृत हो गए",
  "views.classify.confirmRecategorize": "सभी {{count}} लेनदेन को फिर से श्रेणी दें?\n\nइससे Claude AI हर लेनदेन पर दोबारा चलता है, जिनमें पहले से श्रेणीबद्ध और हाथ से बदले गए लेनदेन भी शामिल हैं। नियम बेहतर होने पर इसका इस्तेमाल करें।",
  "views.classify.recategorizeAll": "सबको फिर से श्रेणी दें ({{count}})",
  "views.classify.confirmReset": "सारी श्रेणियाँ मिटाएँ? लेनदेन बने रहेंगे।",
  "views.classify.resetDone": "{{count}} वर्गीकरण साफ़ किए।",
  "views.classify.resetAll": "सभी श्रेणियाँ रीसेट करें",
  "views.classify.importFirstDot": "पहले लेनदेन इंपोर्ट करें।",
  "views.classify.pause": "श्रेणी देना रोकें",
  "views.classify.resume": "श्रेणी देना फिर शुरू करें",
  "views.classify.pausedAt": "{{pct}}% पर रुका",
  "views.classify.refreshStats": "आँकड़े रीफ़्रेश करें",
  "views.classify.rulesHeading": "श्रेणी के नियम",
  "views.classify.applyNow": "नियम अभी लागू करें",
  "views.classify.newRule": "+ नया नियम",
  "views.classify.rulesIntro": "नियम विवरण के पैटर्न मिलाकर इंपोर्ट किए गए लेनदेन को श्रेणी देते हैं। वे इंपोर्ट किए गए डेटा को नहीं बदलते: श्रेणियाँ अलग से सहेजी जाती हैं। “नियम अभी लागू करें” हर नियम को हर लेनदेन पर फिर से चलाता है। किसी नियम को बदलने के लिए उस पर क्लिक करें।",
  "views.classify.applied_one": "नियम लागू हुए: {{count}} लेनदेन अपडेट हुआ।",
  "views.classify.applied_other": "नियम लागू हुए: {{count}} लेनदेन अपडेट हुए।",
  "views.classify.searchRules": "नियम खोजें (पैटर्न, श्रेणी, उपश्रेणी)…",
  "views.classify.patternLabel": "विवरण का पैटर्न (regex, बड़े-छोटे अक्षर का भेद नहीं)",
  "views.classify.matches_one": "{{count}} मेल",
  "views.classify.matches_other": "{{count}} मेल",
  "views.classify.checking": "जाँच रहे हैं…",
  "views.classify.patternPlaceholder": "जैसे mr cooper|nationstar|rocket mortgage",
  "views.classify.category": "श्रेणी",
  "views.classify.subcategory": "उपश्रेणी ({{count}})",
  "views.classify.subcategoryCustom": "उपश्रेणी ({{count}} + {{custom}} अपनी)",
  "views.classify.select": "चुनें…",
  "views.classify.amountFilter": "राशि की शर्त",
  "views.classify.any": "कोई भी",
  "views.classify.amountValue": "राशि",
  "views.classify.renameTo": "नया नाम (वैकल्पिक)",
  "views.classify.renamePlaceholder": "नया विवरण",
  "views.classify.updateRule": "नियम अपडेट करें",
  "views.classify.saveRule": "नियम सहेजें",
  "views.classify.noRules": "अभी कोई नियम नहीं है।",
  "views.classify.ruleAmount": "राशि {{op}} {{value}}",
  "views.classify.ruleRename": "नया नाम: “{{name}}”",
  "views.classify.customHeading": "अपनी श्रेणियाँ",
  "views.classify.newCategory": "+ नई श्रेणी",
  "views.classify.customIntro": "ऐसी उपश्रेणियाँ जोड़ें जो बनी-बनाई सूची में नहीं हैं। AI श्रेणीकरण भी इन्हें सीख लेता है।",
  "views.classify.customCategoryPlaceholder": "जैसे Personal",
  "views.classify.subcategoryLabel": "उपश्रेणी",
  "views.classify.customSubPlaceholder": "जैसे पेट्रोल",
  "views.classify.addCategory": "श्रेणी जोड़ें",
  "views.classify.noCustom": "कोई अपनी श्रेणी नहीं है। ज़्यादातर मामलों के लिए बनी-बनाई श्रेणियाँ काफ़ी हैं।",
  "views.classify.errors": "श्रेणी देने में त्रुटियाँ",
  "views.classify.recent": "हाल में श्रेणी दिए गए",

  "views.donut.classified": "वर्गीकृत",
  "views.donut.needsReview": "जाँच बाकी",
  "views.donut.other": "अन्य",

  "views.reason.duplicateOf": "इसका डुप्लिकेट",
  "views.reason.twin": "जुड़वाँ",
  "views.reason.goTo": "लेनदेन {{id}} पर जाएँ",

  "views.summary.title": "श्रेणीबद्ध",
  "views.summary.about": "श्रेणीबद्ध पेज AI द्वारा श्रेणी दी गई गतिविधि दिखाता है: नियमों और AI के कर-श्रेणियाँ देने के बाद की लेखा-बही।",
  "views.summary.count": "{{count}} श्रेणीबद्ध",
  "views.summary.noMatch": "इस फ़िल्टर से कोई श्रेणीबद्ध लेनदेन मेल नहीं खाता।",

  "views.subscriptions.title": "सब्सक्रिप्शन",
  "views.subscriptions.lede": "बार-बार होने वाले शुल्क और भूले हुए पैसे के रिसाव खोजें",
  "views.subscriptions.scanning": "स्कैन कर रहे हैं…",
  "views.subscriptions.rescan": "फिर से स्कैन करें",
  "views.subscriptions.scan": "सब्सक्रिप्शन खोजें",
  "views.subscriptions.phase.fetching": "लेनदेन लोड हो रहे हैं…",
  "views.subscriptions.phase.analyzing": "बार-बार होने वाले पैटर्न खोज रहे हैं…",
  "views.subscriptions.phase.enriching": "रद्द करने के लिंक खोज रहे हैं…",
  "views.subscriptions.working": "काम चल रहा है…",
  "views.subscriptions.recurring": "बार-बार होने वाले सब्सक्रिप्शन",
  "views.subscriptions.spent": "कुल ख़र्च (डेटा में)",
  "views.subscriptions.projected": "अनुमानित सालाना लागत",
  "views.subscriptions.none": "कोई बार-बार होने वाला सब्सक्रिप्शन नहीं मिला। बढ़िया!",
  "views.subscriptions.freq.daily": "रोज़",
  "views.subscriptions.freq.weekly": "हर हफ़्ते",
  "views.subscriptions.freq.monthly": "हर महीने",
  "views.subscriptions.freq.quarterly": "हर तिमाही",
  "views.subscriptions.freq.annual": "हर साल",
  "views.subscriptions.per.daily": "/दिन",
  "views.subscriptions.per.weekly": "/हफ़्ता",
  "views.subscriptions.per.monthly": "/महीना",
  "views.subscriptions.per.quarterly": "/तिमाही",
  "views.subscriptions.per.annual": "/साल",
  "views.subscriptions.perYear": "{{amount}}/साल",
  "views.subscriptions.charges_one": "{{count}} शुल्क",
  "views.subscriptions.charges_other": "{{count}} शुल्क",
  "views.subscriptions.firstSeen": "पहली बार दिखा:",
  "views.subscriptions.lastSeen": "आख़िरी बार दिखा:",
  "views.subscriptions.totalSpent": "कुल ख़र्च:",
  "views.subscriptions.cancel": "रद्द करें / सदस्यता छोड़ें →",
  "views.subscriptions.cancelVia": "{{method}} से रद्द करें",
  "views.subscriptions.noCancelInfo": "रद्द करने की कोई जानकारी नहीं है",
  "views.subscriptions.emptyIntro": "बार-बार होने वाले सब्सक्रिप्शन खोजने के लिए अपने इंपोर्ट किए गए लेनदेन स्कैन करें।",
  "views.subscriptions.emptyNote": "यह रोज़, हर हफ़्ते, हर महीने, हर तिमाही और हर साल के पैटर्न पहचानता है, और जहाँ हो सके रद्द करने के लिंक खोजता है।",

  "views.advisor.title": "वित्तीय सलाहकार",
  "views.advisor.lede": "TaxSort के इस्तेमाल के बारे में मुझसे कुछ भी पूछें",
  "views.advisor.whatToAsk": "मैं क्या पूछ सकता हूँ?",
  "views.advisor.thinking": "सोच रहे हैं…",
  "views.advisor.placeholder": "वित्तीय सलाहकार से पूछें…",
  "views.advisor.ask": "पूछें",
  "views.advisor.error": "त्रुटि: {{error}}",
  "views.advisor.you": "मैं",
  "views.advisor.prompt.1": "TaxSort मेरे लिए क्या कर सकता है?",
  "views.advisor.prompt.2": "मैं अपने बैंक के लेनदेन कैसे इंपोर्ट करूँ?",
  "views.advisor.prompt.3": "Schedule A और Schedule C में क्या फ़र्क है?",
  "views.advisor.prompt.4": "वर्गीकरण कैसे काम करता है?",
  "views.advisor.prompt.5": "CSV इंपोर्ट करने के बाद मुझे क्या करना चाहिए?",
  "views.advisor.prompt.6": "मैं अपने जीवनसाथी के साथ सत्र कैसे साझा करूँ?",
  "views.advisor.prompt.7": "इंपोर्ट किए गए लेनदेन पर “अस्पष्ट” का क्या मतलब है?",
  "views.advisor.prompt.8": "जिस वर्गीकरण से मैं सहमत नहीं हूँ, उसे कैसे बदलूँ?",
  "views.advisor.fact.1": "IRS हर साल 15 करोड़ से ज़्यादा व्यक्तिगत कर रिटर्न प्रोसेस करता है।",
  "views.advisor.fact.2": "अमेरिकी कर संहिता 10,000 से ज़्यादा पेज की है। नियम-विनियम इसमें 80,000 से ज़्यादा पेज और जोड़ते हैं।",
  "views.advisor.fact.3": "घर से दफ़्तर की कटौती से स्व-रोज़गार वाले लोग साल में 1,500 डॉलर से ज़्यादा बचा सकते हैं।",
  "views.advisor.fact.4": "अमेरिकी लोग कर नियमों का पालन करने में हर साल 6.5 अरब घंटे लगाते हैं।",
  "views.advisor.fact.5": "एक औसत छोटे व्यवसाय का मालिक साल में 240 घंटे करों पर लगाता है।",
  "views.advisor.fact.6": "Section 179 के तहत योग्य उपकरण की पूरी लागत उसी साल काटी जा सकती है जिस साल आप उसे ख़रीदते हैं।",
  "views.advisor.fact.7": "2025 के लिए मानक कटौती अकेले फ़ाइल करने वालों के लिए 15,000 डॉलर और साथ फ़ाइल करने वाले विवाहित जोड़ों के लिए 30,000 डॉलर है।",
  "views.advisor.fact.8": "IRC §274(n) के तहत व्यावसायिक भोजन 50% तक कटौती योग्य है। 2021-2022 में थोड़े समय के लिए यह 100% था।",
  "views.advisor.fact.9": "SALT कटौती की 10,000 डॉलर की सीमा 2017 के Tax Cuts and Jobs Act के साथ आई।",
  "views.advisor.fact.10": "स्व-रोज़गार कर 15.3% है: Social Security के लिए 12.4% और Medicare के लिए 2.9%।",
  "views.advisor.fact.11": "IRS का अनुमान है कि हर साल 688 अरब डॉलर का कर अंतर रहता है: बकाया कर जो चुकाया नहीं गया।",
  "views.advisor.fact.12": "धर्मार्थ दान आपकी समायोजित सकल आय के 60% तक की भरपाई कर सकता है।",
  "views.advisor.fact.13": "अमेरिका में पहला आयकर 1861 में गृहयुद्ध का ख़र्च उठाने के लिए लगाया गया था।",
  "views.advisor.fact.14": "कहा जाता है कि अल्बर्ट आइंस्टीन ने कहा था: “दुनिया में सबसे कठिन चीज़ आयकर को समझना है।”",
  "views.advisor.fact.15": "सिर्फ़ लगभग 10% करदाता कटौतियाँ अलग-अलग गिनाते हैं। बाकी मानक कटौती लेते हैं।",
  "views.advisor.fact.16": "तिमाही अनुमानित कर 15 अप्रैल, 15 जून, 15 सितंबर और 15 जनवरी को देय होते हैं।",

  "views.researcher.title": "कर संहिता शोधकर्ता",
  "views.researcher.lede": "IRS संहिता, अध्याय और खंड तक",
  "views.researcher.whatToResearch": "मैं क्या खोज सकता हूँ?",
  "views.researcher.researching": "खोज रहे हैं…",
  "views.researcher.placeholder": "IRS कर संहिता के बारे में पूछें…",
  "views.researcher.research": "खोजें",
  "views.researcher.attributed": "{{name}} का माना जाता है",
  "views.researcher.prompt.1": "क्या मैं घर के दफ़्तर का इंटरनेट बिल काट सकता हूँ?",
  "views.researcher.prompt.2": "व्यावसायिक भोजन की कटौती के नियम क्या हैं?",
  "views.researcher.prompt.3": "SALT कटौती की सीमा क्या है और कौन-सी धारा इसे तय करती है?",
  "views.researcher.prompt.4": "क्या मैं Schedule C पर स्वास्थ्य बीमा का प्रीमियम काट सकता हूँ?",
  "views.researcher.prompt.5": "IRC §170 के तहत धर्मार्थ दान किसे माना जाता है?",
  "views.researcher.prompt.6": "चिकित्सा ख़र्चों के लिए AGI की 7.5% की निचली सीमा क्या है?",
  "views.researcher.prompt.7": "क्या ग्राहकों से मिलने जाने का माइलेज काटा जा सकता है?",
  "views.researcher.prompt.8": "व्यावसायिक उपकरणों के मूल्यह्रास के नियम क्या हैं?",
  "views.researcher.quote.misesBoom": "ऋण-विस्तार से आई तेज़ी के आख़िरी पतन से बचने का कोई उपाय नहीं है।",
  "views.researcher.quote.hemingway": "बुरी तरह चलाए गए देश का पहला रामबाण मुद्रा-स्फीति है; दूसरा युद्ध।",
  "views.researcher.quote.friedman": "मुद्रास्फीति बिना क़ानून के लगाया गया कर है।",
  "views.researcher.quote.morgan": "सोना ही पैसा है। बाकी सब उधार है।",
  "views.researcher.quote.colbert": "कर लगाने की कला हंस के पंख इस तरह नोचने में है कि कम से कम चीख़ के साथ ज़्यादा से ज़्यादा पंख मिलें।",
  "views.researcher.quote.bastiat": "सरकार वह बड़ा भ्रम है जिसके सहारे हर कोई बाकी सबके ख़र्च पर जीने की कोशिश करता है।",
  "views.researcher.quote.goldwater": "आयकर ने सरकार के किसी भी दूसरे क़दम से ज़्यादा अपराधी पैदा किए।",
  "views.researcher.quote.parker": "अगर जानना है कि भगवान पैसे के बारे में क्या सोचता है, तो बस उन लोगों को देखो जिन्हें उसने पैसा दिया।",
  "views.researcher.quote.lenin": "पूँजीपति वर्ग को कुचलने का तरीका है उसे कर और मुद्रास्फीति की चक्कियों के बीच पीस देना।",
  "views.researcher.quote.greenspan": "स्वर्ण मानक के बिना, बचत को मुद्रास्फीति की ज़ब्ती से बचाने का कोई तरीका नहीं है।",
  "views.researcher.quote.cicero": "बजट संतुलित होना चाहिए, ख़ज़ाना फिर से भरना चाहिए, सार्वजनिक कर्ज़ घटाना चाहिए।",
  "views.researcher.quote.paul": "केंद्रीय बैंकिंग समाजवाद का एक रूप है। यह पैसे और ऋण का समाजीकरण है।",
  "views.researcher.quote.voltaire": "काग़ज़ी मुद्रा आख़िरकार अपने असली मूल्य पर लौट आती है: शून्य।",
  "views.researcher.quote.galbraith": "अर्थशास्त्र के सभी क्षेत्रों में पैसे का अध्ययन वह है जिसमें जटिलता का इस्तेमाल सच छिपाने या सच से बचने के लिए सबसे ज़्यादा होता है।",
  "views.researcher.quote.ammous": "फ़िएट मुद्रा सभी आर्थिक संकटों का मुख्य कारण है।",
  "views.researcher.quote.gates": "बिटकॉइन तकनीक का एक कमाल है।",
  "views.researcher.quote.satoshi": "पारंपरिक मुद्रा की जड़ की समस्या है वह सारा भरोसा जो उसे चलाने के लिए चाहिए।",
  "views.researcher.quote.shaw": "जो सरकार पीटर को लूटकर पॉल को देती है, वह हमेशा पॉल के समर्थन पर भरोसा कर सकती है।",

  "views.feedback.title": "प्रतिक्रिया",
  "views.feedback.submitHeading": "प्रतिक्रिया भेजें",
  "views.feedback.intro": "बग रिपोर्ट, सुविधा के अनुरोध और सवाल GitHub Issues के रूप में ट्रैक होते हैं। आपको GitHub खाते की ज़रूरत नहीं है।",
  "views.feedback.cat.feedback": "सामान्य प्रतिक्रिया",
  "views.feedback.cat.bug": "बग रिपोर्ट",
  "views.feedback.cat.feature": "सुविधा का अनुरोध",
  "views.feedback.cat.question": "सवाल",
  "views.feedback.titlePlaceholder": "छोटा सारांश…",
  "views.feedback.bodyPlaceholder": "समस्या, सुझाव या सवाल लिखें…",
  "views.feedback.submitting": "भेज रहे हैं…",
  "views.feedback.submit": "भेजें",
  "views.feedback.failed": "Issue नहीं बन सका।",
  "views.feedback.recent": "हाल के Issues",
  "views.feedback.state.open": "खुला",
  "views.feedback.state.closed": "बंद",
  "views.feedback.state.submitted": "भेजा गया",
  "views.feedback.comments_one": "{{count}} टिप्पणी",
  "views.feedback.comments_other": "{{count}} टिप्पणियाँ",
  "views.feedback.none": "अभी कोई प्रतिक्रिया नहीं है।",

  "views.settings.title": "सेटिंग्स",
  "views.settings.timeout": "सत्र का टाइमआउट",
  "views.settings.timeoutIntro": "कुछ देर कोई गतिविधि न होने पर ऐप लॉक करें। अनलॉक करने के लिए आपका पासफ़्रेज़ (जिससे आपने साइन इन किया) चाहिए।",
  "views.settings.minutes_one": "{{count}} मिनट",
  "views.settings.minutes_other": "{{count}} मिनट",
  "views.settings.hour": "1 घंटा",
  "views.settings.never": "कभी नहीं",
  "views.settings.current": "अभी: {{value}}",
  "views.settings.noTimeout": "कोई टाइमआउट नहीं",
  "views.settings.currentSession": "मौजूदा सत्र",
  "views.settings.about": "परिचय",
  "views.settings.aboutWhat": "TaxSort MCP: Schedule A और C के लिए लेनदेन वर्गीकरणकर्ता",
  "views.settings.aboutPowered": "Tollbooth DPYC · Neon Postgres · Claude AI से संचालित",
  "views.settings.identity": "पहचान:",
  "views.settings.sharing": "साझा करना: कई डिवाइसों या लोगों के बीच एक ही npub इस्तेमाल करें।",

  "views.profile.heading": "प्रोफ़ाइल",
  "views.profile.credit": "क्रेडिट बैलेंस",
  "views.profile.timezone": "समय क्षेत्र",
  "views.profile.timezoneNote": "इस डिवाइस पर सहेजा गया।",
  "views.profile.theme": "थीम",
  "views.profile.light": "हल्की",
  "views.profile.dark": "गहरी",
  "views.profile.system": "सिस्टम",
  "views.profile.language": "भाषा",
  "views.profile.aiHeading": "AI वर्गीकरण का उपयोग",
  "views.profile.aiNone": "अभी तक कोई वर्गीकरण दर्ज नहीं हुआ।",
  "views.profile.unknownModel": "अज्ञात",
  "views.profile.runs": "रन:",
  "views.profile.calls": "कॉल:",
  "views.profile.input": "इनपुट:",
  "views.profile.output": "आउटपुट:",
  "views.profile.cost": "लागत:",
  "views.profile.estimated": "Anthropic की अनुमानित लागत",
  "views.profile.tokensAcross": "{{calls}} API कॉल में {{tokens}} टोकन",
  "views.profile.inSats": "sats में बराबर",
  "views.profile.sats": "{{count}} sats",
  "views.profile.atPrice": "लगभग {{price}}/BTC के भाव पर",
  "views.profile.whyMatters": "<b>यह क्यों मायने रखता है:</b> TaxSort लेनदेन को वर्गीकृत करने के लिए Claude AI का इस्तेमाल करता है। ऑपरेटर इस AI क्षमता के लिए Anthropic को भुगतान करता है और Tollbooth पर Lightning सूक्ष्म भुगतानों के ज़रिए यह लागत संरक्षकों तक पहुँचाता है।",
  "views.profile.transparency": "आपके टोल क्रेडिट AI की असली लागत और ऑपरेटर के ख़र्च को पूरा करते हैं। आप ठीक-ठीक देखते हैं कि किस चीज़ के पैसे दे रहे हैं: कोई छिपा मुनाफ़ा नहीं, कोई सब्सक्रिप्शन का जाल नहीं।",

  "views.privacy.body": `# TaxSort गोपनीयता नीति

## Don't Pester Your Customer™ (DPYC™)

TaxSort **DPYC™ दर्शन** पर बना है, जो सॉफ़्टवेयर के अपने उपयोगकर्ताओं से आम बर्ताव से बिल्कुल अलग है। मूल सिद्धांत सरल है: *आपकी पहचान, आपका डेटा, आपका पैसा, आपके नियम।*

आम SaaS उत्पाद आज़माने से पहले ही आपका नाम, ईमेल, फ़ोन नंबर, नियोक्ता, पता और भुगतान कार्ड माँगते हैं। वे आपका डेटा दलालों को बेचते हैं, "साझेदारों" के साथ बाँटते हैं, और जान-बूझकर मुश्किल से रद्द होने वाले सब्सक्रिप्शन में फँसा देते हैं। वे ईमेल, पुश नोटिफ़िकेशन और ऐसे छलावे वाले डिज़ाइनों से आपको परेशान करते हैं जो कम से कम मूल्य देकर ज़्यादा से ज़्यादा कमाई निचोड़ने के लिए बने हैं।

**DPYC™ यह सब नकारता है।**

---

## कोई खाता नहीं। कोई ईमेल नहीं। कोई KYC नहीं।

TaxSort को **आपकी असली पहचान के बारे में कुछ भी पता नहीं है।** हम कभी नहीं माँगते आपका:

- ❌ नाम
- ❌ ईमेल पता
- ❌ फ़ोन नंबर
- ❌ डाक पता
- ❌ सोशल सिक्योरिटी नंबर
- ❌ सरकारी पहचान पत्र
- ❌ क्रेडिट कार्ड
- ❌ बैंक खाता

यहाँ **न खाता बनाना है, न साइन-अप फ़ॉर्म, न पासवर्ड।** हैक करने को कुछ नहीं, लीक होने को कुछ नहीं, अदालती आदेश से माँगने को कुछ नहीं।

---

## Nostr कुंजियाँ: आपकी अपनी संप्रभु पहचान

TaxSort में आपकी पहचान एक **Nostr कुंजी-जोड़ी** है: एक सार्वजनिक और एक निजी कुंजी, जिसे आप ख़ुद अपने डिवाइस पर बनाते हैं, किसी की अनुमति के बिना।

### आपका npub (सार्वजनिक कुंजी)
- bech32 में लिखी एक स्ट्रिंग जो \`npub1...\` से शुरू होती है
- साझा करना सुरक्षित है: इसी से TaxSort आपके सत्र और डेटा ढूँढता है
- इसे एक लेटरबॉक्स के पते जैसा समझें: लोग उसमें भेज सकते हैं, पर खोल सिर्फ़ आप सकते हैं

### आपका nsec (निजी कुंजी)
- bech32 में लिखी एक स्ट्रिंग जो \`nsec1...\` से शुरू होती है
- **कभी आपके डिवाइस से बाहर नहीं जाती।** TaxSort इसे कभी नहीं माँगता, कभी नहीं देखता, कभी नहीं सहेजता
- Nostr संदेशों पर हस्ताक्षर करने के काम आती है, जिससे साबित होता है कि संबंधित npub आपका है
- इसे लेटरबॉक्स की चाबी जैसा समझें: इसका आपके पास होना ही मालिकाना हक़ का सबूत है

### Nostr कुंजियाँ ही क्यों?
- **संप्रभु:** इन्हें आप बनाते हैं। कोई संस्था इन्हें न देती है, न छीनती है।
- **साथ ले जाने लायक:** किसी भी Nostr ऐप में काम करती हैं। TaxSort से बँधी नहीं हैं।
- **क्रिप्टोग्राफ़िक:** secp256k1 दीर्घवृत्तीय वक्र (वही जो Bitcoin में है) पर आधारित। इनकी जालसाज़ी नहीं हो सकती।
- **छद्मनामी:** गणित से जुड़ी हैं, किसी सरकारी रजिस्टर से नहीं।

---

## Secure Courier: राज़ बताए बिना मालिकाना हक़ साबित करना

जब आप पहली बार TaxSort इस्तेमाल करते हैं, तो हम **Secure Courier** से, यानी एन्क्रिप्टेड Nostr DM के आदान-प्रदान से, जाँचते हैं कि npub आपका है:

1. TaxSort आपके npub पर एक Nostr डायरेक्ट मैसेज भेजता है
2. आप अपनी पसंद के किसी भी पासफ़्रेज़ से जवाब देते हैं
3. आपके जवाब पर **आपके nsec से हस्ताक्षर** होता है (आपका Nostr क्लाइंट यह अपने आप करता है)
4. हस्ताक्षर साबित करता है कि npub आपका है, आपका nsec कभी उजागर किए बिना

यह **शून्य-ज्ञान पहचान प्रमाण** है। हमें पता चलता है कि उस npub की निजी कुंजी किसी के पास है। उस व्यक्ति के बारे में हमें और कुछ पता नहीं चलता।

### आपका पासफ़्रेज़ आपके डेटा की रक्षा करता है
सत्यापन के समय चुने गए पासफ़्रेज़ से हमारे डेटाबेस में रखे कर-डेटा की एन्क्रिप्शन कुंजी बनती है। इसका मतलब:

- आपके लेनदेन के विवरण, राशियाँ और वर्गीकरण सहेजे जाते समय एन्क्रिप्टेड रहते हैं
- एन्क्रिप्शन कुंजी *आपके* पासफ़्रेज़ से बनती है: इसे हम नहीं चुनते
- अगर आप पासफ़्रेज़ भूल गए, तो आपका डेटा वापस नहीं मिल सकता (यह जान-बूझकर ऐसा बनाया गया है)

---

## सत्र का टाइमआउट और अनलॉक

TaxSort कुछ समय कोई गतिविधि न होने पर अपने आप लॉक हो जाता है; यह समय आप तय कर सकते हैं (शुरू में 15 मिनट)। अनलॉक करने के लिए:

1. TaxSort आपके npub पर एक Nostr DM भेजता है
2. आप "Approve Unlock" लिखकर जवाब देते हैं
3. आपका हस्ताक्षरित जवाब साबित करता है कि कीबोर्ड पर अब भी आप ही हैं

इससे आपके अनलॉक डिवाइस तक पहुँचा कोई और व्यक्ति आपके कर-डेटा तक नहीं पहुँच सकता। अनलॉक के लिए **आपका nsec** (आपके Nostr क्लाइंट के ज़रिए) चाहिए, कोई पासवर्ड नहीं जिसे अंदाज़ा लगाकर या कंधे के ऊपर से देखकर जाना जा सके।

---

## Bitcoin Lightning: भुगतान प्रोसेसर के बिना भुगतान

TaxSort का भुगतान Tollbooth DPYC™ प्रोटोकॉल के ज़रिए **Bitcoin Lightning सूक्ष्म भुगतानों** से होता है। इसका मतलब:

- **क्रेडिट कार्ड की ज़रूरत नहीं।** न Stripe, न PayPal: किसी भुगतान प्रोसेसर को पता नहीं कि आप TaxSort इस्तेमाल करते हैं।
- **कोई सब्सक्रिप्शन नहीं।** आप पहले से क्रेडिट बैलेंस भरते हैं और हर टूल कॉल का भुगतान करते हैं। जब चाहें रुक जाएँ।
- **रिफ़ंड की कोई लालफ़ीताशाही नहीं।** बिना इस्तेमाल हुए क्रेडिट 7 दिन तक ख़त्म नहीं होते। कोई अपने-आप नवीनीकरण नहीं।
- **भुगतान की कोई निगरानी नहीं।** Lightning भुगतान सीधे व्यक्ति से व्यक्ति तक जाते हैं। बैंक स्टेटमेंट की किसी पंक्ति में "TaxSort" नहीं लिखा होता।
- **तुरंत निपटान।** क्रेडिट दिनों में नहीं, सेकंडों में पहुँचते हैं।

### DPYC™ सामाजिक अनुबंध
TaxSort [DPYC™ सामाजिक अनुबंध](https://github.com/lonniev/dpyc-community) का हिस्सा है, जो स्वतंत्र रूप से चलने वाली MCP सेवाओं का एक नेटवर्क है जो इन सिद्धांतों को साझा करती हैं। हर ऑपरेटर अपना सर्वर चलाता है, अपनी कीमतें तय करता है और अपने संरक्षकों के प्रति जवाबदेह है। न कोई केंद्रीय सत्ता है, न प्लेटफ़ॉर्म शुल्क, न ऐप स्टोर का हिस्सा।

---

## हम क्या सहेजते हैं

| डेटा | कहाँ | एन्क्रिप्टेड? | कौन पढ़ सकता है? |
|------|-------|-----------|-----------------|
| आपका npub | Neon Postgres | नहीं (यह सार्वजनिक है) | ऑपरेटर |
| सत्यापन की स्थिति | Neon Postgres | नहीं | ऑपरेटर |
| पासफ़्रेज़ का हैश | Neon Postgres | एकतरफ़ा हैश | कोई नहीं |
| कर सत्र | Neon Postgres | सहेजते समय | ऑपरेटर + आप |
| लेनदेन | Neon Postgres | सहेजते समय | ऑपरेटर + आप |
| वर्गीकरण | Neon Postgres | सहेजते समय | ऑपरेटर + आप |
| क्रेडिट बैलेंस | Neon Postgres | एन्क्रिप्टेड | ऑपरेटर |
| Lightning इनवॉइस | BTCPay Server | BTCPay एन्क्रिप्शन | ऑपरेटर |

**हम नहीं सहेजते:** आपका nsec, आपका असली नाम, आपका ईमेल, आपका IP पता (रूटिंग Cloudflare संभालता है), आपके ब्राउज़र का फ़िंगरप्रिंट, या कोई भी एनालिटिक्स या टेलीमेट्री।

---

## हम Claude AI को क्या भेजते हैं

जब आप श्रेणी देने की सुविधा या AI सलाहकारों का इस्तेमाल करते हैं, तो आपके लेनदेन के विवरण और राशियाँ वर्गीकरण के लिए Anthropic के Claude API को जाती हैं। इसका मतलब:

- Anthropic आपके लेनदेन का पाठ थोड़ी देर के लिए प्रोसेस करता है और उसे हमारे लिए नहीं रखता
- Anthropic की [डेटा प्रतिधारण नीति](https://www.anthropic.com/privacy) लागू होती है
- हम सिर्फ़ ज़रूरी संदर्भ भेजते हैं (तारीख, विवरण, राशि, खाता)
- हम आपका npub, पासफ़्रेज़ या आपकी पहचान बताने वाली कोई भी जानकारी Anthropic को **नहीं** भेजते

---

## हम कभी क्या नहीं करेंगे

- 🚫 आपका डेटा बेचना
- 🚫 आपका डेटा विज्ञापनदाताओं के साथ साझा करना
- 🚫 सरकारी पहचान पत्र माँगना
- 🚫 किसी भी सत्ता को रिपोर्ट करना (हमें नहीं पता आप कौन हैं)
- 🚫 आपको मार्केटिंग ईमेल भेजना (हमारे पास आपका ईमेल नहीं है)
- 🚫 सब्सक्रिप्शन अपने-आप नवीनीकृत करना (कोई सब्सक्रिप्शन है ही नहीं)
- 🚫 आपको आपके डेटा से बाहर करना (यह आपके नियंत्रण वाले npub से जुड़ा है)
- 🚫 छोड़ना मुश्किल बनाना (कभी भी अपना डेटा निर्यात करें, कभी भी अपना सत्र मिटाएँ)

---

## खुला स्रोत और जाँच योग्य

TaxSort का सोर्स कोड खुला है:

- **MCP सर्वर:** [github.com/lonniev/taxsort-mcp](https://github.com/lonniev/taxsort-mcp)
- **Tollbooth SDK:** [github.com/lonniev/tollbooth-dpyc](https://github.com/lonniev/tollbooth-dpyc)
- **लाइसेंस:** Apache 2.0

आप ठीक-ठीक जाँच सकते हैं कि कौन-सा डेटा इकट्ठा होता है, कैसे सहेजा जाता है और कहाँ भेजा जाता है। कोई छिपे एनालिटिक्स नहीं, कोई ट्रैकिंग पिक्सेल नहीं, कोई तीसरे पक्ष की स्क्रिप्ट नहीं।

---

*Don't Pester Your Customer™: क्योंकि आपका कर-डेटा आपके सिवा किसी का मामला नहीं है।*

*नॉर्टन जस्टर की [The Phantom Tollbooth](https://en.wikipedia.org/wiki/The_Phantom_Tollbooth) (1961) से प्रेरित।*
`,

  "lib.mcp.unknownError": "अज्ञात त्रुटि",
  "lib.classify.noKey": "कोई Anthropic API कुंजी उपलब्ध नहीं है।",
  "lib.classify.parseFailed": "दौर {{round}}: AI का जवाब पढ़ा नहीं जा सका",
  "lib.classify.outOfCredits": "AI वर्गीकरण सेवा के क्रेडिट ख़त्म हो गए हैं। कृपया TaxSort के ऑपरेटर से अपना Anthropic API बैलेंस टॉप अप करने को कहें।",
  "lib.subscriptions.failed": "सब्सक्रिप्शन स्कैन विफल रहा",
};

export default hi;
