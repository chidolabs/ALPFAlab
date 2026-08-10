export function normCompany(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\b(llp|llc|inc\.?|corp\.?|corporation|co\.?)\b/g, "")
    .trim();
}

export function companiesMatch(a: string, b: string): boolean {
  const x = normCompany(a);
  const y = normCompany(b);
  return x === y || x.includes(y) || y.includes(x);
}
