# PowerPoint Slide Content

Copy this content into your PowerPoint slides.

---

## SLIDE 1: Title

**AI-Powered Name Recognition** _Intelligent Conflict Checking for Law Firms_

Proof of Concept Demo [Your Name] | [Date]

---

## SLIDE 2: The Problem

### Why Traditional Name Matching Fails

**Data Entry Variations:**

- Typos: "Srah" vs "Sarah"
- Abbreviations: "Ltd" vs "Limited"
- Formatting: "Johnson & Partners" vs "Johnson and Partners"

**Human Memory Limitations:**

- Phonetic guesses: "Coobernetties" for "Kubernetes"
- Partial names: "Jordan Plinsky" vs "Jordan Plinsky-Williamson"

**The Risk:**

- Missed conflicts of interest
- Duplicate client records
- Ethical violations & malpractice exposure

---

## SLIDE 3: Our Solution

### AI-Powered Intelligent Matching

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Search Input  │ ──► │  Fuzzy Pre-filter │ ──► │   AI Analysis   │
│  (Name + Details)│     │  (Fast Matching)  │     │  (Claude LLM)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
                                                 ┌─────────────────┐
                                                 │  Scored Results │
                                                 │  + Justifications│
                                                 └─────────────────┘
```

**Benefits:** ✓ Catches variations humans would recognize ✓ Provides explanations, not
just scores ✓ Structured output for easy integration

---

## SLIDE 4: Live Demo

### Let's See It In Action

**Test Scenarios:**

1. Typo Detection – "Sara Mitchell"
2. Acronym Matching – "NASA"
3. Rare Name Detection – "Darvonious Williams"
4. Hyphenated Surnames – "Jordan Plinsky"
5. Phonetic Approximation – "Coobernetties"

_[Switch to browser for live demo]_

---

## SLIDE 5: Matching Rules

### What We Detect

| Rule                   | Example                                               |
| ---------------------- | ----------------------------------------------------- |
| **Exact Match**        | "NASA" = "nasa" = "N.A.S.A."                          |
| **Typos/Misspellings** | "Srah Mitchell" → "Sarah Mitchell"                    |
| **Abbreviations**      | "Ltd" ↔ "Limited", "&" ↔ "and"                      |
| **Nicknames**          | "Bill" ↔ "William", "Bob" ↔ "Robert"                |
| **Acronyms**           | "NASA" ↔ "National Aeronautics Space Administration" |
| **Contact Details**    | Same phone/email/address = match                      |
| **Rare Names**         | "Darvonious Johnson" ↔ "Darvonious Smith"            |
| **Hyphenated Names**   | "Plinsky-Williamson" ↔ "Plinsky"                     |
| **Phonetic Spelling**  | "Coobernetties" ↔ "Kubernetes"                       |

---

## SLIDE 6: API Response Format

### Clean, Structured Output

```json
[
  {
    "existingId": "ENT-0042",
    "existingName": "Sarah Mitchell",
    "matchScore": 85,
    "matchReason": "Likely typo - 'Sara' missing 'h', same last name.",
    "suggestedAction": "review"
  }
]
```

**Match Scores:**

- 95-100: Exact Match → **Merge**
- 80-94: Very Close → **Review**
- 65-79: Possible → **Investigate**
- Below 65: Distant → **Monitor**

---

## SLIDE 7: Technical Stack

### Built With

**Frontend:**

- React + TypeScript
- Vite build tool
- Material UI components

**Backend:**

- Node.js / Express
- Anthropic Claude API (claude-sonnet-4-20250514)

**Algorithms:**

- Levenshtein Distance (edit distance)
- Soundex (phonetic encoding)
- Token Overlap (word matching)
- Acronym Detection

---

## SLIDE 8: Results

### POC Achievements

✅ Successfully identifies 9 types of name variations ✅ Provides human-readable
justifications ✅ Returns structured JSON for integration ✅ Sub-second response times ✅
Tiered matching (show closest matches first)

**Test Coverage:**

- 100+ mock entities (persons & organizations)
- Verified against edge cases
- Minimal false positives

---

## SLIDE 9: Next Steps

### Path to Production

**Short Term:**

- [ ] Connect to production database
- [ ] Add authentication/authorization
- [ ] Performance benchmarking at scale

**Medium Term:**

- [ ] Fine-tune matching thresholds
- [ ] Add more language/cultural name rules
- [ ] User feedback loop for continuous improvement

**Long Term:**

- [ ] On-premise LLM deployment option
- [ ] Integration with existing intake workflows
- [ ] Audit logging for compliance

---

## SLIDE 10: Questions?

### Thank You

**Contact:** [Your Email]

**Repository:** github.com/Aderant-Innovate-AKL/Unicorns-Repo

_Branch: JacobPOC_

---

# Design Suggestions

**Color Scheme:**

- Primary: Deep blue (#1a237e) - professional, legal
- Accent: Amber (#ff8f00) - highlights, warnings
- Background: Light gray (#f5f5f5) or white

**Fonts:**

- Headers: Montserrat or Roboto Bold
- Body: Open Sans or Roboto Regular

**Icons to Use:**

- ⚖️ Legal/scales (for conflict checking)
- 🔍 Magnifying glass (for search)
- 🤖 Robot (for AI)
- ✓ Checkmarks (for benefits)
- ⚠️ Warning (for risks)
