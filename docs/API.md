# Name Check API Documentation

## Overview

The Name Check API provides AI-powered name matching for conflict checking in law firms.
It identifies potential matches between a search name and existing records, catching
typos, abbreviations, acronyms, phonetic variations, and more.

**Base URL:** `http://localhost:3001`

---

## Endpoints

### Health Check

Check if the API server is running.

```
GET /api/health
```

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-12-04T12:00:00.000Z"
}
```

---

### Name Check

Perform an AI-powered name match against a list of candidates.

```
POST /api/name-check
```

#### Request Headers

| Header       | Value            |
| ------------ | ---------------- |
| Content-Type | application/json |

#### Request Body

| Field              | Type     | Required | Description                                  |
| ------------------ | -------- | -------- | -------------------------------------------- |
| `searchName`       | string   | ✅ Yes   | The name to search for                       |
| `candidates`       | string[] | ✅ Yes   | Array of candidate names to check against    |
| `candidateRecords` | object[] | Optional | Full records with IDs for richer responses   |
| `searchAcronym`    | string   | Optional | Pre-computed acronym of the search name      |
| `contactMatches`   | object[] | Optional | Pre-matched records based on contact details |

#### Example Request

```bash
curl -X POST http://localhost:3001/api/name-check \
  -H "Content-Type: application/json" \
  -d '{
    "searchName": "Sara Mitchell",
    "candidates": [
      "Sarah Mitchell",
      "John Smith",
      "Sara Williams"
    ],
    "candidateRecords": [
      {"ID": "ENT-0001", "Name": "Sarah Mitchell"},
      {"ID": "ENT-0002", "Name": "John Smith"},
      {"ID": "ENT-0003", "Name": "Sara Williams"}
    ]
  }'
```

#### Response

Returns a JSON array of matches (empty array if no matches found).

| Field             | Type   | Description                                                        |
| ----------------- | ------ | ------------------------------------------------------------------ |
| `existingId`      | string | Unique identifier of the matched record                            |
| `existingName`    | string | Name of the matched record                                         |
| `matchScore`      | number | Confidence score (0-100)                                           |
| `matchReason`     | string | Human-readable explanation of why this is a match                  |
| `suggestedAction` | string | Recommended action: `merge`, `review`, `investigate`, or `monitor` |

#### Example Response

```json
[
  {
    "existingId": "ENT-0001",
    "existingName": "Sarah Mitchell",
    "matchScore": 85,
    "matchReason": "Likely typo - 'Sara' missing 'h', same last name.",
    "suggestedAction": "review"
  }
]
```

---

## Match Scores & Actions

| Score Range | Classification | Suggested Action | Meaning                                  |
| ----------- | -------------- | ---------------- | ---------------------------------------- |
| 95-100      | Exact Match    | `merge`          | Identical or near-identical names        |
| 80-94       | Very Close     | `review`         | Minor differences (typos, abbreviations) |
| 65-79       | Possible Match | `investigate`    | Phonetic or structural similarities      |
| < 65        | Distant        | `monitor`        | Weak similarity, needs human judgment    |

---

## Matching Rules

The AI applies the following matching rules:

### 1. Exact Match

Names that are identical (case-insensitive, ignoring punctuation).

- `"NASA"` = `"nasa"` = `"N.A.S.A."`

### 2. Typos & Misspellings

Common typing errors and character transpositions.

- `"Srah Mitchell"` → `"Sarah Mitchell"`
- `"Jonh Smith"` → `"John Smith"`

### 3. Abbreviations

Standard business abbreviations.

- `"Ltd"` ↔ `"Limited"`
- `"Co"` ↔ `"Company"`
- `"&"` ↔ `"and"`
- `"Inc"` ↔ `"Incorporated"`

### 4. Nicknames

Common name variants.

- `"Bill"` ↔ `"William"`
- `"Bob"` ↔ `"Robert"`
- `"Mike"` ↔ `"Michael"`

### 5. Acronyms

Bidirectional acronym-to-expansion matching.

- `"NASA"` ↔ `"National Aeronautics Space Administration"`
- `"IBM"` ↔ `"International Business Machines"`

### 6. Rare/Unique Names

Unusual names that are unlikely to be coincidental.

- `"Darvonious Johnson"` matches `"Darvonious Smith"` (rare first name)
- Does NOT match common names like `"John Smith"` with `"John Williams"`

### 7. Hyphenated Surnames

Matching partial hyphenated names.

- `"Jordan Plinsky-Williamson"` ↔ `"Jordan Plinsky"`
- `"Jordan Plinsky-Williamson"` ↔ `"Jordan Williamson"`

### 8. Phonetic Approximations

Names that sound similar when spoken.

- `"Coobernetties"` → `"Kubernetes"`
- `"Shivawn"` → `"Siobhan"`
- `"Huge Ass"` → `"Hugh Jass"`

### 9. Contact Detail Matching

If contact details (phone, email, address) are provided, exact matches on these fields are
treated as high-confidence matches regardless of name similarity.

---

## Error Responses

### 400 Bad Request

Missing or invalid parameters.

```json
{
  "error": "Invalid request. Required: searchName (string), candidates (array)"
}
```

### 500 Internal Server Error

Server or AI processing error.

```json
{
  "error": "Failed to process name matching request"
}
```

---

## Integration Examples

### JavaScript/TypeScript

```typescript
async function checkName(name: string, candidates: string[]) {
  const response = await fetch('http://localhost:3001/api/name-check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      searchName: name,
      candidates: candidates,
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

// Usage
const matches = await checkName('Sara Mitchell', ['Sarah Mitchell', 'John Smith']);
console.log(matches);
```

### Python

```python
import requests

def check_name(name: str, candidates: list) -> list:
    response = requests.post(
        'http://localhost:3001/api/name-check',
        json={
            'searchName': name,
            'candidates': candidates,
        }
    )
    response.raise_for_status()
    return response.json()

# Usage
matches = check_name('Sara Mitchell', ['Sarah Mitchell', 'John Smith'])
print(matches)
```

### C# / .NET

```csharp
using System.Net.Http.Json;

public class NameCheckClient
{
    private readonly HttpClient _client;

    public NameCheckClient()
    {
        _client = new HttpClient { BaseAddress = new Uri("http://localhost:3001") };
    }

    public async Task<List<MatchResult>> CheckNameAsync(string name, string[] candidates)
    {
        var request = new { searchName = name, candidates = candidates };
        var response = await _client.PostAsJsonAsync("/api/name-check", request);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<List<MatchResult>>();
    }
}

public record MatchResult(
    string ExistingId,
    string ExistingName,
    int MatchScore,
    string MatchReason,
    string SuggestedAction
);
```

---

## Rate Limits & Performance

- **Current:** No rate limits (POC)
- **Response Time:** Typically 1-3 seconds (depends on AI processing)
- **Max Candidates:** Recommended < 100 candidates per request

For production use, consider:

- Implementing rate limiting
- Caching frequent lookups
- Batching requests for bulk operations

---

## Environment Variables

| Variable            | Description                            | Required |
| ------------------- | -------------------------------------- | -------- |
| `ANTHROPIC_API_KEY` | API key for Claude AI                  | ✅ Yes   |
| `SERVER_PORT`       | Port to run the server (default: 3001) | No       |

---

## Running the Server

```bash
# Install dependencies
pnpm install

# Start the server
node server/index.js

# Server will be available at http://localhost:3001
```
