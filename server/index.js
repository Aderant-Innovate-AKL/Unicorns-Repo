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
    const { searchName, candidates } = req.body;

    if (!searchName || !candidates || !Array.isArray(candidates)) {
      return res.status(400).json({
        error: 'Invalid request. Required: searchName (string), candidates (array)',
      });
    }

    console.log(`Checking name: "${searchName}" against ${candidates.length} candidates`);

    // Build the prompt for Claude
    const prompt = buildNameMatchingPrompt(searchName, candidates);

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

    if (!content) {
      return res.status(500).json({ error: 'Empty response from AI' });
    }

    // Parse the JSON response from Claude
    const matches = parseAIResponse(content);

    res.json({
      searchedName: searchName,
      matches,
    });
  } catch (error) {
    console.error('Error in name-check endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Build the prompt for name matching
function buildNameMatchingPrompt(searchName, candidates) {
  return `You are a name matching expert for a law firm's conflict checking system. Your task is to identify potential matches between a search name and a list of existing names in the database.

SEARCH NAME: "${searchName}"

CANDIDATE NAMES TO CHECK:
${candidates.map((name, i) => `${i + 1}. ${name}`).join('\n')}

MATCHING CRITERIA:
Analyze each candidate and determine if it could be a match for the search name. Consider:

1. **Exact matches** - Identical names (Tier 1)
2. **Very close matches** - Minor typos, missing/extra letters, abbreviations like "Ltd"/"Limited", "Co"/"Company", "Inc"/"Incorporated", "&"/"and" (Tier 2)
3. **Possible matches** - Homophones (words that sound alike but spelled differently), phonetic similarities, common name variations like "Bill"/"William", "Bob"/"Robert" (Tier 3)
4. **Distant similarities** - Partial name overlaps, similar sounding names that might warrant investigation (Tier 4)

TIERING RULES:
- Always show Tier 1 and Tier 2 matches
- Only show Tier 3 matches if there are no Tier 1 or Tier 2 matches
- Only show Tier 4 matches if there are no matches in any higher tier
- Maximum 10 matches total

OUTPUT FORMAT:
Respond with ONLY a JSON array (no markdown, no explanation). Each match should have:
- "name": the matching name from the candidate list
- "tier": number 1-4
- "justification": brief explanation of why this is a match (1-2 sentences)

If there are NO matches at all, return an empty array: []

Example response format:
[
  {"name": "Sarah Mitchell", "tier": 2, "justification": "Very close match - likely typo with missing 'a' in first name."},
  {"name": "Johnson & Partners Ltd", "tier": 2, "justification": "Abbreviation variation - 'Ltd' vs 'Limited' and '&' vs 'and'."}
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
