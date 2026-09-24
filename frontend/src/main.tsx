import React from "react";
import ReactDOM from "react-dom/client";
import { configureTollbooth } from "@tollbooth-dpyc/web";
import App from "./App";
import "./index.css";

// The shared account pieces (the Nostr profile card) read who this site is
// from here.
configureTollbooth({
  slug: "taxsort",
  appName: "TaxSort",
  mcpUrl: import.meta.env.VITE_MCP_URL as string,
});

// Apply saved theme before first render
{
  const theme = localStorage.getItem("taxsort_theme") || "light";
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else if (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    document.documentElement.classList.add("dark");
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
