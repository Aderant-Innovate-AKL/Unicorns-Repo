import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Anthropic API configuration
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

if (!ANTHROPIC_API_KEY) {
  console.error('ERROR: ANTHROPIC_API_KEY is not set in environment variables');
  process.exit(1);
}

// Name matching endpoint
app.post('/api/name-check', async (req, res) => {
  try {
    const { searchName, candidates, searchAcronym, contactMatches } = req.body;

    if (!searchName || !candidates || !Array.isArray(candidates)) {
      return res.status(400).json({
        error: 'Invalid request. Required: searchName (string), candidates (array)',
      });
    }

    console.log(`Checking name: "${searchName}" against ${candidates.length} candidates`);
    if (searchAcronym) {
      console.log(`Search acronym detected: "${searchAcronym}"`);
    }
    if (contactMatches && contactMatches.length > 0) {
      console.log(
        `Contact matches found: ${contactMatches.length} (pre-qualified as Tier 1)`,
      );
    }

    // Start with contact matches as Tier 1 (these are definite matches)
    const contactMatchResults = (contactMatches || []).map((cm) => ({
      name: cm.name,
      tier: 1,
      justification: `Exact ${cm.matchedField} match: "${cm.matchedValue}"`,
    }));

    // Get names that are already matched via contact details
    const contactMatchedNames = new Set(contactMatchResults.map((m) => m.name));

    // Filter candidates to exclude those already matched via contact details
    const remainingCandidates = candidates.filter((c) => !contactMatchedNames.has(c));

    let aiMatches = [];

    // Only call AI if there are remaining candidates to check
    if (remainingCandidates.length > 0) {
      // Build the prompt for Claude
      const prompt = buildNameMatchingPrompt(
        searchName,
        remainingCandidates,
        searchAcronym,
      );

      // Call Anthropic API
      const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Anthropic API error:', errorData);
        return res.status(500).json({ error: 'Failed to process name matching request' });
      }

      const data = await response.json();
      const content = data.content[0]?.text;

      if (content) {
        // Parse the JSON response from Claude
        aiMatches = parseAIResponse(content);
      }
    }

    // Combine contact matches (first) with AI matches
    const allMatches = [...contactMatchResults, ...aiMatches];

    res.json({
      searchedName: searchName,
      matches: allMatches,
    });
  } catch (error) {
    console.error('Error in name-check endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Build the prompt for name matching
function buildNameMatchingPrompt(searchName, candidates, searchAcronym = null) {
  let acronymNote = '';
  if (searchAcronym) {
    acronymNote = `
IMPORTANT - ACRONYM DETECTED:
The search name "${searchName}" forms the acronym "${searchAcronym.toUpperCase()}".
Any candidate that matches this acronym (like "${searchAcronym.toUpperCase()}") should be considered a Tier 2 match.
`;
  }

  return `You are a name matching expert for a law firm's conflict checking system. Your task is to identify GENUINE potential matches between a search name and existing names in the database.

SEARCH NAME: "${searchName}"
${acronymNote}
CANDIDATE NAMES TO CHECK:
${candidates.map((name, i) => `${i + 1}. ${name}`).join('\n')}

CRITICAL MATCHING RULES:
You must be STRICT and CONSERVATIVE. Only flag names that a reasonable person would consider potentially the same entity or person. 

**DO NOT MATCH:**
- Names that merely contain the search term as a coincidental substring (e.g., "TAL" should NOT match "Natalie" or "Ental" - the letters happen to appear but it's clearly not the same entity)
- Names where the only similarity is a few shared letters in a longer, clearly different name
- Names that are phonetically or visually completely different

**DO MATCH:**
- Exact or near-exact matches
- Clear typos/misspellings of the same name (e.g., "Srah Mitchell" → "Sarah Mitchell")  
- Abbreviation variants (e.g., "Ltd" vs "Limited", "Co" vs "Company", "&" vs "and")
- Known nickname equivalents (e.g., "Bill" vs "William", "Bob" vs "Robert")
- Clear phonetic equivalents/homophones (e.g., "Through" vs "Thru", "Knight" vs "Night")
- **Acronyms and their expansions** (e.g., "DKNY" matches "Donna Karan New York", "IBM" matches "International Business Machines") - if the search term is all caps, check if it could be an acronym for any candidate name
- **Rare/unique name components** - If a first name, middle name, or surname is distinctively rare or unusual (e.g., "Darvonious", "Xiomara", "Pemberton", "Malificient"), treat a match on that specific component as significant even if other name parts differ entirely. Example: "Darvonious Johnson" should match "Darvonious Smith" because "Darvonious" is so rare it's unlikely to be coincidental. However, do NOT apply this logic to common names - "John Smith" should NOT match "John Williams" just because they share "John".
- **Hyphenated surname matching** - People with hyphenated surnames (e.g., "Plinsky-Williamson") sometimes use only one part of their name. Match hyphenated surnames with either component: "Jordan Plinsky-Williamson" should match "Jordan Plinsky" AND "Jordan Williamson". Similarly, "Jordan Plinsky" should match "Jordan Plinsky-Williamson". This applies in both directions.

TIER DEFINITIONS:
1. **Tier 1 - Exact Match**: Identical names (ignoring case/punctuation). "NASA" = "N.A.S.A." = "nasa" are all Tier 1. But "NASA" vs "National Aeronautics Space Administration" is NOT Tier 1 - that's an acronym expansion.
2. **Tier 2 - Very Close**: Minor typos, abbreviation differences (Ltd/Limited), clear misspellings, AND acronym-to-expansion matches (e.g., "NASA" ↔ "National Aeronautics Space Administration")
3. **Tier 3 - Possible Match**: Homophones, nickname variants, phonetically similar  
4. **Tier 4 - Investigate**: Partial but meaningful overlap that warrants human review

IMPORTANT: An acronym matching its expanded form is ALWAYS Tier 2, never Tier 1. Tier 1 is ONLY for names that are essentially identical.

TIERING RULES:
- Always show Tier 1 and Tier 2 matches
- Only show Tier 3 matches if there are fewer than 3 Tier 1/2 matches
- Only show Tier 4 matches if there are NO matches in higher tiers
- Maximum 10 matches total
- When in doubt, DO NOT include - prefer false negatives over false positives for Tier 3/4

OUTPUT FORMAT:
Respond with ONLY a JSON array (no markdown, no explanation). Each match should have:
- "name": the matching name from the candidate list (exactly as provided)
- "tier": number 1-4
- "justification": brief explanation of why this is a GENUINE match (1-2 sentences)

If there are NO genuine matches, return an empty array: []

Example response:
[
  {"name": "Sarah Mitchell", "tier": 2, "justification": "Likely typo - 'Sara' missing 'h', same last name."},
  {"name": "Johnson & Partners Ltd", "tier": 2, "justification": "Same entity - '&' vs 'and', 'Ltd' vs 'Limited'."},
  {"name": "Darvonious Smith", "tier": 2, "justification": "Rare first name match - 'Darvonious' is highly unusual, unlikely to be coincidental."},
  {"name": "Jordan Plinsky", "tier": 2, "justification": "Hyphenated surname match - 'Plinsky' is part of 'Plinsky-Williamson'."}
]

Analyze the candidates now and return ONLY the JSON array:`;
}

// Parse the AI response and extract matches
function parseAIResponse(content) {
  try {
    // Try to extract JSON from the response
    let jsonStr = content.trim();

    // If the response contains markdown code blocks, extract the JSON
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    // Parse the JSON
    const matches = JSON.parse(jsonStr);

    // Validate and filter the matches
    if (!Array.isArray(matches)) {
      console.error('AI response is not an array:', matches);
      return [];
    }

    return matches
      .filter(
        (m) =>
          m &&
          typeof m.name === 'string' &&
          typeof m.tier === 'number' &&
          typeof m.justification === 'string',
      )
      .map((m) => ({
        name: m.name,
        tier: Math.min(4, Math.max(1, m.tier)), // Ensure tier is 1-4
        justification: m.justification,
      }));
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    console.error('Raw content:', content);
    return [];
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Name Check API Server running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(`   Name check:   POST http://localhost:${PORT}/api/name-check\n`);
});
