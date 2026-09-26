// TaxSort's stone and amber for the account pieces @tollbooth-dpyc/web draws.

import type {
  AccountPageClassNames,
  SiteNavClassNames,
  ThemeToggleClassNames,
  UsageSummaryClassNames,
} from "@tollbooth-dpyc/web/react";

/// The statement card, on Wallet and Profile alike.
export const usageClassNames: UsageSummaryClassNames = {
  root: "bg-white border border-stone-200 rounded-xl p-6 mb-6",
  header: "flex items-center justify-between mb-4",
  heading: "text-xs font-semibold text-stone-400 uppercase tracking-wider",
  chip: "text-xs text-stone-400 hover:text-stone-700 border border-stone-200 px-2 py-1 rounded",
  // Balance leads, large, as the card's old headline figure.
  figures:
    "grid grid-cols-3 sm:grid-cols-4 gap-3 text-center items-end [&>div:first-child>div:first-child]:text-2xl [&>div:first-child>div:first-child]:font-bold",
  figure: "flex flex-col-reverse",
  value: "text-sm font-mono text-stone-800",
  label: "text-xs text-stone-400",
  subheading: "text-xs text-stone-400 mt-5 mb-2",
  row: "flex items-center gap-3 py-2 text-xs border-b border-stone-100 last:border-b-0 [&>span:first-child]:flex-1 [&>span:first-child]:truncate",
  tool: "font-mono text-stone-600",
  calls: "text-stone-400",
  sats: "font-mono text-amber-700",
  loading: "text-xs text-stone-400",
  error: "text-xs text-red-600",
  empty: "text-xs text-stone-400 mt-4",
};

const cardLabel = "text-xs font-semibold text-stone-400 uppercase tracking-wider";

/// Profile: TaxSort's white cards with the small-caps label over each.
export const accountPageClassNames: AccountPageClassNames = {
  root: "w-[85%] mx-auto space-y-6",
  heading: "text-xl font-semibold text-stone-800",
  section: "bg-white border border-stone-200 rounded-xl p-5",
  sectionHeading: `${cardLabel} mb-3`,
  sectionNote: "text-xs text-stone-400 mt-2",
};

/// A choice chip, as Settings drew the session-timeout picks.
export const themeToggleClassNames: ThemeToggleClassNames = {
  root: "flex flex-wrap gap-2",
  chip: "text-sm px-4 py-2 rounded-lg border transition-colors border-stone-200 text-stone-500 hover:border-stone-300",
  active: "!bg-amber-100 !border-amber-400 !text-amber-800 font-medium",
};

const tab =
  "px-2.5 py-1.5 rounded text-sm font-medium transition-colors whitespace-nowrap text-stone-500 hover:text-stone-900 hover:bg-stone-100";
const row = "px-3 text-sm text-stone-600 hover:bg-stone-50 transition-colors";

/// The top bar: amber for the current page, the account menu as before.
export const navClassNames: SiteNavClassNames = {
  root: "relative bg-white border-b border-stone-200 px-4 py-1.5 flex items-center gap-1",
  nav: "flex-1 min-w-0",
  list: "flex items-center gap-1 flex-wrap",
  item: tab,
  active: "!bg-amber-100 !text-amber-800",
  icon: "mr-1",
  end: "ml-auto flex items-center",
  toggle: "inline-flex items-center justify-center rounded text-stone-500 hover:text-stone-900 hover:bg-stone-100",
  menu: "absolute left-0 right-0 top-full z-40 bg-white border-b border-stone-200 shadow-lg p-2 space-y-0.5",
  menuItem: `rounded ${tab}`,
  account: "relative",
  accountButton: "flex items-center justify-center rounded-full hover:bg-stone-100",
  accountMenu: "absolute right-0 top-full mt-1 w-56 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden z-40",
  accountHeader: "px-3 py-2 border-b border-stone-100 bg-stone-50",
  accountHeading: "text-xs text-stone-400",
  accountNpub: "text-xs font-mono text-stone-600 truncate",
  accountLink: `${row} aria-[current=page]:bg-amber-50 aria-[current=page]:text-amber-800`,
  signOut: `w-full text-left ${row} hover:bg-red-50 hover:text-red-600`,
};
