import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'
import { agentGuide } from '@tollbooth-dpyc/web/agent-guide'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

export default defineConfig({
  plugins: [
    react(),
    agentGuide({
      name: "TaxSort",
      summary: "Sort a year of bank, card and brokerage transactions into IRS tax categories with AI assistance: import CSV exports, classify each transaction with Claude, review by hand, and read grouped summaries for your return.",
      site: "https://taxsort-app.pages.dev",
      mcpUrl: "https://taxsort-mcp.fastmcp.app/mcp",
      toolPrefix: "taxsort",
      source: "https://github.com/lonniev/taxsort-mcp",
      registryName: "io.github.lonniev/taxsort-mcp",
      body: "agent-guide.md",
    }),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: { outDir: 'dist' },
})
