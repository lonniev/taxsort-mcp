import React from "react";
import ReactDOM from "react-dom/client";
import { configureTollbooth } from "@tollbooth-dpyc/web";
import App from "./App";
import "./index.css";

// The MCP client, the sign-in gate and the account pieces read who this site
// is from here. Identity lives under "taxsort:" (patron_npub:v1,
// proof_token:v1, recent-logins:v1, session_nsec:v1).
configureTollbooth({
  slug: "taxsort",
  appName: "TaxSort",
  mcpUrl: import.meta.env.VITE_MCP_URL as string,
  // Routine polls, the operator's AI key, and every call whose arguments or
  // answer carry transaction rows, account names, merchant rules or tax
  // questions: a patron's tax data never reaches the debug panel. Their
  // errors still show on the page that made the call.
  quietTools: [
    "session_heartbeat",
    "get_amount_neighbors",
    "get_anthropic_key",
    "import_csv",
    "get_transactions",
    "get_transactions_paged",
    "save_classifications",
    "get_accounts",
    "set_account_type",
    "delete_account_transactions",
    "get_rules",
    "save_rule",
    "count_rule_matches",
    "ask_advisor",
    "ask_tax_researcher",
  ],
});

// Cleanup, not a carry-over: the identity and theme keys from before the move
// to the package are never read again, so drop them rather than leave them
// lying around. Everyone signs in once more, and the theme starts light.
try {
  localStorage.removeItem("taxsort_npub");
  localStorage.removeItem("taxsort_theme");
  sessionStorage.removeItem("taxsort_verified");
} catch {
  /* site data blocked: there is nothing to clean */
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
