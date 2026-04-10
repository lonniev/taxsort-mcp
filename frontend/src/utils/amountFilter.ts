/**
 * Parse an amount filter expression into a predicate function.
 *
 * Supports: <-95, >=0.05, !33, not 25, neq 25, gt 50, lte 30,
 *           [0..10), (-3..7.56], 0..10  (bare range = inclusive both ends)
 */
export function parseAmountFilter(expr: string): ((amount: number) => boolean) | null {
  const s = expr.trim();
  if (!s) return null;

  const rangeRe = /^([[(]?)\s*(-?\d+\.?\d*)\s*\.\.\s*(-?\d+\.?\d*)\s*([\])]?)$/;
  const rm = s.match(rangeRe);
  if (rm) {
    const loInc = rm[1] !== "(";
    const lo = parseFloat(rm[2]);
    const hi = parseFloat(rm[3]);
    const hiInc = rm[4] !== ")";
    return (a) => (loInc ? a >= lo : a > lo) && (hiInc ? a <= hi : a < hi);
  }

  const opRe = /^([<>!=]=?|<=|>=)\s*(-?\d+\.?\d*)$/;
  const om = s.match(opRe);
  if (om) {
    const v = parseFloat(om[2]);
    switch (om[1]) {
      case "<":  return (a) => a < v;
      case "<=": return (a) => a <= v;
      case ">":  return (a) => a > v;
      case ">=": return (a) => a >= v;
      case "=":  case "==": return (a) => a === v;
      case "!=": case "!":  return (a) => a !== v;
    }
  }

  const wordRe = /^(lt|lte|gt|gte|eq|neq|not)\s+(-?\d+\.?\d*)$/i;
  const wm = s.match(wordRe);
  if (wm) {
    const v = parseFloat(wm[2]);
    switch (wm[1].toLowerCase()) {
      case "lt":  return (a) => a < v;
      case "lte": return (a) => a <= v;
      case "gt":  return (a) => a > v;
      case "gte": return (a) => a >= v;
      case "eq":  return (a) => a === v;
      case "neq": case "not": return (a) => a !== v;
    }
  }

  const bangRe = /^!\s*(-?\d+\.?\d*)$/;
  const bm = s.match(bangRe);
  if (bm) {
    const v = parseFloat(bm[1]);
    return (a) => a !== v;
  }

  return null;
}
