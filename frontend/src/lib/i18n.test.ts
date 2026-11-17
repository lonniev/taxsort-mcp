/** TaxSort's words in every language say what English says: the same keys, {{places}} and <tags/>. */

import { test } from "node:test";
import assert from "node:assert/strict";
import { LANGUAGES, localeProblems, setLanguage, translate } from "@tollbooth-dpyc/web";
import english from "../i18n/en.ts";
import { registerTaxSort, WORDS } from "../i18n/index.ts";

for (const { code } of LANGUAGES.filter((l) => l.code !== "en")) {
  test(`${code}: every message is there, with English's {{places}} and <tags/>`, async () => {
    const locale = (await import(`../i18n/${code}.ts`)).default;
    assert.deepEqual(localeProblems(english, locale), []);
  });
}

test("no message keeps a single-brace {place} or a raw ${…}", () => {
  for (const [key, text] of Object.entries(english)) assert.doesNotMatch(text, /(^|[^{])\{\w+\}(?!\})|\$\{/, key);
});

test("TaxSort's words are read through the package, in the chosen language", async () => {
  await registerTaxSort();
  assert.equal(translate("views.sessions.title", undefined, WORDS), "Tax sessions");
  await setLanguage("fr");
  assert.equal(translate("views.sessions.title", undefined, WORDS), "Sessions fiscales");
  await setLanguage("en");
});

test("a count picks its plural in English", async () => {
  await registerTaxSort();
  assert.equal(translate("views.common.transactions", { count: 1 }, WORDS), "1 transaction");
  assert.equal(translate("views.common.transactions", { count: 3 }, WORDS), "3 transactions");
  assert.equal(translate("views.settings.minutes", { count: 15 }, WORDS), "15 minutes");
});

test("the privacy policy keeps its Markdown links in every language", async () => {
  for (const { code } of LANGUAGES) {
    const words = code === "en" ? english : (await import(`../i18n/${code}.ts`)).default;
    const body = words["views.privacy.body"] as string;
    for (const link of ["https://github.com/lonniev/dpyc-community", "https://www.anthropic.com/privacy", "https://github.com/lonniev/taxsort-mcp"]) {
      assert.ok(body.includes(`](${link})`), `${code}: ${link}`);
    }
  }
});
