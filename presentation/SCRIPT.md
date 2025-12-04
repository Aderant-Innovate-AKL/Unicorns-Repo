# Name Recognition POC - Presentation Script

## Overview

- **Duration**: ~8-10 minutes
- **Audience**: Management / Stakeholders
- **Goal**: Demonstrate AI-powered name matching for conflict checking

---

## SLIDE 1: Title (30 seconds)

**[SHOW: Title slide]**

> "Good afternoon everyone. Today I'm presenting a proof of concept for an AI-powered name
> recognition system designed to enhance our conflict checking capabilities for law
> firms."

---

## SLIDE 2: The Problem (1 minute)

**[SHOW: Problem statement slide]**

> "When law firms onboard new clients, they need to check if that client—or a related
> party—already exists in their system. This could be an existing client, or critically,
> an opposing party in another case which would create a conflict of interest."

> "The challenge is that names aren't always entered consistently. Someone might write
> 'Ltd' instead of 'Limited', make a typo like 'Srah' instead of 'Sarah', or even attempt
> a phonetic spelling of an unfamiliar name."

> "Traditional exact-match systems miss these variations, potentially exposing firms to
> ethical violations and malpractice claims."

---

## SLIDE 3: Our Solution (1 minute)

**[SHOW: Solution overview slide]**

> "Our solution combines intelligent pre-filtering with AI-powered analysis. We use fuzzy
> matching algorithms to narrow down candidates, then leverage Claude—Anthropic's large
> language model—to intelligently assess similarity and provide human-readable
> justifications."

> "The system returns results in a structured JSON format with match scores, reasons, and
> suggested actions—making it easy to integrate into existing workflows."

---

## SLIDE 4: Live Demo Introduction (30 seconds)

**[SHOW: Demo slide / Switch to browser]**

> "Let me show you how this works in practice. I have our proof of concept running locally
> with a database of over 100 test entities—both people and organizations."

**[NAVIGATE to http://localhost:3000/name-check]**

---

## DEMO SECTION 1: Basic Typo Detection (1.5 minutes)

**[TYPE: First Name = "Sara", Last Name = "Mitchell"]**

> "Let's start with a simple case. I'm entering 'Sara Mitchell'—note that I've
> intentionally misspelled Sarah without the 'h'."

**[CLICK: Check for Matches]**

> "The system immediately identifies 'Sarah Mitchell' as a very close match, with an 85%
> confidence score. The AI explains this is likely a typo—the 'h' is missing. It suggests
> we review this before creating a duplicate record."

> "This catches the kind of simple data entry errors that happen every day."

---

## DEMO SECTION 2: Acronym Matching (1.5 minutes)

**[CLEAR the form]** **[SELECT: Organization]** **[TYPE: Organization Name = "NASA"]**

> "Now let's try something more sophisticated—acronym matching. I'm searching for 'NASA'."

**[CLICK: Check for Matches]**

> "The system finds two results. First, an exact match for 'NASA' in our database. But
> more impressively, it also identifies 'National Aeronautics Space Administration' as a
> very close match—recognizing that NASA is the acronym for this full name."

> "This bidirectional acronym detection works both ways. If someone entered the full name,
> it would find the acronym version too."

---

## DEMO SECTION 3: Rare Name Detection (1.5 minutes)

**[CLEAR the form]** **[SELECT: Person]** **[TYPE: First Name = "Darvonious", Last Name =
"Williams"]**

> "Here's where the AI really shines. I'm entering 'Darvonious Williams'. Darvonious is an
> extremely rare first name."

**[CLICK: Check for Matches]**

> "The system identifies 'Darvonious Johnson' and 'Darvonious Xavier Smith' as matches.
> Even though the last names are completely different, the AI recognizes that 'Darvonious'
> is so unusual that sharing this first name is unlikely to be coincidental."

> "Importantly, this logic does NOT apply to common names. If I searched for 'John
> Williams', it would NOT match every 'John' in the database."

---

## DEMO SECTION 4: Hyphenated Surnames (1 minute)

**[CLEAR the form]** **[TYPE: First Name = "Jordan", Last Name = "Plinsky"]**

> "People with hyphenated surnames often use just one part of their name. Let's search for
> 'Jordan Plinsky'."

**[CLICK: Check for Matches]**

> "The system finds 'Jordan Plinsky-Williamson'—recognizing that Plinsky is one component
> of a hyphenated surname. This works in both directions and catches situations where the
> same person might be recorded under different versions of their name."

---

## DEMO SECTION 5: Phonetic Approximation (1 minute)

**[CLEAR the form]** **[SELECT: Organization]** **[TYPE: Organization Name =
"Coobernetties"]**

> "Finally, let's test phonetic matching. Imagine someone heard a company name but doesn't
> know how to spell it. They might write 'Coobernetties'."

**[CLICK: Check for Matches]**

> "The AI recognizes this sounds like 'Kubernetes' when spoken aloud, and flags it as a
> possible match. This catches the kinds of phonetic guesses people make with unfamiliar
> technical or foreign names."

---

## SLIDE 5: Technical Architecture (1 minute)

**[SHOW: Architecture slide]**

> "Under the hood, the system uses a two-stage approach. First, we apply fast fuzzy
> matching—Levenshtein distance, Soundex, and token overlap—to reduce thousands of records
> to a handful of candidates."

> "These candidates are then sent to Claude with a carefully crafted prompt containing our
> matching rules. The AI returns structured JSON with match scores and justifications."

> "This hybrid approach gives us the speed of traditional algorithms with the intelligence
> of modern AI."

---

## SLIDE 6: Matching Rules Summary (30 seconds)

**[SHOW: Rules slide]**

> "We've implemented rules for exact matches, typos, abbreviations, nicknames, acronyms,
> contact details, rare names, hyphenated surnames, and phonetic approximations."

> "Each rule is tuned to minimize false positives while catching genuine matches."

---

## SLIDE 7: Output Format (30 seconds)

**[SHOW: JSON output slide]**

> "The API returns clean JSON with entity IDs, names, confidence scores, match reasons,
> and suggested actions. This makes it easy to integrate into any existing system or
> workflow."

---

## SLIDE 8: Next Steps (30 seconds)

**[SHOW: Next steps slide]**

> "This proof of concept validates the approach. Next steps would include integration with
> production databases, performance optimization for larger datasets, and additional rules
> based on real-world feedback."

---

## SLIDE 9: Questions (open)

**[SHOW: Q&A slide]**

> "Thank you for your time. I'm happy to take any questions or dive deeper into any aspect
> of the system."

---

## BACKUP DEMO SCENARIOS

If you have time or get questions, these are additional impressive demos:

### Contact Detail Matching

- Enter any name with phone number `(555) 123-4567`
- System will find exact match on phone number (if it exists in test data)

### Law Firm Names

- Search for "Skadden, Arps, Slate, Meagher, & Flom LLP and Affiliates"
- Shows handling of complex legal entity names

### Irish Names (Phonetic)

- Search for "Shivawn O'Brien"
- Should match "Siobhan O'Brien" (phonetic approximation)

### Nickname Matching

- Search for "Bill Johnson"
- Should match "William Johnson" (nickname variant)
