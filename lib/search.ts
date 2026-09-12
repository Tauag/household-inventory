// Case- and space-insensitive: strips whitespace so "aestura ato" matches "Aestura Atobarrier".
function normalize(s: string) {
  return s.toLowerCase().replace(/\s+/g, "");
}

export function matchesSearch(haystack: string, query: string) {
  const q = normalize(query);
  return !q || normalize(haystack).includes(q);
}
