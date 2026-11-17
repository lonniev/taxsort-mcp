/**
 * Money and counts in the reader's own number format. TaxSort's figures are
 * US tax figures, so the currency is always the US dollar: only the way the
 * number is written follows the language.
 */

/** A dollar figure: "$1,234.50", "1 234,50 $US", "US$1,234.50". */
export function usd(amount: number, locale: string, maxDigits = 2): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Math.min(2, maxDigits),
    maximumFractionDigits: maxDigits,
  }).format(amount);
}

/** A transaction amount with its sign and two decimals: "+12.00", "-4.50". */
export function signedAmount(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: amount >= 0 ? "always" : "auto",
  }).format(amount);
}

/** A total with two decimals and no added sign: "1,234.50", "-12.00". */
export function decimal(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

/** A whole count: "12,345", "12 345". */
export function count(n: number, locale: string): string {
  return n.toLocaleString(locale);
}
