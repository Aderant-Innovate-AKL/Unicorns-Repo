// Name Check Service - handles fuzzy pre-filtering and API calls

// New response format for API
export interface MatchResult {
  existingId: string;
  existingName: string;
  matchScore: number;
  matchReason: string;
  suggestedAction: 'merge' | 'review' | 'investigate' | 'monitor';
}

// Legacy format for internal use
export interface LegacyMatchResult {
  name: string;
  tier: 1 | 2 | 3 | 4;
  justification: string;
  matchedOn?: string;
}

// Response is now just an array of matches
export type NameCheckResponse = MatchResult[];

// Search criteria with optional contact details
export interface SearchCriteria {
  name: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
}

// Database record structure
export interface DatabaseRecord {
  ID?: string;
  Name: string;
  Phone_Number?: string;
  Internet_Addr?: string;
  Address1?: string;
}

const API_BASE_URL = 'http://localhost:3001';

/**
 * Performs a name check against the database using AI-powered matching
 * @param searchCriteria - The search criteria including name and optional contact details
 * @param database - The list of existing records to check against
 * @returns Promise with match results
 */
export async function performNameCheck(
  searchCriteria: SearchCriteria | string,
  database: DatabaseRecord[] | string[],
): Promise<NameCheckResponse> {
  // Normalize inputs for backward compatibility
  const criteria: SearchCriteria =
    typeof searchCriteria === 'string' ? { name: searchCriteria } : searchCriteria;

  const records: DatabaseRecord[] =
    database.length > 0 && typeof database[0] === 'string'
      ? (database as string[]).map((name) => ({ Name: name }))
      : (database as DatabaseRecord[]);

  // Step 1: Check for exact contact detail matches (these are strong matches)
  const contactMatches = findContactMatches(criteria, records);

  // Step 2: Pre-filter candidates using fuzzy name matching
  const nameDatabase = records.map((r) => r.Name);
  const nameCandidates = preFilterCandidates(criteria.name, nameDatabase);

  // Combine contact matches with name candidates (removing duplicates)
  const allCandidates = [
    ...new Set([...contactMatches.map((m) => m.name), ...nameCandidates]),
  ];

  console.log(
    `Pre-filtered ${records.length} records: ${contactMatches.length} contact matches, ${nameCandidates.length} name candidates, ${allCandidates.length} total unique`,
  );

  // If no candidates after pre-filtering, return empty array
  if (allCandidates.length === 0) {
    return [];
  }

  // Step 3: Send candidates to AI for intelligent matching
  const searchAcronym = generateAcronym(criteria.name);

  // Build the candidate records for ID lookup on the backend
  const candidateRecords = records.filter((r) => allCandidates.includes(r.Name));

  const response = await fetch(`${API_BASE_URL}/api/name-check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      searchName: criteria.name,
      candidates: allCandidates,
      searchAcronym: searchAcronym || undefined,
      contactMatches: contactMatches.length > 0 ? contactMatches : undefined,
      candidateRecords: candidateRecords,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Finds records that match on contact details (phone, email, address)
 * These are high-confidence matches regardless of name similarity
 */
function findContactMatches(
  criteria: SearchCriteria,
  records: DatabaseRecord[],
): { name: string; matchedField: string; matchedValue: string }[] {
  const matches: { name: string; matchedField: string; matchedValue: string }[] = [];

  const normalizePhone = (phone: string) => phone.replace(/[\s\-().]/g, '').toLowerCase();
  const normalizeEmail = (email: string) => email.trim().toLowerCase();
  const normalizeAddress = (addr: string) =>
    addr.trim().toLowerCase().replace(/[,.]/g, '').replace(/\s+/g, ' ');

  for (const record of records) {
    // Check phone number match
    if (criteria.phoneNumber && record.Phone_Number) {
      const searchPhone = normalizePhone(criteria.phoneNumber);
      const recordPhone = normalizePhone(record.Phone_Number);
      if (searchPhone && recordPhone && searchPhone === recordPhone) {
        matches.push({
          name: record.Name,
          matchedField: 'Phone Number',
          matchedValue: record.Phone_Number,
        });
        continue; // Don't double-count the same record
      }
    }

    // Check email match
    if (criteria.email && record.Internet_Addr) {
      const searchEmail = normalizeEmail(criteria.email);
      const recordEmail = normalizeEmail(record.Internet_Addr);
      if (searchEmail && recordEmail && searchEmail === recordEmail) {
        matches.push({
          name: record.Name,
          matchedField: 'Email/Website',
          matchedValue: record.Internet_Addr,
        });
        continue;
      }
    }

    // Check address match
    if (criteria.address && record.Address1) {
      const searchAddr = normalizeAddress(criteria.address);
      const recordAddr = normalizeAddress(record.Address1);
      if (searchAddr && recordAddr && searchAddr === recordAddr) {
        matches.push({
          name: record.Name,
          matchedField: 'Address',
          matchedValue: record.Address1,
        });
        continue;
      }
    }
  }

  return matches;
}

/**
 * Pre-filters the name database using fuzzy matching techniques
 * Returns candidate names that are potentially similar to the search name
 */
function preFilterCandidates(
  searchName: string,
  nameDatabase: string[],
  maxCandidates = 50,
): string[] {
  const normalizedSearch = normalizeForComparison(searchName);
  const searchTokens = tokenize(searchName);
  const searchSoundex = soundexCode(normalizedSearch);
  const isShortSearch = normalizedSearch.length <= 4;

  // Check if search looks like an acronym (e.g., "DKNY", "IBM", "ABC")
  const searchIsAcronym = isLikelyAcronym(searchName);
  const searchAcronymLower = searchIsAcronym
    ? searchName.replace(/[^A-Za-z]/g, '').toLowerCase()
    : '';

  // Also generate acronym from search if it's a multi-word name
  const searchGeneratedAcronym = generateAcronym(searchName);

  // Debug logging
  console.log('Search analysis:', {
    searchName,
    searchIsAcronym,
    searchAcronymLower,
    searchGeneratedAcronym,
    isShortSearch,
  });

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

    // ACRONYM MATCHING
    if (searchIsAcronym) {
      // Search is an acronym - check if name's acronym matches
      const nameAcronym = generateAcronym(name);
      if (nameAcronym && nameAcronym === searchAcronymLower) {
        score += 300; // Strong match: "DKNY" matches "Donna Karan New York"
      }
      // Also check if the acronym appears as a token in the name
      if (nameTokens.includes(searchAcronymLower)) {
        score += 200; // The acronym itself is in the name
      }
    }

    // Check if name looks like an acronym and search's acronym matches it
    if (isLikelyAcronym(name)) {
      const nameAcronymLower = name.replace(/[^A-Za-z]/g, '').toLowerCase();
      console.log('Checking acronym match:', {
        name,
        nameAcronymLower,
        searchGeneratedAcronym,
        match: searchGeneratedAcronym === nameAcronymLower,
      });
      if (searchGeneratedAcronym && searchGeneratedAcronym === nameAcronymLower) {
        score += 300; // "Donna Karan New York" matches "DKNY"
        console.log('ACRONYM MATCH FOUND:', name, 'score now:', score);
      }
    }

    // Exact token match (e.g., searching "TAL" matches a company named "TAL Industries")
    const hasExactTokenMatch = nameTokens.some(
      (token) => token === normalizedSearch || searchTokens.includes(token),
    );
    if (hasExactTokenMatch) {
      score += 200;
    }

    // Levenshtein distance (for typos) - only meaningful for similar length strings
    const lengthRatio =
      Math.min(normalizedSearch.length, normalizedName.length) /
      Math.max(normalizedSearch.length, normalizedName.length);
    if (lengthRatio > 0.3) {
      const distance = levenshteinDistance(normalizedSearch, normalizedName);
      const maxLen = Math.max(normalizedSearch.length, normalizedName.length);
      const similarity = 1 - distance / maxLen;
      // Higher weight for high similarity
      if (similarity > 0.7) {
        score += similarity * 150;
      } else if (similarity > 0.5) {
        score += similarity * 50;
      }
    }

    // Token overlap (for partial matches in multi-word names)
    const tokenOverlap = calculateTokenOverlap(searchTokens, nameTokens);
    if (tokenOverlap > 0.5) {
      score += tokenOverlap * 80;
    }

    // Soundex match (for homophones) - more valuable for longer names
    if (searchSoundex === nameSoundex && !isShortSearch) {
      score += 50;
    }

    // Substring match - only valuable if it's a meaningful match
    // Avoid matching "TAL" inside "Natalie"
    if (!isShortSearch) {
      // For longer searches, substring matching is useful
      if (
        normalizedName.includes(normalizedSearch) ||
        normalizedSearch.includes(normalizedName)
      ) {
        score += 30;
      }
    } else {
      // For short searches, only match if it's at word boundaries
      const wordBoundaryPattern = new RegExp(
        `\\b${escapeRegex(normalizedSearch)}\\b`,
        'i',
      );
      if (wordBoundaryPattern.test(name)) {
        score += 100; // Strong match - it's a complete word/token
      }
    }

    return { name, score };
  });

  // Higher threshold for short searches to reduce noise (but not for acronyms which have specific matches)
  const minThreshold = isShortSearch && !searchIsAcronym ? 80 : 40;

  // Sort by score and take top candidates
  const filtered = scoredNames
    .filter((item) => item.score > minThreshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxCandidates);

  console.log('Top candidates with scores:', filtered.slice(0, 10));
  console.log('Min threshold:', minThreshold);

  return filtered.map((item) => item.name);
}

/**
 * Checks if a string looks like an acronym
 * - All uppercase letters (ignoring punctuation)
 * - 2-8 characters long
 * - At least 2 letters
 */
function isLikelyAcronym(str: string): boolean {
  const letters = str.replace(/[^A-Za-z]/g, '');
  if (letters.length < 2 || letters.length > 8) return false;
  // Check if the original string's letters are all uppercase
  const upperLetters = str.replace(/[^A-Z]/g, '');
  return upperLetters.length === letters.length && letters.length >= 2;
}

/**
 * Generates an acronym from a multi-word name
 * e.g., "Donna Karan New York" -> "dkny"
 * Returns lowercase acronym or empty string if not applicable
 */
function generateAcronym(str: string): string {
  // Split into words, filter out common suffixes and short words
  const words = str
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => {
      const lower = word.toLowerCase();
      // Skip common business suffixes and very short words
      const skipWords = [
        'ltd',
        'limited',
        'llc',
        'llp',
        'inc',
        'incorporated',
        'corp',
        'corporation',
        'co',
        'company',
        'plc',
        'partners',
        'and',
        'the',
        'of',
        'for',
        'a',
        'an',
      ];
      return word.length > 0 && !skipWords.includes(lower);
    });

  // Need at least 2 words to form a meaningful acronym
  if (words.length < 2) return '';

  // Take first letter of each remaining word
  const acronym = words.map((word) => word[0].toLowerCase()).join('');

  // Only return if acronym is reasonable length (2-8 chars)
  if (acronym.length >= 2 && acronym.length <= 8) {
    return acronym;
  }
  return '';
}

/**
 * Escapes special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
