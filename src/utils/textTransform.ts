export function toFirstLetters(text: string): string {
  return text.split(/(\s+)/).map(word => {
    if (!word.trim()) return word;

    const match = word.match(/^([^a-zA-Z0-9]*)([a-zA-Z0-9])(.*)$/);
    if (match) {
      const prefix = match[1];
      const firstLetter = match[2];
      const rest = match[3];
      const suffixMatch = rest.match(/([^a-zA-Z0-9]+)$/);
      const suffix = suffixMatch ? suffixMatch[1] : '';
      return `${prefix}${firstLetter}${suffix}`;
    }
    return word;
  }).join('');
}

export function hideRandomWords(text: string, percentage: number = 0.4): string {
  const words = text.split(/(\s+)/);
  return words.map(word => {
    if (!word.trim()) return word;
    if (word.length <= 1) return word;

    if (Math.random() < percentage) {
      const match = word.match(/^([^a-zA-Z0-9]*)([a-zA-Z0-9]+)([^a-zA-Z0-9]*)$/);
      if (match) {
        const prefix = match[1];
        const blank = '_'.repeat(match[2].length);
        const suffix = match[3];
        return `${prefix}${blank}${suffix}`;
      }
      return '_'.repeat(word.length);
    }
    return word;
  }).join('');
}

export interface Token {
  text: string;
  isWord: boolean;
  firstLetter?: string;
  isRevealed: boolean;
}

export function tokenizeVerse(text: string): Token[] {
  // Match words (including hyphenated ones) and non-words separately
  const regex = /([a-zA-Z0-9]+(?:'[a-zA-Z0-9]+)?)|([^a-zA-Z0-9]+)/g;
  const tokens: Token[] = [];
  
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match[1]) {
      // It's a word
      tokens.push({
        text: match[1],
        isWord: true,
        firstLetter: match[1].charAt(0).toLowerCase(),
        isRevealed: false
      });
    } else if (match[2]) {
      // It's punctuation or whitespace
      tokens.push({
        text: match[2],
        isWord: false,
        isRevealed: true // Punctuation/spaces are always revealed
      });
    }
  }
  return tokens;
}
