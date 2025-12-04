# Name Recognition POC

AI-powered name matching system for law firm conflict checking.

## Overview

This proof of concept demonstrates intelligent name matching that catches:

- Typos and misspellings
- Abbreviations (Ltd/Limited, &/and)
- Acronyms (NASA ↔ National Aeronautics Space Administration)
- Nicknames (Bill ↔ William)
- Rare/unique name components
- Hyphenated surname variations
- Phonetic approximations

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- Anthropic API key

### Installation

```bash
# Install dependencies
pnpm install

# Create .env file with your API key
echo "ANTHROPIC_API_KEY=your_key_here" > .env
```

### Running

```bash
# Terminal 1: Start backend server
node server/index.js

# Terminal 2: Start frontend
pnpm dev
```

- **Frontend:** http://localhost:3000/name-check
- **API:** http://localhost:3001

## Documentation

- [API Documentation](./API.md) - Full API reference with examples
- [Presentation Materials](../presentation/) - Demo script and slides

## Project Structure

```
├── server/
│   └── index.js          # Express backend with AI integration
├── src/
│   ├── pages/
│   │   └── NameCheck/    # Main UI component
│   ├── services/
│   │   └── nameCheckService.ts  # API client & pre-filtering
│   └── data/
│       └── mockClientsAndParties.ts  # Test data
├── presentation/
│   ├── SCRIPT.md         # Presentation script
│   ├── SLIDES.md         # PowerPoint content
│   ├── DEMO_CHEATSHEET.md # Quick demo reference
│   └── slides.html       # HTML presentation
└── docs/
    ├── README.md         # This file
    └── API.md            # API documentation
```

## API Quick Reference

```bash
# Health check
curl http://localhost:3001/api/health

# Name check
curl -X POST http://localhost:3001/api/name-check \
  -H "Content-Type: application/json" \
  -d '{"searchName": "Sara Mitchell", "candidates": ["Sarah Mitchell"]}'
```

Response:

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

## Test Cases

| Search              | Expected Match                            | Rule       |
| ------------------- | ----------------------------------------- | ---------- |
| Sara Mitchell       | Sarah Mitchell                            | Typo       |
| NASA                | National Aeronautics Space Administration | Acronym    |
| Darvonious Williams | Darvonious Johnson                        | Rare name  |
| Jordan Plinsky      | Jordan Plinsky-Williamson                 | Hyphenated |
| Coobernetties       | Kubernetes Technologies                   | Phonetic   |

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Material UI
- **Backend:** Node.js, Express
- **AI:** Anthropic Claude (claude-sonnet-4-20250514)
- **Algorithms:** Levenshtein distance, Soundex, token overlap

## License

Internal use only - Aderant
