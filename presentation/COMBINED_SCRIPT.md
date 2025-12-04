# Combined Presentation Script

## Architecture + POC Demo

**Duration:** ~15 minutes  
**Presenters:** Michael (Architecture) & Jacob (POC)

---

## SLIDE 1: Title (30 seconds)

> "Good afternoon everyone. Today we're presenting our AI-powered name reconciliation
> system for law firm conflict checking. This is a joint effort—Michael designed the
> production AWS architecture, and I built a proof of concept to validate the AI matching
> engine."

---

## SLIDE 2: Agenda (30 seconds)

> "We'll cover two main areas. First, Michael's production architecture vision—the AWS
> infrastructure, vector database, and data pipelines. Then we'll dive into the proof of
> concept I built to validate that the AI matching actually works. Let's start with the
> problem we're solving."

---

## SLIDE 3: The Problem (1 minute)

> "When law firms bring on new clients, they need to check for conflicts of interest. Is
> this client already in our system? Are they an opposing party in another case?
> Traditional exact-match systems fail because names aren't entered consistently."

> "People make typos—'Srah' instead of 'Sarah'. They use abbreviations—'Ltd' versus
> 'Limited'. Sometimes they phonetically guess unfamiliar names—imagine trying to spell
> 'Kubernetes' if you've only heard it spoken."

> "Missing a conflict can lead to ethical violations, malpractice claims, and regulatory
> penalties. But AI can understand _meaning_, not just exact text—catching matches that
> humans would recognize."

---

## SLIDE 4: Production Architecture (1.5 minutes)

> "Here's the production architecture Michael designed. It's built entirely on AWS,
> running on ECS Fargate for serverless containers."

> "The flow is: user enters a name, it's converted to a 768-dimensional vector using
> Amazon Bedrock's Titan embeddings, then we do a k-NN search in OpenSearch to find
> semantically similar entities, and finally Claude analyzes the candidates to provide
> match scores and explanations."

> "This architecture can handle 350,000+ entities, with 2-4 second response times, for
> about $134 per month. The key innovation is combining vector similarity search with
> AI-powered analysis."

---

## SLIDE 5: Data Ingestion Pipeline (1 minute)

> "Data flows from Aderant's Expert SQL Server into the vector database through an hourly
> ingestion pipeline. EventBridge triggers the sync, we query for modified records only—a
> delta sync—then batch process 100 entities at a time."

> "Each entity name gets converted to a vector embedding and stored in OpenSearch.
> Metadata goes to DynamoDB. The whole thing processes about 110 entities per second—5,000
> records in under a minute."

---

## SLIDE 6: Vector Search (1 minute)

> "Why vectors? Because they capture semantic meaning. 'John Smith' and 'Jon Smyth' might
> look different as text, but in vector space they're close neighbors."

> "OpenSearch uses the HNSW algorithm for approximate nearest neighbor search. A score of
> 0.95 or higher means nearly identical. 0.85-0.94 is very similar. This pre-filtering
> step narrows thousands of entities to a handful of candidates in about 50 milliseconds."

---

## SLIDE 7: POC Introduction (1 minute)

> "Now let's talk about the proof of concept. My goal was to validate that AI can actually
> match names intelligently—with high accuracy, clear explanations, and minimal false
> positives."

> "The POC uses a simpler stack—Node.js instead of FastAPI, Anthropic API instead of
> Bedrock, mock data instead of OpenSearch. But critically, it validates the same AI
> matching logic that will run in production."

> "Think of the POC as testing the engine, while Michael's architecture is the car it'll
> be installed in."

---

## SLIDE 8: Matching Rules (1 minute)

> "We implemented nine matching rules. Text variations like typos, abbreviations, and
> nicknames. Name patterns like acronyms—NASA matching 'National Aeronautics Space
> Administration'—and hyphenated surnames."

> "The advanced rules are particularly interesting. Phonetic matching catches
> 'Coobernetties' as a likely misspelling of 'Kubernetes'. Rare name matching flags
> 'Darvonious Johnson' as a potential match for 'Darvonious Smith'—because that first name
> is so unusual, it's unlikely to be coincidental."

> "All nine rules have been tested and validated."

---

## SLIDE 9: Live Demo (3-4 minutes)

**[Switch to browser: http://localhost:3000/name-check]**

> "Let me show you the POC in action."

### Demo 1: Typo

> "First, a simple typo. I'll enter 'Sara Mitchell'—note the missing 'h'. The system finds
> 'Sarah Mitchell' with 85% confidence, explaining it's likely a typo."

### Demo 2: Acronym

> "Now acronyms. I'll search for 'NASA'. It finds both the exact match AND 'National
> Aeronautics Space Administration'—recognizing the acronym relationship."

### Demo 3: Rare Name

> "This one's clever. 'Darvonious Williams'. The system finds 'Darvonious
> Johnson'—different last name, but 'Darvonious' is so rare that sharing it is
> significant. Importantly, it does NOT do this for common names like 'John'."

### Demo 4: Hyphenated

> "'Jordan Plinsky' matches 'Jordan Plinsky-Williamson'. People often use just part of
> their hyphenated name."

### Demo 5: Phonetic

> "Finally, 'Coobernetties'—a phonetic guess at how to spell Kubernetes. The AI recognizes
> it sounds similar when spoken."

---

## SLIDE 10: API Response Format (45 seconds)

> "The API returns clean JSON with entity IDs, match scores, explanations, and suggested
> actions. Scores map to actions: 95+ is 'merge', 80-94 is 'review', and so on."

> "This structured format makes it easy to integrate into existing intake workflows."

---

## SLIDE 11: Results Summary (1 minute)

> "So what did we validate? All nine matching rules work. The AI provides clear,
> human-readable explanations. False positives are minimal—we tuned the prompts to be
> conservative."

> "Response time is 2-4 seconds, matching our production target. The tiered display shows
> closest matches first. We're confident this is ready for production integration."

---

## SLIDE 12: Path to Production (1 minute)

> "The path forward: short term, we migrate the AI calls to Amazon Bedrock and deploy
> OpenSearch with test data. Medium term, we set up ECS Fargate, load balancing, and
> monitoring. Then user acceptance testing."

> "Long term, we fine-tune thresholds based on real-world feedback and integrate with the
> client intake workflow."

> "Total estimated cost is about $134 per month for the complete production deployment."

---

## SLIDE 13: Questions

> "Thank you for your time. We're happy to answer questions—Michael on the architecture
> side, and me on the AI matching and POC."

---

## BACKUP DEMOS

If time permits or questions arise:

### Contact Detail Matching

- Enter name with phone: `(555) 123-4567`
- Shows contact-based matching

### Law Firm Names

- "Skadden, Arps, Slate, Meagher, & Flom LLP"
- Complex legal entity handling

### Fun Example 😄

- "Huge Ass" → matches "Hugh Jass"
- Phonetic matching demonstration
