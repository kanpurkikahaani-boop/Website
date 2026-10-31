/**
 * Proves the author's prose is unchanged: compares the words in content/blogs/navaratri-in-kanpur.html
 * (headings and tags removed) against Appendix A, word by word, and lists every difference.
 *   npx tsx scripts/diff-navaratri-text.ts
 */
import { readFileSync } from "node:fs";

const html = readFileSync("content/blogs/navaratri-in-kanpur.html", "utf8")
  .replace(/<!--[\s\S]*?-->/g, "")
  .replace(/<h2[\s\S]*?<\/h2>/g, "");
const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/&#39;/g, "'");
const ours = decode(html.replace(/<[^>]+>/g, "")).split(/\s+/).filter(Boolean);
const orig = readFileSync("content/blogs/navaratri-in-kanpur.original.txt", "utf8").split(/\s+/).filter(Boolean);

// Simple LCS word diff
const n = orig.length, m = ours.length;
const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = orig[i] === ours[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
const changes: string[] = [];
let i = 0, j = 0, del: string[] = [], add: string[] = [];
const flush = (ctx: string) => {
  if (del.length || add.length) changes.push(`  "${del.join(" ")}" → "${add.join(" ")}"   (…${ctx})`);
  del = []; add = [];
};
while (i < n || j < m) {
  if (i < n && j < m && orig[i] === ours[j]) { flush(orig.slice(Math.max(0, i - 3), i).join(" ")); i++; j++; }
  else if (j < m && (i >= n || dp[i][j + 1] >= dp[i + 1][j])) add.push(ours[j++]);
  else del.push(orig[i++]);
}
flush("end");
console.log(`Author's words: ${orig.length} in Appendix A, ${ours.length} on the page. ${changes.length} edits:`);
console.log(changes.join("\n"));
