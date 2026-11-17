/** The grouping and sorting choices Transactions and Categorized share. */

import type { Translate } from "../i18n";

/** Each group-by value the server takes, with its name in the reader's language. */
export const groupOptions = (t: Translate): [string, string][] => [
  ["none", t("views.table.groupNone")],
  ["category", t("views.table.groupCategory")],
  ["subcategory", t("views.table.groupSubcategory")],
  ["taxline", t("views.table.groupTaxLine")],
  ["month", t("views.table.groupMonth")],
  ["account", t("views.table.groupAccount")],
  ["merchant", t("views.table.groupMerchant")],
  ["month+category", t("views.table.groupMonthCategory")],
  ["category+subcategory", t("views.table.groupCategorySub")],
];

/** Each sort column the server takes, with its name in the reader's language. */
export const sortOptions = (t: Translate): [string, string][] => [
  ["date", t("views.table.date")],
  ["description", t("views.table.description")],
  ["amount", t("views.table.amount")],
  ["account", t("views.table.account")],
  ["category", t("views.table.category")],
];
