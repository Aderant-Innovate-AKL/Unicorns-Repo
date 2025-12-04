# Demo Cheat Sheet

Print this out or keep it handy during your presentation.

---

## Before You Start

1. Open terminal, navigate to project folder
2. Run: `node server/index.js` (backend)
3. Run: `pnpm dev` (frontend)
4. Open: http://localhost:3000/name-check
5. Test one search to "warm up" the API

---

## Demo 1: Typo Detection ✓

| Field      | Value      |
| ---------- | ---------- |
| Type       | Person     |
| First Name | `Sara`     |
| Last Name  | `Mitchell` |

**Expected Result:** Sarah Mitchell (85%, missing 'h')

---

## Demo 2: Acronym Matching ✓

| Field | Value        |
| ----- | ------------ |
| Type  | Organization |
| Name  | `NASA`       |

**Expected Results:**

- NASA (98%, exact)
- National Aeronautics Space Administration (85%, acronym expansion)

---

## Demo 3: Rare Name Detection ✓

| Field      | Value        |
| ---------- | ------------ |
| Type       | Person       |
| First Name | `Darvonious` |
| Last Name  | `Williams`   |

**Expected Results:**

- Darvonious Johnson (85%, rare first name)
- Darvonious Xavier Smith (85%, rare first name)

---

## Demo 4: Hyphenated Surname ✓

| Field      | Value     |
| ---------- | --------- |
| Type       | Person    |
| First Name | `Jordan`  |
| Last Name  | `Plinsky` |

**Expected Result:** Jordan Plinsky-Williamson (85%, hyphenated surname component)

---

## Demo 5: Phonetic Approximation ✓

| Field | Value           |
| ----- | --------------- |
| Type  | Organization    |
| Name  | `Coobernetties` |

**Expected Result:** Kubernetes Technologies (70%, phonetic approximation)

---

## Backup Demos (if needed)

### Phonetic Name - Irish

| Field      | Value     |
| ---------- | --------- |
| Type       | Person    |
| First Name | `Shivawn` |
| Last Name  | `O'Brien` |

**Expected:** Siobhan O'Brien

### Contact Detail Match

| Field      | Value                      |
| ---------- | -------------------------- |
| Type       | Person                     |
| First Name | `Test`                     |
| Last Name  | `Person`                   |
| Email      | `sarah.mitchell@email.com` |

**Expected:** Sarah Mitchell (98%, exact email match)

### Fun One 😄

| Field      | Value  |
| ---------- | ------ |
| Type       | Person |
| First Name | `Huge` |
| Last Name  | `Ass`  |

**Expected:** Hugh Jass (phonetic match)

---

## Troubleshooting

**"No matches found" unexpectedly:**

- Check if server is running (terminal shows requests)
- Verify spelling in demo cheat sheet

**Server not responding:**

- Kill all node: `taskkill /F /IM node.exe`
- Restart: `node server/index.js`

**Page won't load:**

- Check http://localhost:3000 (not 3001)
- Restart: `pnpm dev`

---

## Key Talking Points

1. **Two-stage approach** - Fast pre-filter + AI analysis
2. **Explainable results** - Not just scores, but reasons
3. **Structured output** - Easy to integrate
4. **Configurable rules** - Can add more as needed
5. **False positive focus** - Prefer missing matches over noise
