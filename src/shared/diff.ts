// Word-level diff for the per-iteration input→updated view and the Final panel.
// A compact LCS over whitespace-delimited tokens. Rendered as elements (never
// dangerouslySetInnerHTML) — this only produces data.

export type DiffOp = "same" | "add" | "remove";

export interface DiffToken {
  op: DiffOp;
  text: string;
}

function tokenize(text: string): string[] {
  // Keep words and the whitespace between them as separate tokens so we can
  // reassemble spacing faithfully.
  return text.match(/\s+|[^\s]+/g) ?? [];
}

/** Longest-common-subsequence word diff from `before` to `after`. */
export function diffWords(before: string, after: string): DiffToken[] {
  const a = tokenize(before);
  const b = tokenize(after);
  const n = a.length;
  const m = b.length;

  // LCS length table.
  const lcs: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0),
  );
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] =
        a[i] === b[j]
          ? lcs[i + 1][j + 1] + 1
          : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const out: DiffToken[] = [];
  let i = 0;
  let j = 0;
  const push = (op: DiffOp, text: string) => {
    const last = out[out.length - 1];
    if (last && last.op === op) last.text += text;
    else out.push({ op, text });
  };

  while (i < n && j < m) {
    if (a[i] === b[j]) {
      push("same", a[i]);
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      push("remove", a[i]);
      i++;
    } else {
      push("add", b[j]);
      j++;
    }
  }
  while (i < n) push("remove", a[i++]);
  while (j < m) push("add", b[j++]);
  return out;
}
