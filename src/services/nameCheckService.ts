// Name Check Service - handles fuzzy pre-filtering and API calls

export interface MatchResult {
  name: string;
  tier: 1 | 2 | 3 | 4;
  justification: string;
}

export interface NameCheckResponse {
  searchedName: string;
  matches: MatchResult[];
}

const API_BASE_URL = 'http://localhost:3001';

/**
 * Performs a name check against the database using AI-powered matching
 * @param searchName - The name to search for
 * @param nameDatabase - The list of existing names to check against
 * @returns Promise with match results
 */
export async function performNameCheck(
  searchName: string,
  nameDatabase: string[],
): Promise<NameCheckResponse> {
  // Step 1: Pre-filter candidates using fuzzy matching
  // This reduces the number of names sent to the AI, saving cost and latency
  const candidates = preFilterCandidates(searchName, nameDatabase);

  console.log(
    `Pre-filtered ${nameDatabase.length} names down to ${candidates.length} candidates`,
  );

  // If no candidates after pre-filtering, return empty
  if (candidates.length === 0) {
    return {
      searchedName: searchName,
      matches: [],
    };
  }

  // Step 2: Send candidates to AI for intelligent matching
  const response = await fetch(`${API_BASE_URL}/api/name-check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      searchName,
      candidates,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Pre-filters the name database using fuzzy matching techniques
 * Returns candidate names that are potentially similar to the search name
 */
function preFilterCandidates(
  searchName: string,
  nameDatabase: string[],
  maxCandidates = 100,
): string[] {
  const normalizedSearch = normalizeForComparison(searchName);
  const searchTokens = tokenize(searchName);
  const searchSoundex = soundexCode(normalizedSearch);

  // Score each name in the database
  const scoredNames = nameDatabase.map((name) => {
    const normalizedName = normalizeForComparison(name);
    const nameTokens = tokenize(name);
    const nameSoundex = soundexCode(normalizedName);

    let score = 0;

    // Exact match (highest priority)
    if (normalizedSearch === normalizedName) {
      score += 1000;
    }

    // Levenshtein distance (for typos)
    const distance = levenshteinDistance(normalizedSearch, normalizedName);
    const maxLen = Math.max(normalizedSearch.length, normalizedName.length);
    const similarity = 1 - distance / maxLen;
    score += similarity * 100;

    // Token overlap (for partial matches)
    const tokenOverlap = calculateTokenOverlap(searchTokens, nameTokens);
    score += tokenOverlap * 50;

    // Soundex match (for homophones)
    if (searchSoundex === nameSoundex) {
      score += 30;
    }

    // Substring match
    if (
      normalizedName.includes(normalizedSearch) ||
      normalizedSearch.includes(normalizedName)
    ) {
      score += 40;
    }

    return { name, score };
  });

  // Sort by score and take top candidates
  return scoredNames
    .filter((item) => item.score > 20) // Minimum threshold
    .sort((a, b) => b.score - a.score)
    .slice(0, maxCandidates)
    .map((item) => item.name);
}

/**
 * Normalizes a string for comparison
 * - Lowercase
 * - Remove common business suffixes for comparison
 * - Normalize whitespace
 */
function normalizeForComparison(str: string): string {
  return str
    .toLowerCase()
    .replace(
      /\b(ltd|limited|llc|llp|inc|incorporated|corp|corporation|co|company|plc|partners|&|and)\b/gi,
      '',
    )
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Tokenizes a string into words
 */
function tokenize(str: string): string[] {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1);
}

/**
 * Calculates Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;

  if (m === 0) return n;
  if (n === 0) return m;

  const matrix: number[][] = [];

  for (let i = 0; i <= m; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= n; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost, // substitution
      );
    }
  }

  return matrix[m][n];
}

/**
 * Calculates token overlap between two sets of tokens
 */
function calculateTokenOverlap(tokens1: string[], tokens2: string[]): number {
  if (tokens1.length === 0 || tokens2.length === 0) return 0;

  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);

  let overlap = 0;
  for (const token of set1) {
    if (set2.has(token)) {
      overlap++;
    }
  }

  return overlap / Math.max(set1.size, set2.size);
}

/**
 * Generates a Soundex code for phonetic matching
 */
function soundexCode(str: string): string {
  const s = str.toUpperCase().replace(/[^A-Z]/g, '');
  if (s.length === 0) return '0000';

  const codes: Record<string, string> = {
    B: '1',
    F: '1',
    P: '1',
    V: '1',
    C: '2',
    G: '2',
    J: '2',
    K: '2',
    Q: '2',
    S: '2',
    X: '2',
    Z: '2',
    D: '3',
    T: '3',
    L: '4',
    M: '5',
    N: '5',
    R: '6',
  };

  let result = s[0];
  let prevCode = codes[s[0]] || '';

  for (let i = 1; i < s.length && result.length < 4; i++) {
    const code = codes[s[i]];
    if (code && code !== prevCode) {
      result += code;
    }
    prevCode = code || prevCode;
  }

  return result.padEnd(4, '0');
}
