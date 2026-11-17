/** TaxSort 的中文用语。规则见 en.ts。 */

import type { Translation } from "./en.ts";

const zh: Translation = {
  // ─── ui ───
  "ui.app.welcome": "你的交易按 IRS 申报行分好类，保存在你的密钥之下。",
  "ui.app.loading": "加载中…",
  "ui.app.signedOutNote": "无需邮箱。无需密码。无需 KYC。",
  "ui.app.privacyLink": "隐私政策",
  "ui.app.statusFailed": "MCP 连接失败",
  "ui.app.retry": "重试",
  "ui.app.connecting": "正在连接 TaxSort MCP…",
  "ui.app.connected": "已连接到 <service/> v{{version}}",
  "ui.app.fingerprintTitle": "运营方 npub 的指纹：请核对它与 TaxSort 发来的私信一致",
  "ui.app.vaultNotConfigured": "（保险库尚未设置）",

  "ui.nav.sessions": "会话",
  "ui.nav.sessionsTitle": "创建并切换各纳税年度的会话",
  "ui.nav.import": "导入",
  "ui.nav.importTitle": "上传银行 CSV 文件",
  "ui.nav.accounts": "账户",
  "ui.nav.accountsTitle": "标记账户类型，查看别名和交易",
  "ui.nav.transactions": "交易",
  "ui.nav.transactionsTitle": "浏览和搜索已导入的交易",
  "ui.nav.categorize": "→ 分类 →",
  "ui.nav.categorizeTitle": "用 AI 为已导入的交易分类",
  "ui.nav.categorized": "已分类",
  "ui.nav.categorizedTitle": "查看各类别的合计",
  "ui.nav.subscriptions": "订阅",
  "ui.nav.subscriptionsTitle": "找出定期扣费和漏掉的钱",
  "ui.nav.advisor": "顾问",
  "ui.nav.advisorTitle": "向财务顾问询问 TaxSort 的用法",
  "ui.nav.taxCode": "税法",
  "ui.nav.taxCodeTitle": "查找 IRS 税法条文，精确到章节",
  "ui.nav.feedback": "反馈",
  "ui.nav.feedbackTitle": "报告问题、提出功能需求、提问",
  "ui.nav.usage": "用量与费用",
  "ui.nav.usageTitle": "AI 用量和预估费用",
  "ui.nav.wallet": "钱包",
  "ui.nav.walletTitle": "额度余额和 Lightning 充值",
  "ui.nav.settings": "设置",
  "ui.nav.settingsTitle": "自动锁定时间、共享和关于",
  "ui.nav.privacy": "隐私",
  "ui.nav.privacyTitle": "你的数据如何受到保护",
  "ui.nav.logOut": "退出登录",
  "ui.nav.profile": "个人资料",
  "ui.nav.session": "会话：",
  "ui.nav.collaborators_other": "{{count}} 位协作者",

  "ui.lock.title": "会话已超时",
  "ui.lock.pasteNsec": "粘贴你登录时用的 nsec 以继续。",
  "ui.lock.enterPassphrase": "输入你的口令以继续。就是你通过 Nostr 私信登录时回复的那条口令。",
  "ui.lock.passphrasePlaceholder": "你的口令…",
  "ui.lock.wrongKey": "这不是此浏览器登录时用的密钥。",
  "ui.lock.wrongPassphrase": "口令不正确。",
  "ui.lock.verifying": "正在核对…",
  "ui.lock.unlock": "解锁",
  "ui.lock.signOut": "退出登录（之后需重新登录）",

  // ─── views ───
  "views.common.refresh": "刷新",
  "views.common.cancel": "取消",
  "views.common.loading": "加载中…",
  "views.common.saving": "保存中…",
  "views.common.save": "保存",
  "views.common.done": "完成",
  "views.common.search": "搜索",
  "views.common.clear": "清除",
  "views.common.applying": "应用中…",
  "views.common.clearing": "清除中…",
  "views.common.manual": "手动",
  "views.common.rule": "规则",
  "views.common.transactions_other": "{{count}} 笔交易",

  "views.table.date": "日期",
  "views.table.description": "描述",
  "views.table.amount": "金额",
  "views.table.account": "账户",
  "views.table.category": "类别",
  "views.table.all": "全部",
  "views.table.group": "分组",
  "views.table.groupOrder": "分组顺序",
  "views.table.sortBy": "排序",
  "views.table.sortDirection": "排序方向",
  "views.table.groupNone": "不分组",
  "views.table.groupCategory": "类别",
  "views.table.groupSubcategory": "子类别",
  "views.table.groupTaxLine": "税表行（IRS）",
  "views.table.groupMonth": "月份",
  "views.table.groupAccount": "账户",
  "views.table.groupMerchant": "商家",
  "views.table.groupMonthCategory": "月份 + 类别",
  "views.table.groupCategorySub": "类别 + 子类别",
  "views.table.searchPlaceholder": "搜索描述（正则表达式）…",
  "views.table.expandAll": "全部展开",
  "views.table.collapseAll": "全部收起",
  "views.table.indistinguishable": "无法区分的重复项",
  "views.table.firstPage": "第一页",
  "views.table.lastPage": "最后一页",
  "views.table.prev": "← 上一页",
  "views.table.next": "下一页 →",
  "views.table.page": "第 {{page}} / {{pages}} 页（共 {{total}} 条）",

  "views.sessions.title": "税务会话",
  "views.sessions.closeSession": "关闭会话",
  "views.sessions.new": "新会话",
  "views.sessions.newPlaceholder": "例如：2025 年税务",
  "views.sessions.creating": "创建中…",
  "views.sessions.create": "创建 →",
  "views.sessions.yours": "你的会话",
  "views.sessions.row_other": "{{count}} 笔交易 · 更新于 {{date}}",
  "views.sessions.none": "还没有会话。在上方创建一个即可开始。",
  "views.sessions.share": "在多台设备上使用同一个 npub，即可共享会话。",

  "views.import.title": "导入交易",
  "views.import.clearAll": "清除所有交易…",
  "views.import.confirmClear": "删除所有交易和分类？",
  "views.import.yesClear": "是，清除",
  "views.import.cleared": "已清除 {{transactions}} 笔交易和 {{classifications}} 条分类。",
  "views.import.sources": "已导入的来源",
  "views.import.confirmRemove": "删除“{{account}}”中的全部 {{count}} 笔交易？\n它们的分类也会一并删除。",
  "views.import.removeTitle": "删除 {{account}} 的全部交易",
  "views.import.drop": "拖入 CSV 文件，或点击选择",
  "views.import.assign": "为每个文件指定一个账户。账户名相同的文件视为同一来源。",
  "views.import.size": "{{size}} KB",
  "views.import.account": "账户：",
  "views.import.accountPlaceholder": "例如：Chase 8890",
  "views.import.grouped": "已合并",
  "views.import.groupedTitle": "多个文件共用这个账户名",
  "views.import.reading": "正在读取 {{file}}…",
  "views.import.importing": "正在导入 {{file}}…",
  "views.import.importingButton": "导入中…",
  "views.import.importFiles": "导入文件",
  "views.import.results": "导入结果",
  "views.import.added": "新增 {{count}} 笔",
  "views.import.deduped": "· 去除重复 {{count}} 笔",
  "views.import.ambiguous": "· 不明确 {{count}} 笔",
  "views.import.totalInSession_other": "会话中共 {{count}} 笔交易",
  "views.import.reviewAccounts": "检查账户 →",
  "views.import.classify": "用 Claude 分类 →",
  "views.import.viewTransactions": "查看交易",

  "views.accounts.title": "账户",
  "views.accounts.intro": "为每个账户标记类型，分类器就能找出重叠 CSV 导出中的重复项，并识别你自己账户之间的转账。为获得最佳效果，请在分类<b>之前</b>设置账户类型。",
  "views.accounts.loading": "正在加载账户…",
  "views.accounts.empty": "还没有导入交易。请先导入 CSV。",
  "views.accounts.aliases": "检测到的账户别名（末 4 位相同）",
  "views.accounts.aliasesNote": "分类器会把别名账户的交易视为可能的重复项。",
  "views.accounts.sources": "来源：",
  "views.accounts.loadingTransactions": "正在加载交易…",
  "views.accounts.noTransactions": "没有找到交易。",
  "views.accounts.type.bank": "银行",
  "views.accounts.type.bankHint": "支票或储蓄账户",
  "views.accounts.type.card": "卡",
  "views.accounts.type.cardHint": "信用卡或借记卡",
  "views.accounts.type.investment": "投资",
  "views.accounts.type.investmentHint": "券商或加密资产",
  "views.accounts.type.loan": "贷款",
  "views.accounts.type.loanHint": "房贷、车贷、学贷",
  "views.accounts.type.unknown": "未知",
  "views.accounts.type.unknownHint": "尚未分类",

  "views.transactions.title": "交易",
  "views.transactions.about": "“交易”显示导入后、分类前的 CSV 明细行：未经处理的会计日记账。",
  "views.transactions.loadFailed": "无法加载交易",
  "views.transactions.show": "显示",
  "views.transactions.scopeAll": "全部交易",
  "views.transactions.scopeTax": "税务项目（Sch A + C）",
  "views.transactions.scopeC": "仅 Schedule C",
  "views.transactions.scopeA": "仅 Schedule A",
  "views.transactions.amountPlaceholder": "例如：<-95, [0..10), !33",
  "views.transactions.amountTitle": "金额筛选：<, <=, >, >=, =, !=, !N, not N, gt/gte/lt/lte/eq/neq N, [lo..hi), (lo..hi], lo..hi",
  "views.transactions.clearFilters": "清除筛选",
  "views.transactions.subFilter": "按子类别筛选：<b>{{sub}}</b>",
  "views.transactions.noMatch": "没有符合此筛选的交易。",
  "views.transactions.ambiguousInCsv": "CSV 中无法区分的重复项",
  "views.transactions.classification": "分类",
  "views.transactions.removeTitle": "移除分类",
  "views.transactions.confirmRevert": "移除这条分类？这笔交易会变回未分类。",
  "views.transactions.findSimilar": "查找相似交易",
  "views.transactions.ruleHeading": "创建一条规则？",
  "views.transactions.ruleApply": "把 <b>{{category}} / {{sub}}</b> 应用到匹配此正则表达式的交易：",
  "views.transactions.saveRule": "保存规则",
  "views.transactions.skip": "跳过",
  "views.transactions.ruleSaved": "规则已保存：<code>/{{pattern}}/</code> → {{category}} / {{sub}}",
  "views.transactions.applyAll": "应用到所有匹配项",
  "views.transactions.ruleApplied_other": "规则已应用：更新了 {{count}} 笔交易",

  "views.classify.title": "分类",
  "views.classify.total": "总数",
  "views.classify.categorized": "已分类",
  "views.classify.uncategorized": "未分类",
  "views.classify.running": "分类中…",
  "views.classify.paused": "已暂停",
  "views.classify.complete": "已完成",
  "views.classify.importFirst": "请先导入交易",
  "views.classify.ready": "可以开始分类",
  "views.classify.error": "出了点问题",
  "views.classify.usage": "AI 用量：",
  "views.classify.calls": "{{count}} 次调用",
  "views.classify.tokensIn": "输入 {{count}}",
  "views.classify.tokensOut": "输出 {{count}}",
  "views.classify.tokensTotal": "共 {{count}} 个 token",
  "views.classify.runHeading": "用 Claude AI 分类",
  "views.classify.runIntro": "直接在浏览器中用 Claude 为未分类的交易分类。先应用规则，剩下的由 AI 分类。",
  "views.classify.categorizeN": "为 {{count}} 笔未分类交易分类",
  "views.classify.allDone": "已全部分类",
  "views.classify.confirmRecategorize": "重新为全部 {{count}} 笔交易分类？\n\n这会让 Claude AI 重新处理每一笔交易，包括已经分类和手动编辑过的。规则改进后再用它。",
  "views.classify.recategorizeAll": "全部重新分类（{{count}}）",
  "views.classify.confirmReset": "删除所有分类？交易会保留。",
  "views.classify.resetDone": "已清除 {{count}} 条分类。",
  "views.classify.resetAll": "重置所有类别",
  "views.classify.importFirstDot": "请先导入交易。",
  "views.classify.pause": "暂停分类",
  "views.classify.resume": "继续分类",
  "views.classify.pausedAt": "已在 {{pct}}% 处暂停",
  "views.classify.refreshStats": "刷新统计",
  "views.classify.rulesHeading": "分类规则",
  "views.classify.applyNow": "立即应用规则",
  "views.classify.newRule": "+ 新规则",
  "views.classify.rulesIntro": "规则通过匹配描述中的模式，为导入的交易指定类别。它们不会改动导入的数据：类别另外保存。“立即应用规则”会把每条规则重新应用到每笔交易。点击一条规则即可编辑。",
  "views.classify.applied_other": "规则已应用：更新了 {{count}} 笔交易。",
  "views.classify.searchRules": "搜索规则（模式、类别、子类别）…",
  "views.classify.patternLabel": "描述模式（正则表达式，不区分大小写）",
  "views.classify.matches_other": "{{count}} 条匹配",
  "views.classify.checking": "检查中…",
  "views.classify.patternPlaceholder": "例如：mr cooper|nationstar|rocket mortgage",
  "views.classify.category": "类别",
  "views.classify.subcategory": "子类别（{{count}}）",
  "views.classify.subcategoryCustom": "子类别（{{count}} + 自定义 {{custom}}）",
  "views.classify.select": "请选择…",
  "views.classify.amountFilter": "金额条件",
  "views.classify.any": "任意",
  "views.classify.amountValue": "金额",
  "views.classify.renameTo": "改名为（可选）",
  "views.classify.renamePlaceholder": "新的描述",
  "views.classify.updateRule": "更新规则",
  "views.classify.saveRule": "保存规则",
  "views.classify.noRules": "还没有规则。",
  "views.classify.ruleAmount": "金额 {{op}} {{value}}",
  "views.classify.ruleRename": "改名：“{{name}}”",
  "views.classify.customHeading": "自定义类别",
  "views.classify.newCategory": "+ 新类别",
  "views.classify.customIntro": "添加内置列表中没有的子类别。AI 分类器也会学会它们。",
  "views.classify.customCategoryPlaceholder": "例如：Personal",
  "views.classify.subcategoryLabel": "子类别",
  "views.classify.customSubPlaceholder": "例如：汽油",
  "views.classify.addCategory": "添加类别",
  "views.classify.noCustom": "没有自定义类别。内置类别能覆盖大多数情况。",
  "views.classify.errors": "分类错误",
  "views.classify.recent": "最近分类的",

  "views.donut.classified": "已分类",
  "views.donut.needsReview": "待复核",
  "views.donut.other": "其他",

  "views.reason.duplicateOf": "重复于",
  "views.reason.twin": "孪生",
  "views.reason.goTo": "跳转到交易 {{id}}",

  "views.summary.title": "已分类",
  "views.summary.about": "“已分类”显示 AI 分好类的交易：规则和 AI 指定税务类别之后的会计日记账。",
  "views.summary.count": "已分类 {{count}} 笔",
  "views.summary.noMatch": "没有符合此筛选的已分类交易。",

  "views.subscriptions.title": "订阅",
  "views.subscriptions.lede": "找出定期扣费和被遗忘的漏财之处",
  "views.subscriptions.scanning": "扫描中…",
  "views.subscriptions.rescan": "重新扫描",
  "views.subscriptions.scan": "扫描订阅",
  "views.subscriptions.phase.fetching": "正在加载交易…",
  "views.subscriptions.phase.analyzing": "正在查找定期规律…",
  "views.subscriptions.phase.enriching": "正在查找取消订阅的链接…",
  "views.subscriptions.working": "处理中…",
  "views.subscriptions.recurring": "定期订阅",
  "views.subscriptions.spent": "已花费合计（数据内）",
  "views.subscriptions.projected": "预计每年费用",
  "views.subscriptions.none": "没有发现定期订阅。很好！",
  "views.subscriptions.freq.daily": "每天",
  "views.subscriptions.freq.weekly": "每周",
  "views.subscriptions.freq.monthly": "每月",
  "views.subscriptions.freq.quarterly": "每季度",
  "views.subscriptions.freq.annual": "每年",
  "views.subscriptions.per.daily": "/天",
  "views.subscriptions.per.weekly": "/周",
  "views.subscriptions.per.monthly": "/月",
  "views.subscriptions.per.quarterly": "/季度",
  "views.subscriptions.per.annual": "/年",
  "views.subscriptions.perYear": "{{amount}}/年",
  "views.subscriptions.charges_other": "{{count}} 次扣费",
  "views.subscriptions.firstSeen": "首次出现：",
  "views.subscriptions.lastSeen": "最近出现：",
  "views.subscriptions.totalSpent": "花费合计：",
  "views.subscriptions.cancel": "取消 / 退订 →",
  "views.subscriptions.cancelVia": "通过 {{method}} 取消",
  "views.subscriptions.noCancelInfo": "没有取消订阅的信息",
  "views.subscriptions.emptyIntro": "扫描已导入的交易，找出定期订阅。",
  "views.subscriptions.emptyNote": "它能识别每天、每周、每月、每季度和每年的规律，并尽可能查找取消订阅的链接。",

  "views.advisor.title": "财务顾问",
  "views.advisor.lede": "关于 TaxSort 的用法，尽管问我",
  "views.advisor.whatToAsk": "我可以问什么？",
  "views.advisor.thinking": "思考中…",
  "views.advisor.placeholder": "向财务顾问提问…",
  "views.advisor.ask": "提问",
  "views.advisor.error": "错误：{{error}}",
  "views.advisor.you": "我",
  "views.advisor.prompt.1": "TaxSort 能为我做什么？",
  "views.advisor.prompt.2": "怎样导入我的银行交易？",
  "views.advisor.prompt.3": "Schedule A 和 Schedule C 有什么区别？",
  "views.advisor.prompt.4": "分类是怎么进行的？",
  "views.advisor.prompt.5": "导入 CSV 之后该做什么？",
  "views.advisor.prompt.6": "怎样和我的配偶共享会话？",
  "views.advisor.prompt.7": "导入的交易上标着“不明确”是什么意思？",
  "views.advisor.prompt.8": "我不同意某个分类，怎样改掉它？",
  "views.advisor.fact.1": "IRS 每年处理超过 1.5 亿份个人纳税申报表。",
  "views.advisor.fact.2": "美国税法超过 1 万页，相关法规又多出 8 万多页。",
  "views.advisor.fact.3": "家庭办公扣除每年能为自雇人士节省 1,500 美元以上。",
  "views.advisor.fact.4": "美国人每年在纳税申报上花费 65 亿小时。",
  "views.advisor.fact.5": "小企业主平均每年在税务上花 240 小时。",
  "views.advisor.fact.6": "Section 179 允许你在购买当年扣除合格设备的全部费用。",
  "views.advisor.fact.7": "2025 年的标准扣除额：单身申报 15,000 美元，已婚合并申报 30,000 美元。",
  "views.advisor.fact.8": "根据 IRC §274(n)，商务餐费可扣除 50%。2021-2022 年曾短暂可扣除 100%。",
  "views.advisor.fact.9": "SALT 扣除 10,000 美元的上限来自 2017 年的 Tax Cuts and Jobs Act。",
  "views.advisor.fact.10": "自雇税为 15.3%：其中 12.4% 用于 Social Security，2.9% 用于 Medicare。",
  "views.advisor.fact.11": "IRS 估计每年有 6,880 亿美元的税收缺口：应缴而未缴的税款。",
  "views.advisor.fact.12": "慈善捐赠最多可抵扣调整后总收入的 60%。",
  "views.advisor.fact.13": "美国第一次征收所得税是在 1861 年，用于支付南北战争的军费。",
  "views.advisor.fact.14": "据说爱因斯坦说过：“世界上最难理解的东西是所得税。”",
  "views.advisor.fact.15": "只有约 10% 的纳税人逐项列出扣除，其余的人都选择标准扣除。",
  "views.advisor.fact.16": "季度预估税的截止日期是 4 月 15 日、6 月 15 日、9 月 15 日和 1 月 15 日。",

  "views.researcher.title": "税法研究员",
  "views.researcher.lede": "查找 IRS 税法，精确到章节",
  "views.researcher.whatToResearch": "我可以查什么？",
  "views.researcher.researching": "查找中…",
  "views.researcher.placeholder": "询问 IRS 税法…",
  "views.researcher.research": "查找",
  "views.researcher.attributed": "据称出自 {{name}}",
  "views.researcher.prompt.1": "我能扣除家庭办公的网费吗？",
  "views.researcher.prompt.2": "扣除商务餐费有哪些规定？",
  "views.researcher.prompt.3": "SALT 扣除的上限是多少？由哪一条款规定？",
  "views.researcher.prompt.4": "我能在 Schedule C 上扣除健康保险费吗？",
  "views.researcher.prompt.5": "根据 IRC §170，什么算慈善捐赠？",
  "views.researcher.prompt.6": "医疗费用的 AGI 7.5% 门槛是什么？",
  "views.researcher.prompt.7": "开车去见客户的里程能扣除吗？",
  "views.researcher.prompt.8": "商用设备折旧有哪些规定？",
  "views.researcher.quote.misesBoom": "由信用扩张带来的繁荣，终将崩溃，无可避免。",
  "views.researcher.quote.hemingway": "治理不善的国家，第一剂万灵药是通货膨胀，第二剂是战争。",
  "views.researcher.quote.friedman": "通货膨胀是无需立法的征税。",
  "views.researcher.quote.morgan": "黄金才是货币，其他的都只是信用。",
  "views.researcher.quote.colbert": "征税的艺术在于拔鹅毛：拔得最多，鹅叫得最少。",
  "views.researcher.quote.bastiat": "国家是一个巨大的虚构，人人都想借它靠别人生活。",
  "views.researcher.quote.goldwater": "所得税制造的罪犯，比政府的任何其他举措都多。",
  "views.researcher.quote.parker": "想知道上帝怎么看待金钱，只要看看他把钱给了哪些人。",
  "views.researcher.quote.lenin": "摧毁资产阶级的办法，就是用税收和通货膨胀这两块磨盘去碾碎他们。",
  "views.researcher.quote.greenspan": "没有金本位，就无法保护储蓄免于被通货膨胀没收。",
  "views.researcher.quote.cicero": "预算应当平衡，国库应当充实，公共债务应当减少。",
  "views.researcher.quote.paul": "中央银行是一种社会主义，是货币和信用的社会化。",
  "views.researcher.quote.voltaire": "纸币终将回到它的内在价值：零。",
  "views.researcher.quote.galbraith": "在经济学的所有领域中，货币研究最常用复杂来掩盖真相或回避真相。",
  "views.researcher.quote.ammous": "法定货币是一切经济危机的首要原因。",
  "views.researcher.quote.gates": "比特币是一项技术杰作。",
  "views.researcher.quote.satoshi": "传统货币的根本问题，在于让它运转所需要的全部信任。",
  "views.researcher.quote.shaw": "抢彼得的钱去付给保罗的政府，总能得到保罗的支持。",

  "views.feedback.title": "反馈",
  "views.feedback.submitHeading": "提交反馈",
  "views.feedback.intro": "问题报告、功能需求和提问都作为 GitHub Issue 跟踪。你不需要 GitHub 账号。",
  "views.feedback.cat.feedback": "一般反馈",
  "views.feedback.cat.bug": "问题报告",
  "views.feedback.cat.feature": "功能需求",
  "views.feedback.cat.question": "提问",
  "views.feedback.titlePlaceholder": "简短概述…",
  "views.feedback.bodyPlaceholder": "描述问题、想法或疑问…",
  "views.feedback.submitting": "提交中…",
  "views.feedback.submit": "提交",
  "views.feedback.failed": "无法创建 Issue。",
  "views.feedback.recent": "最近的 Issue",
  "views.feedback.state.open": "未解决",
  "views.feedback.state.closed": "已关闭",
  "views.feedback.state.submitted": "已提交",
  "views.feedback.comments_other": "{{count}} 条评论",
  "views.feedback.none": "还没有反馈。",

  "views.settings.title": "设置",
  "views.settings.timeout": "自动锁定",
  "views.settings.timeoutIntro": "一段时间没有操作后锁定应用。解锁需要你的口令（登录时用的那个）。",
  "views.settings.minutes_other": "{{count}} 分钟",
  "views.settings.hour": "1 小时",
  "views.settings.never": "从不",
  "views.settings.current": "当前：{{value}}",
  "views.settings.noTimeout": "不锁定",
  "views.settings.currentSession": "当前会话",
  "views.settings.about": "关于",
  "views.settings.aboutWhat": "TaxSort MCP：面向 Schedule A 和 C 的交易分类器",
  "views.settings.aboutPowered": "由 Tollbooth DPYC · Neon Postgres · Claude AI 驱动",
  "views.settings.identity": "身份：",
  "views.settings.sharing": "共享：在多台设备上或多人之间使用同一个 npub。",

  "views.profile.heading": "个人资料",
  "views.profile.credit": "额度余额",
  "views.profile.timezone": "时区",
  "views.profile.timezoneNote": "保存在此设备上。",
  "views.profile.theme": "主题",
  "views.profile.light": "浅色",
  "views.profile.dark": "深色",
  "views.profile.system": "跟随系统",
  "views.profile.language": "语言",
  "views.profile.aiHeading": "AI 分类用量",
  "views.profile.aiNone": "还没有分类记录。",
  "views.profile.unknownModel": "未知",
  "views.profile.runs": "运行次数：",
  "views.profile.calls": "调用：",
  "views.profile.input": "输入：",
  "views.profile.output": "输出：",
  "views.profile.cost": "费用：",
  "views.profile.estimated": "Anthropic 预估费用",
  "views.profile.tokensAcross": "{{calls}} 次 API 调用，共 {{tokens}} 个 token",
  "views.profile.inSats": "折合 sats",
  "views.profile.sats": "{{count}} sats",
  "views.profile.atPrice": "按约 {{price}}/BTC 计",
  "views.profile.whyMatters": "<b>为什么重要：</b>TaxSort 用 Claude AI 为交易分类。运营方为这部分 AI 能力向 Anthropic 付费，再通过 Tollbooth 的 Lightning 小额支付把费用转给用户。",
  "views.profile.transparency": "你的通行额度用于支付 AI 的真实成本加上运营方的开销。你付的每一分钱都看得清清楚楚：没有隐藏加价，没有订阅陷阱。",

  "views.privacy.body": `# TaxSort 隐私政策

## Don't Pester Your Customer™ (DPYC™)

TaxSort 建立在 **DPYC™ 理念**之上，和软件通常对待用户的方式截然不同。核心原则很简单：*你的身份，你的数据，你的钱，你说了算。*

常见的 SaaS 产品还没让你试用，就要你的姓名、邮箱、电话、雇主、地址和银行卡。它们把你的数据卖给数据商，分享给“合作伙伴”，再用故意难以取消的订阅把你套牢。它们用邮件、推送通知和各种诱导设计骚扰你，只为用最少的价值榨取最多的收入。

**DPYC™ 拒绝这一切。**

---

## 不要账户。不要邮箱。不要 KYC。

TaxSort **完全不知道你的真实身份。**我们从不索取你的：

- ❌ 姓名
- ❌ 邮箱地址
- ❌ 电话号码
- ❌ 住址
- ❌ 社会安全号码
- ❌ 政府签发的证件
- ❌ 信用卡
- ❌ 银行账户

这里**没有注册账户，没有注册表单，没有密码。**没有可被入侵的东西，没有可泄露的东西，也没有可被传票索取的东西。

---

## Nostr 密钥：你自主的身份

你在 TaxSort 中的身份是一对 **Nostr 密钥**：一把公钥和一把私钥，由你自己在自己的设备上生成，无需任何人许可。

### 你的 npub（公钥）
- 一串以 \`npub1...\` 开头的 bech32 编码字符串
- 可以放心分享：TaxSort 靠它找到你的会话和数据
- 把它想成信箱地址：别人能往里投信，但只有你能打开

### 你的 nsec（私钥）
- 一串以 \`nsec1...\` 开头的 bech32 编码字符串
- **从不离开你的设备。**TaxSort 从不索取、从不查看、从不保存它
- 用来给 Nostr 消息签名，证明你拥有对应的 npub
- 把它想成信箱的钥匙：拿着它就证明信箱是你的

### 为什么用 Nostr 密钥？
- **自主：**由你生成。没有任何机构能授予或吊销。
- **可携带：**任何 Nostr 应用都能用，不绑定 TaxSort。
- **密码学保障：**基于 secp256k1 椭圆曲线（和比特币相同），无法伪造。
- **化名：**与数学绑定，而不是与政府登记绑定。

---

## Secure Courier：不分享秘密也能证明所有权

你第一次使用 TaxSort 时，我们通过 **Secure Courier**（一次加密的 Nostr 私信往来）确认 npub 属于你：

1. TaxSort 向你的 npub 发送一条 Nostr 私信
2. 你用自己选的任意口令回复
3. 你的回复**由你的 nsec 签名**（你的 Nostr 客户端会自动完成）
4. 签名证明 npub 属于你，而你的 nsec 始终不会暴露

这是一种**零知识身份证明。**我们知道有人持有这个 npub 的私钥，除此之外对这个人一无所知。

### 你的口令保护你的数据
你在验证时选的口令，用来派生数据库中税务数据的加密密钥。这意味着：

- 你的交易描述、金额和分类在存储时都是加密的
- 加密密钥来自*你的*口令：不是我们选的
- 如果你忘了口令，数据就无法找回（这是有意的设计）

---

## 自动锁定与解锁

TaxSort 在一段时间无操作后会自动锁定，时间可以设置（默认 15 分钟）。解锁方法：

1. TaxSort 向你的 npub 发送一条 Nostr 私信
2. 你回复 "Approve Unlock"
3. 你签名的回复证明坐在键盘前的仍然是你

这样，走到你未锁定设备前的人也拿不到你的税务数据。解锁需要**你的 nsec**（通过你的 Nostr 客户端），而不是可能被猜中或被偷看的密码。

---

## 比特币 Lightning：不经支付机构的付款

TaxSort 通过 Tollbooth DPYC™ 协议，用**比特币 Lightning 小额支付**收费。这意味着：

- **不需要信用卡。**没有 Stripe，没有 PayPal：没有任何支付机构知道你在用 TaxSort。
- **没有订阅。**你预存额度余额，按每次工具调用付费。随时可以停止。
- **没有退款手续。**未用完的额度 7 天内不会过期。没有自动续费。
- **没有支付监控。**Lightning 付款点对点直达。银行流水里不会出现“TaxSort”。
- **即时到账。**额度几秒钟就到，而不是几天。

### DPYC™ 社会契约
TaxSort 是 [DPYC™ 社会契约](https://github.com/lonniev/dpyc-community)的一员。这是一个由各自独立运营的 MCP 服务组成、共享这些原则的网络。每个运营方运行自己的服务器、自己定价，并对自己的用户负责。没有中央机构，没有平台抽成，没有应用商店分成。

---

## 我们存储什么

| 数据 | 存放位置 | 是否加密 | 谁能读取 |
|------|-------|-----------|-----------------|
| 你的 npub | Neon Postgres | 否（它是公开的） | 运营方 |
| 验证状态 | Neon Postgres | 否 | 运营方 |
| 口令哈希 | Neon Postgres | 单向哈希 | 任何人都不能 |
| 税务会话 | Neon Postgres | 存储时加密 | 运营方 + 你 |
| 交易 | Neon Postgres | 存储时加密 | 运营方 + 你 |
| 分类 | Neon Postgres | 存储时加密 | 运营方 + 你 |
| 额度余额 | Neon Postgres | 加密 | 运营方 |
| Lightning 发票 | BTCPay Server | BTCPay 加密 | 运营方 |

**我们不存储：**你的 nsec、真实姓名、邮箱、IP 地址（路由由 Cloudflare 处理）、浏览器指纹，也不存储任何分析或遥测数据。

---

## 我们发送给 Claude AI 的内容

当你使用分类功能或 AI 顾问时，你的交易描述和金额会发送到 Anthropic 的 Claude API 进行分类。这意味着：

- Anthropic 只短暂处理你的交易文本，不会替我们保存
- 适用 Anthropic 的[数据保留政策](https://www.anthropic.com/privacy)
- 我们只发送必要的上下文（日期、描述、金额、账户）
- 我们**不会**把你的 npub、口令或任何能识别你的信息发给 Anthropic

---

## 我们绝不会做的事

- 🚫 出售你的数据
- 🚫 把你的数据分享给广告商
- 🚫 要求政府签发的证件
- 🚫 向任何机构报告（我们不知道你是谁）
- 🚫 给你发营销邮件（我们没有你的邮箱）
- 🚫 自动续订（根本没有订阅）
- 🚫 把你锁在数据之外（数据绑定在你掌控的 npub 上）
- 🚫 让你难以离开（随时导出数据，随时删除会话）

---

## 开源，可审计

TaxSort 的源代码是公开的：

- **MCP 服务器：**[github.com/lonniev/taxsort-mcp](https://github.com/lonniev/taxsort-mcp)
- **Tollbooth SDK：**[github.com/lonniev/tollbooth-dpyc](https://github.com/lonniev/tollbooth-dpyc)
- **许可证：**Apache 2.0

你可以准确核查收集了哪些数据、如何存储、发往何处。没有隐藏的分析，没有跟踪像素，没有第三方脚本。

---

*Don't Pester Your Customer™：因为你的税务数据只关你自己的事。*

*灵感来自诺顿·贾斯特的《[The Phantom Tollbooth](https://en.wikipedia.org/wiki/The_Phantom_Tollbooth)》（1961）。*
`,

  "lib.mcp.unknownError": "未知错误",
  "lib.classify.noKey": "没有可用的 Anthropic API 密钥。",
  "lib.classify.parseFailed": "第 {{round}} 轮：无法读取 AI 的回答",
  "lib.classify.outOfCredits": "AI 分类服务的额度已用完。请让 TaxSort 的运营方为其 Anthropic API 余额充值。",
  "lib.subscriptions.failed": "订阅扫描失败",
};

export default zh;
