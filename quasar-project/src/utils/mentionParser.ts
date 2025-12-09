export type Chunk = { type: 'text' | 'mention'; value: string };

/**
 * Parsuje text a nájde všetky @mentions
 * @param text - Text na parsovanie
 * @returns Pole chunkov (text alebo mention)
 */
export function parseMentions(text: string): Chunk[] {
  const re = /\B@([\p{L}\p{N}_-]+)/gu;
  const out: Chunk[] = [];
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      out.push({ type: 'text', value: text.slice(last, m.index) });
    }
    const captured = m[1];
    if (typeof captured === 'string') {
      out.push({ type: 'mention', value: captured });
    } else {
      out.push({ type: 'text', value: text.slice(m.index, re.lastIndex) });
    }
    last = re.lastIndex;
  }

  if (last < text.length) {
    out.push({ type: 'text', value: text.slice(last) });
  }

  return out;
}
