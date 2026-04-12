import { useState, useEffect, useMemo } from "react";
import { useSession } from "../App";
import { useToolCall } from "./useMCP";

const CATEGORIES = [
  "Schedule C", "Schedule A", "Internal Transfer", "Personal", "Duplicate",
];

const CAT_SUBS: Record<string, string[]> = {
  "Schedule C": [
    "Advertising & Marketing", "Business Meals (50%)", "Business Software & Subscriptions",
    "Home Office Utilities", "Office Supplies", "Phone & Internet", "Professional Services",
    "Travel & Transportation", "Vehicle Expenses", "Other Business Expense",
  ],
  "Schedule A": [
    "Charitable Contributions", "Medical & Dental", "Mortgage Interest",
    "Property Tax", "State & Local Tax", "Other Itemized Deduction",
  ],
  "Internal Transfer": [
    "Internal Transfer", "Credit Card Payment", "Savings Transfer",
    "Investment Transfer", "Loan Payment",
  ],
  "Personal": [
    "Income", "Salary", "Bonus", "Tax Refund",
    "Auto Insurance", "Home Insurance", "Life Insurance", "Health Insurance",
    "Groceries", "Dining Out", "Clothing",
    "Personal Care", "Entertainment", "Streaming & Subscriptions",
    "Gym & Fitness", "Pet Care", "Childcare",
    "Utilities (Personal)", "Rent", "Auto Loan", "Student Loan",
    "Cash & ATM", "Shopping", "Gifts",
    "Education", "Travel (Personal)", "Other Personal",
  ],
  "Duplicate": ["Duplicate"],
};

interface CustomCat {
  id: number;
  category: string;
  subcategory: string;
}

/**
 * Shared hook for categories + subcategories, merging built-in with custom.
 * Custom categories are fetched from the server on mount.
 */
export function useCategories() {
  const { npub } = useSession();
  const customCatsTool = useToolCall<{ categories: CustomCat[] }>("get_custom_categories");
  const [customCats, setCustomCats] = useState<CustomCat[]>([]);

  async function loadCustomCats() {
    const data = await customCatsTool.invoke({ npub });
    if (data?.categories) setCustomCats(data.categories);
  }

  useEffect(() => {
    if (npub) loadCustomCats();
  }, [npub]);

  const { allCategories, allCatSubs } = useMemo(() => {
    const merged: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(CAT_SUBS)) {
      merged[k] = [...v];
    }
    for (const c of customCats) {
      if (!merged[c.category]) merged[c.category] = [];
      if (!merged[c.category].includes(c.subcategory)) {
        merged[c.category].push(c.subcategory);
      }
    }
    for (const k of Object.keys(merged)) {
      merged[k].sort((a, b) => a.localeCompare(b));
    }
    const cats = [...new Set([...CATEGORIES, ...customCats.map(c => c.category)])].sort((a, b) => a.localeCompare(b));
    return { allCategories: cats, allCatSubs: merged };
  }, [customCats]);

  return { allCategories, allCatSubs, customCats, loadCustomCats };
}
