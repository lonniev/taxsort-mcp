import { useEffect, useState, useRef } from "react";
import { useSession } from "../App";
import { useClassify } from "../hooks/useClassify";
import type { Rule } from "../hooks/useClassify";
import { useToolCall } from "../hooks/useMCP";
import { useCategories } from "../hooks/useCategories";
import DonutChart from "./DonutChart";

interface ResetResult {
  classifications_deleted: number;
}

interface RulesResult {
  rules: Rule[];
}

interface SaveRuleResult {
  id: number;
}

interface ApplyResult {
  updated: number;
}

// Categories come from useCategories() hook (built-in + custom, alpha-sorted)

const AMOUNT_OPS = [
  { value: "", label: "Any" },
  { value: "eq", label: "=" },
  { value: "lt", label: "<" },
  { value: "lte", label: "<=" },
  { value: "gt", label: ">" },
  { value: "gte", label: ">=" },
];

export default function ClassifyPage() {
  const { sessionId, npub } = useSession();
  const { state, classify, pause, resume, refreshCounts } = useClassify(sessionId, npub);
  const resetTool = useToolCall<ResetResult>("reset_classifications");
  const rulesTool = useToolCall<RulesResult>("get_rules");
  const saveRuleTool = useToolCall<SaveRuleResult>("save_rule");
  const deleteRuleTool = useToolCall<unknown>("delete_rule");
  const applyRulesTool = useToolCall<ApplyResult>("apply_rules");
  const matchCountTool = useToolCall<{ matches: number; error?: string }>("count_rule_matches");
  const saveCatTool = useToolCall<{ category: string; subcategory: string }>("save_custom_category");
  const deleteCatTool = useToolCall<unknown>("delete_custom_category");
  const { allCategories, allCatSubs, customCats, loadCustomCats } = useCategories();

  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const [rules, setRules] = useState<Rule[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [applyMsg, setApplyMsg] = useState<string | null>(null);

  const [showCatForm, setShowCatForm] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [newSub, setNewSub] = useState("");

  const [ruleSearch, setRuleSearch] = useState("");
  const [matchCount, setMatchCount] = useState<number | null>(null);
  const [matchError, setMatchError] = useState<string | null>(null);

  // New/edit rule form state
  const [formPattern, setFormPattern] = useState("");
  const [formCategory, setFormCategory] = useState("Personal");
  const [formSubcategory, setFormSubcategory] = useState("");
  const [formAmountOp, setFormAmountOp] = useState("");
  const [formAmountVal, setFormAmountVal] = useState("");
  const [formNewDesc, setFormNewDesc] = useState("");
  const [editingRuleId, setEditingRuleId] = useState<number | null>(null);

  const { phase, total, classified, errors, recentUpdates, usage } = state;
  const needsReview = Math.max(0, total - classified);
  const pct = total > 0 ? Math.min(100, Math.round((classified / total) * 100)) : 0;

  async function loadRules() {
    if (!sessionId) return;
    const data = await rulesTool.invoke({ session_id: sessionId, npub });
    if (data?.rules) setRules(data.rules);
  }

  useEffect(() => {
    if (sessionId) {
      refreshCounts();
      loadRules();
    }
  }, [sessionId]);

  async function handleSaveRule() {
    if (!sessionId || !formPattern || !formCategory || !formSubcategory) return;
    // If editing, delete old rule first
    if (editingRuleId !== null) {
      await deleteRuleTool.invoke({ rule_id: editingRuleId, npub });
    }
    const data = await saveRuleTool.invoke({
      session_id: sessionId,
      description_pattern: formPattern,
      category: formCategory,
      subcategory: formSubcategory,
      amount_operator: formAmountOp || "",
      amount_value: formAmountOp && formAmountVal ? parseFloat(formAmountVal) : null,
      new_description: formNewDesc || "",
      npub,
    });
    if (data) {
      clearForm();
      loadRules();
    }
  }

  function clearForm() {
    setFormPattern("");
    setFormCategory("Personal");
    setFormSubcategory("");
    setFormAmountOp("");
    setFormAmountVal("");
    setFormNewDesc("");
    setEditingRuleId(null);
    setShowForm(false);
    setMatchCount(null);
    setMatchError(null);
  }

  // Debounced match count preview
  const matchTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (!formPattern || !sessionId || !showForm) { setMatchCount(null); setMatchError(null); return; }
    clearTimeout(matchTimer.current);
    matchTimer.current = setTimeout(async () => {
      const result = await matchCountTool.invoke({
        session_id: sessionId, npub,
        description_pattern: formPattern,
        amount_operator: formAmountOp || "",
        amount_value: formAmountOp && formAmountVal ? parseFloat(formAmountVal) : null,
      });
      if (result) {
        setMatchCount(result.matches);
        setMatchError(result.error ?? null);
      }
    }, 500);
    return () => clearTimeout(matchTimer.current);
  }, [formPattern, formAmountOp, formAmountVal, sessionId, showForm]);

  function editRule(r: Rule) {
    setFormPattern(r.description_pattern);
    setFormCategory(r.category);
    setFormSubcategory(r.subcategory);
    setFormAmountOp(r.amount_operator || "");
    setFormAmountVal(r.amount_value != null ? String(r.amount_value) : "");
    setFormNewDesc(r.new_description || "");
    setEditingRuleId(r.id);
    setShowForm(true);
  }

  async function handleDeleteRule(id: number) {
    await deleteRuleTool.invoke({ rule_id: id, npub });
    if (editingRuleId === id) clearForm();
    loadRules();
  }

  async function handleSaveCat() {
    if (!newCat || !newSub) return;
    await saveCatTool.invoke({ category: newCat, subcategory: newSub, npub });
    setNewCat("");
    setNewSub("");
    setShowCatForm(false);
    loadCustomCats();
  }

  async function handleDeleteCat(id: number) {
    await deleteCatTool.invoke({ category_id: id, npub });
    loadCustomCats();
  }

  async function handleApplyRules() {
    if (!sessionId) return;
    setApplyMsg(null);
    const data = await applyRulesTool.invoke({ session_id: sessionId, npub });
    if (data) {
      setApplyMsg(`Applied rules: ${data.updated} transactions updated.`);
      refreshCounts();
    }
  }

  const subs = allCatSubs[formCategory] ?? [];

  return (
    <div className="w-[85%] mx-auto">
      <h1 className="text-xl font-semibold mb-6 text-stone-800">Categorize</h1>

      {/* Status card */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-8">
          <DonutChart total={total} classified={classified} needsReview={needsReview} />

          <div className="flex-1 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-xs text-stone-400">Total</div>
                <div className="text-lg font-mono font-semibold text-stone-800">{total}</div>
              </div>
              <div>
                <div className="text-xs text-stone-400">Categorized</div>
                <div className="text-lg font-mono font-semibold text-amber-700">{classified}</div>
              </div>
              <div>
                <div className="text-xs text-stone-400">Uncategorized</div>
                <div className="text-lg font-mono font-semibold text-red-500">{needsReview}</div>
              </div>
            </div>

            <div>
              <div className="w-full bg-stone-100 rounded-full h-2">
                <div
                  className="bg-amber-500 h-2 rounded-full transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="text-xs text-stone-400 mt-1">
                {phase === "running" && "Categorizing\u2026"}
                {phase === "paused" && "Paused"}
                {phase === "complete" && "Complete"}
                {phase === "idle" && (total === 0 ? "Import transactions first" : "Ready to categorize")}
                {phase === "error" && "Error occurred"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* API Usage */}
      {usage.calls > 0 && (
        <div className="bg-stone-50 border border-stone-200 rounded-xl px-5 py-3 mb-5 flex items-center gap-6 text-xs">
          <span className="text-stone-400">AI usage:</span>
          <span className="font-mono text-stone-600">{usage.calls} calls</span>
          <span className="font-mono text-stone-600">{usage.input_tokens.toLocaleString()} in</span>
          <span className="font-mono text-stone-600">{usage.output_tokens.toLocaleString()} out</span>
          <span className="font-mono text-stone-600">{(usage.input_tokens + usage.output_tokens).toLocaleString()} total tokens</span>
          {usage.model && <span className="text-stone-400">{usage.model}</span>}
        </div>
      )}

      {/* Actions */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 mb-6">
        <div className="flex items-start gap-6">
          <div className="flex-1">
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
              Run Claude AI Categorization
            </div>
            <p className="text-xs text-stone-500 mb-3">
              Categorizes uncategorized transactions using Claude directly from your browser.
              Rules are applied first, then AI categorizes the rest.
            </p>

            {(phase === "idle" || phase === "error" || phase === "complete") && total > 0 && (
              <div className="flex flex-wrap items-center gap-3">
                {needsReview > 0 && (
                  <button
                    onClick={() => classify(false)}
                    className="bg-amber-600 text-white text-sm px-6 py-2.5 rounded-lg hover:bg-amber-500 transition-colors"
                  >
                    Categorize {needsReview} Uncategorized
                  </button>
                )}
                {needsReview === 0 && (
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm text-green-700">All classified</span>
                  </div>
                )}
                <button
                  onClick={() => {
                    if (confirm(
                      `Recategorize all ${total} transactions?\n\n` +
                      `This re-runs Claude AI on every transaction, including previously categorized ` +
                      `and manually edited ones. Use this when rules have been improved.`
                    )) {
                      classify(true);
                    }
                  }}
                  className="text-xs border border-amber-300 text-amber-700 px-4 py-2 rounded-lg hover:bg-amber-50 transition-colors"
                >
                  Recategorize All ({total})
                </button>
                <button
                  onClick={async () => {
                    if (!sessionId) return;
                    if (!confirm("Delete all categorizations? Transactions will be kept.")) return;
                    setResetMsg(null);
                    const r = await resetTool.invoke({ session_id: sessionId, npub });
                    if (r) {
                      setResetMsg(`Cleared ${r.classifications_deleted} classifications.`);
                      refreshCounts();
                    }
                  }}
                  disabled={resetTool.loading}
                  className="text-xs border border-stone-200 text-stone-500 px-4 py-2 rounded-lg hover:bg-stone-50 transition-colors"
                >
                  {resetTool.loading ? "Clearing\u2026" : "Reset All Categories"}
                </button>
              </div>
            )}

            {(phase === "idle" || phase === "error") && total === 0 && (
              <span className="text-xs text-stone-400">Import transactions first.</span>
            )}

            {phase === "running" && (
              <button
                onClick={pause}
                className="bg-stone-600 text-white text-sm px-6 py-2.5 rounded-lg hover:bg-stone-500 transition-colors"
              >
                Pause Categorization
              </button>
            )}

            {phase === "paused" && (
              <div className="space-y-2">
                <button
                  onClick={resume}
                  className="bg-amber-600 text-white text-sm px-6 py-2.5 rounded-lg hover:bg-amber-500 transition-colors"
                >
                  Resume Categorization
                </button>
                <div className="text-xs text-stone-400">Paused at {pct}%</div>
              </div>
            )}
          </div>

          <div className="border-l border-stone-100 pl-6">
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
              Refresh Stats
            </div>
            <button
              onClick={refreshCounts}
              className="text-xs text-stone-500 hover:text-stone-700 border border-stone-200 px-3 py-1.5 rounded-lg"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {resetMsg && (
        <div className="text-xs text-stone-500 mb-4">{resetMsg}</div>
      )}

      {/* Classification Rules */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
            Categorization Rules
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleApplyRules}
              disabled={applyRulesTool.loading || rules.length === 0}
              className="text-xs text-blue-600 hover:text-blue-800 border border-blue-200 px-3 py-1 rounded hover:bg-blue-50 disabled:opacity-40 transition-colors"
            >
              {applyRulesTool.loading ? "Applying\u2026" : "Apply Rules Now"}
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="text-xs text-stone-500 hover:text-stone-700 border border-stone-200 px-3 py-1 rounded hover:bg-stone-50 transition-colors"
            >
              {showForm ? "Cancel" : "+ New Rule"}
            </button>
          </div>
        </div>

        <p className="text-xs text-stone-400 mb-3">
          Rules assign categories to imported transactions by matching description patterns. They do not alter the imported data — categories are stored separately. "Apply Rules Now" re-runs all rules against all transactions. Click a rule to edit it.
        </p>

        {applyMsg && (
          <div className="text-xs text-blue-600 mb-3">{applyMsg}</div>
        )}

        {/* Rule search */}
        {rules.length > 5 && (
          <input
            className="w-full text-xs border border-stone-200 rounded-lg px-3 py-1.5 bg-stone-50 mb-3 font-mono focus:outline-none focus:border-stone-400"
            placeholder="Search rules (pattern, category, subcategory)..."
            value={ruleSearch}
            onChange={e => setRuleSearch(e.target.value)}
          />
        )}

        {/* New rule form */}
        {showForm && (
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 mb-4 space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-stone-500">Description pattern (regex, case-insensitive)</label>
                {matchCount !== null && !matchError && (
                  <span className={`text-xs font-mono ${matchCount > 0 ? "text-green-600" : "text-stone-400"}`}>
                    {matchCount} match{matchCount !== 1 ? "es" : ""}
                  </span>
                )}
                {matchError && <span className="text-xs text-red-500">{matchError}</span>}
                {matchCountTool.loading && <span className="text-xs text-stone-400">checking&hellip;</span>}
              </div>
              <input
                value={formPattern}
                onChange={e => setFormPattern(e.target.value)}
                placeholder="e.g. mr cooper|nationstar|rocket mortgage"
                className="w-full text-sm border border-stone-200 rounded px-3 py-1.5 bg-white focus:outline-none focus:border-stone-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-stone-500 block mb-1">Category</label>
                <select
                  value={formCategory}
                  onChange={e => { setFormCategory(e.target.value); setFormSubcategory(""); }}
                  className="w-full text-sm border border-stone-200 rounded px-2 py-1.5 bg-white"
                >
                  {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-stone-500 block mb-1">Subcategory ({subs.length}{customCats.length > 0 ? ` + ${customCats.filter(c => c.category === formCategory).length} custom` : ""})</label>
                <select
                  value={formSubcategory}
                  onChange={e => setFormSubcategory(e.target.value)}
                  className="w-full text-sm border border-stone-200 rounded px-2 py-1.5 bg-white"
                >
                  <option value="">Select...</option>
                  {subs.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-stone-500 block mb-1">Amount filter</label>
                <select
                  value={formAmountOp}
                  onChange={e => setFormAmountOp(e.target.value)}
                  className="w-full text-sm border border-stone-200 rounded px-2 py-1.5 bg-white"
                >
                  {AMOUNT_OPS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-stone-500 block mb-1">Amount value</label>
                <input
                  type="number"
                  value={formAmountVal}
                  onChange={e => setFormAmountVal(e.target.value)}
                  disabled={!formAmountOp}
                  placeholder="0.00"
                  className="w-full text-sm border border-stone-200 rounded px-3 py-1.5 bg-white disabled:opacity-40"
                />
              </div>
              <div>
                <label className="text-xs text-stone-500 block mb-1">Rename to (optional)</label>
                <input
                  value={formNewDesc}
                  onChange={e => setFormNewDesc(e.target.value)}
                  placeholder="New description"
                  className="w-full text-sm border border-stone-200 rounded px-3 py-1.5 bg-white"
                />
              </div>
            </div>
            <button
              onClick={handleSaveRule}
              disabled={!formPattern || !formSubcategory || saveRuleTool.loading}
              className="bg-stone-900 text-white text-xs px-4 py-2 rounded-lg hover:bg-stone-700 disabled:opacity-40 transition-colors"
            >
              {saveRuleTool.loading ? "Saving\u2026" : (editingRuleId !== null ? "Update Rule" : "Save Rule")}
            </button>
          </div>
        )}

        {/* Rules list */}
        {rules.length === 0 && !showForm && (
          <div className="text-xs text-stone-400 italic">No rules defined yet.</div>
        )}
        {rules.length > 0 && (
          <div className="space-y-2">
            {rules.filter(r => {
              if (!ruleSearch) return true;
              const q = ruleSearch.toLowerCase();
              return r.description_pattern.toLowerCase().includes(q)
                || r.category.toLowerCase().includes(q)
                || r.subcategory.toLowerCase().includes(q)
                || (r.new_description ?? "").toLowerCase().includes(q);
            }).map(r => (
              <div key={r.id} onClick={() => editRule(r)} className="flex items-center gap-3 bg-stone-50 border border-stone-100 rounded-lg px-3 py-2 text-xs cursor-pointer hover:border-stone-300 transition-colors">
                <div className="flex-1 min-w-0">
                  <span className="font-mono text-stone-600">/{r.description_pattern}/i</span>
                  {r.amount_operator && (
                    <span className="text-stone-400 ml-2">
                      amount {r.amount_operator} {r.amount_value}
                    </span>
                  )}
                  <span className="text-stone-400 mx-1">&rarr;</span>
                  <span className="text-amber-700 font-medium">{r.category}</span>
                  <span className="text-stone-400 mx-1">/</span>
                  <span className="text-stone-600">{r.subcategory}</span>
                  {r.new_description && (
                    <span className="text-blue-600 ml-2">rename: &ldquo;{r.new_description}&rdquo;</span>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteRule(r.id)}
                  disabled={deleteRuleTool.loading}
                  className="text-stone-300 hover:text-red-500 transition-colors flex-shrink-0"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Custom Categories */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
            Custom Categories
          </div>
          <button
            onClick={() => setShowCatForm(!showCatForm)}
            className="text-xs text-stone-500 hover:text-stone-700 border border-stone-200 px-3 py-1 rounded hover:bg-stone-50 transition-colors"
          >
            {showCatForm ? "Cancel" : "+ New Category"}
          </button>
        </div>

        <p className="text-xs text-stone-400 mb-3">
          Add subcategories that don't exist in the built-in list. These are included in the AI categorizer's vocabulary.
        </p>

        {showCatForm && (
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-stone-500 block mb-1">Category</label>
                <input
                  value={newCat}
                  onChange={e => setNewCat(e.target.value)}
                  list="cat-suggestions"
                  placeholder="e.g. Personal"
                  className="w-full text-sm border border-stone-200 rounded px-3 py-1.5 bg-white focus:outline-none focus:border-stone-400"
                />
                <datalist id="cat-suggestions">
                  {allCategories.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
              <div>
                <label className="text-xs text-stone-500 block mb-1">Subcategory</label>
                <input
                  value={newSub}
                  onChange={e => setNewSub(e.target.value)}
                  placeholder="e.g. Auto Gas"
                  className="w-full text-sm border border-stone-200 rounded px-3 py-1.5 bg-white focus:outline-none focus:border-stone-400"
                />
              </div>
            </div>
            <button
              onClick={handleSaveCat}
              disabled={!newCat || !newSub || saveCatTool.loading}
              className="bg-stone-900 text-white text-xs px-4 py-2 rounded-lg hover:bg-stone-700 disabled:opacity-40 transition-colors"
            >
              {saveCatTool.loading ? "Saving\u2026" : "Add Category"}
            </button>
          </div>
        )}

        {customCats.length === 0 && !showCatForm && (
          <div className="text-xs text-stone-400 italic">No custom categories. Built-in categories cover most cases.</div>
        )}
        {customCats.length > 0 && (
          <div className="space-y-1">
            {customCats.map(c => (
              <div key={c.id} className="flex items-center gap-3 bg-stone-50 border border-stone-100 rounded-lg px-3 py-1.5 text-xs">
                <span className="text-amber-700 font-medium">{c.category}</span>
                <span className="text-stone-400">/</span>
                <span className="text-stone-600 flex-1">{c.subcategory}</span>
                <button
                  onClick={() => handleDeleteCat(c.id)}
                  disabled={deleteCatTool.loading}
                  className="text-stone-300 hover:text-red-500 transition-colors"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2">
            Categorization errors
          </div>
          {errors.map((e, i) => (
            <div key={i} className="text-xs text-red-700 mb-1">{e}</div>
          ))}
        </div>
      )}

      {/* Recent updates */}
      {recentUpdates.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-stone-50 text-xs font-semibold text-stone-400 uppercase tracking-wider">
            Recently categorized
          </div>
          <div className="divide-y divide-stone-100">
            {recentUpdates.slice(0, 20).map((u) => (
              <div key={u.id} className="px-4 py-2 flex items-center gap-3 text-xs">
                <span className="font-mono text-stone-400 truncate max-w-32">{u.merchant || u.id}</span>
                <span className="text-amber-700 font-medium">{u.category}</span>
                {u.subcategory && u.subcategory !== u.category && (
                  <span className="text-stone-400">{u.subcategory}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
