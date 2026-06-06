# Mobility Screen Spec + Implementation Prompt

Updated implementation specification for the Magdeburg Pulse Mobility screen, including the missing decision logic needed before handing implementation to Antigravity. The logic choices below prioritize clarity, consistency, graceful fallback behavior, and a stable prototype experience. Dashboard specifications work best when they define KPI hierarchy, source priority, refresh behavior, and fallback rules ahead of implementation.[web:445][web:442]

## Mobility screen implementation spec

### Goal
Build one production-looking public-facing Mobility page for the Smart City dashboard.

This is **not** a route planner and **not** a transport operations console. It should answer one clear civic question:

**How easy is it to get around Magdeburg today?**

The page should match the approved visual direction:
- calm civic look
- off-white background
- muted teal/green accents
- rounded cards
- thin borders
- light shadows
- clean sans-serif typography
- Ask Elbe integrated consistently

### Route
`/mobility`

### Recommended stack
- Next.js / React / TypeScript
- Tailwind or CSS modules
- Leaflet for the map because it is lightweight and mobile-friendly for interactive maps.[web:423][web:425]
- Optional small API route for GTFS-RT proxy because GTFS-Realtime often needs server-side handling and CORS-safe proxying for frontend use.[web:412][web:422]

### Page sections in order
1. Top navigation
2. Page heading block
3. Status summary sentence
4. Freshness label
5. Three metric cards
6. Main mobility map card
7. “What this means today” card
8. Ask Elbe inline strip
9. Local notes card
10. Footer / principles strip if global layout does not already include it

### Heading block
Content:
- Eyebrow: `City pulse`
- Title: `Mobility`
- Subtitle: `How easy is it to get around Magdeburg today?`

### Top summary sentence
This sentence must **not** be hand-written ad hoc. It must be derived from the same logic that drives the cards so the screen stays internally consistent. Threshold-style dashboard summaries are only credible when the meaning is predefined and consistently applied.[web:431][web:437]

Allowed summary phrases:
- `Getting around feels mostly smooth today.`
- `Getting around is manageable today, with a few local slowdowns.`
- `Getting around may take a bit longer today in some areas.`
- `Getting around feels more difficult than usual today.`

### Freshness label
Show a small freshness label near the summary area.

Allowed states:
- `Updated X min ago`
- `Using latest available snapshot`
- `Live data temporarily unavailable`

Logic:
- live success within last 10 min → `Updated X min ago`
- fallback snapshot in use → `Using latest available snapshot`
- no usable live status → `Live data temporarily unavailable`

### Metric cards
Exactly 3 cards.

#### Card A — Transit flow
Fields:
- label: `Transit flow`
- value label: `Good | Moderate | Poor`
- numeric/display value: health score or percentage
- helper text

Allowed helper copy examples:
- `Buses and trams are running frequently with few delays.`
- `Some services are less regular than usual.`
- `Several delays are affecting normal movement.`

#### Card B — Disruption level
Fields:
- label: `Disruption level`
- value label: `Low | Moderate | High`
- numeric/display value: active disruptions count
- helper text

#### Card C — Moving comfort
Fields:
- label: `Moving comfort`
- value label: `Good | Fair | Limited`
- numeric/display value: short descriptor such as `Light traffic`
- helper text

Desktop: 3 equal cards in one row.
Mobile: stacked vertically.

## Logic decisions

### Source priority
Use a strict source precedence order so fallback behavior is deterministic.[web:442][web:445]

1. Live GTFS-RT / live status source
2. Preprocessed static or cached snapshot data
3. Seeded demo JSON

Rule:
- If live works, use it.
- If live fails, fall back silently to cached/preprocessed data.
- If neither exists, use seeded demo data.
- The page must never render empty primary cards if any fallback exists.

### Allowed state enums
Use fixed enums only.

```ts
export type TransitLabel = 'Good' | 'Moderate' | 'Poor';
export type DisruptionLabel = 'Low' | 'Moderate' | 'High';
export type ComfortLabel = 'Good' | 'Fair' | 'Limited';
```

No extra visible labels are allowed.

### Card scoring
Convert each visible card state into a 0–100 score so one overall mobility score can be computed.

#### Transit flow score
Preferred:
- if an actual percentage/on-time health value exists, use that value clamped to 0–100

Fallback mapping:
- Good = 90
- Moderate = 65
- Poor = 35

#### Disruption score
Convert disruption count into a positive score where fewer disruptions means a better score.

- 0 disruptions = 100
- 1–2 = 80
- 3–4 = 60
- 5–6 = 40
- 7+ = 20

#### Moving comfort score
- Good = 85
- Fair = 60
- Limited = 35

### Overall mobility score
Use one explicit weighted formula:

\[
overall = 0.5 \times transit + 0.3 \times disruption + 0.2 \times comfort
\]

Weighting rationale:
- Transit flow = 50% because it is the core mobility signal
- Disruption level = 30% because it directly affects user friction
- Moving comfort = 20% because it matters, but is secondary

### Summary mapping
Map the overall score to the top summary sentence.

- 80–100 → `Getting around feels mostly smooth today.`
- 65–79 → `Getting around is manageable today, with a few local slowdowns.`
- 50–64 → `Getting around may take a bit longer today in some areas.`
- below 50 → `Getting around feels more difficult than usual today.`

This top sentence is the single source of truth summary and must always be derived, never manually typed.

### “What this means today” logic
This card should be short, calm, and derived from the same state.

Structure:
- sentence 1: overall summary in more natural wording
- sentence 2: one practical implication or recommendation
- optional sentence 3: one corridor or disruption qualifier

Examples by state:
- Smooth → `Most everyday trips should remain manageable across the city. Short public transport trips, walking and cycling remain practical options.`
- Manageable → `Most trips are still manageable today, though a few corridors may feel slower than usual. Allow a little extra time around affected areas.`
- Slower → `Some trips may take longer today, especially near local disruption points. Planning for a small delay is sensible.`
- Difficult → `Several conditions are making movement less smooth than usual today. Extra travel time may be needed on affected corridors.`

### Recommendation logic
Allow exactly one soft recommendation in the “What this means today” copy or local notes.

Examples:
- `Best for: short city trips and cycling.`
- `Allow extra time near central corridors.`
- `Movement is smoother in outer districts than in the center.`

## Map logic

### Purpose
The map is a civic context map, not a route-planning or operations tool.

### Requirements
Use Leaflet.[web:423][web:425]

Default layers:
1. light basemap
2. Magdeburg district boundaries
3. 2–4 curated mobility corridors
4. 0–4 disruption markers if available
5. optional tiny hotspot dots only if already easy

### What stays out
- no route planner
- no filter drawer
- no complex layer switcher
- no full realtime vehicle rendering unless already trivial
- no geolocation requirement

### Map interactions
- pan and zoom allowed
- one tooltip style only
- click marker → short human-readable note
- keep controls minimal

### District boundaries
Use static district geometry from repo.

### Corridors
Use a few curated route lines, not a full network renderer.

Example corridor set:
- city center corridor
- main station corridor
- campus / university corridor
- east-west connector corridor

### Disruption marker copy
Use short notes such as:
- `Minor delay near Hauptbahnhof`
- `Roadworks affecting eastbound movement`
- `Smoother movement toward campus`

### Map fallback logic
If district geometry loads but live disruptions do not, still render the map with boundaries and corridors.

If the map data fails entirely, render a styled fallback card with:
- `Map details are temporarily unavailable.`
- `Summary indicators are still up to date.`

Empty states should preserve clarity and next-step understanding instead of showing a blank broken panel.[web:447][web:453]

## Notes logic

### Local notes card
Show exactly 3 short notes.

Priority order:
1. disruption note
2. moving comfort note
3. corridor/district context note

Implementation rule:
- derive notes if easy
- otherwise load them from seeded JSON
- each note max 1 sentence
- no note longer than ~110 characters if possible

Default seeded notes:
- `Minor delays reported around the main station corridor.`
- `Cycling conditions are better than usual this morning.`
- `Outer districts are moving more smoothly than the city center.`

If there are no disruption notes, replace with:
- `No major disruption notes right now.`

## Ask Elbe logic

### Scope
Ask Elbe on this screen should be logic-backed, not a full assistant integration.

### Visible copy
Title:
- `Ask Elbe`

Prompt chips:
- `Will getting around be easy today?`
- `Are there disruptions I should know?`
- `Is it a good day to cycle?`

### Behavior
Clicking a chip should open a small inline panel, drawer, or modal and return a templated answer derived from current page state.

Examples:
- `Will getting around be easy today?` → use overall summary + one practical recommendation
- `Are there disruptions I should know?` → use disruption count + highest-priority disruption note
- `Is it a good day to cycle?` → use moving comfort + weather/comfort rationale if available

If no drawer/modal is implemented in time, the chip can reveal a small canned-answer block directly below the strip.

## Fallback and degraded states

Define these explicitly.

### Case A — Live data works
- normal page
- freshness label shows `Updated X min ago`

### Case B — Live unavailable, fallback exists
- use fallback values
- show `Using latest available snapshot`

### Case C — No usable live or cached values
- use seeded demo values
- show `Live data temporarily unavailable`

### Case D — No disruption items
- card still shows `Low` / `0 active`
- notes include `No major disruption notes right now.`

### Case E — Map unavailable
- replace map with styled fallback message card
- keep cards and summary visible

### Case F — Partial data
- if one metric is missing, infer from fallback seed for that metric only
- do not blank the whole page because one sub-source failed

## Demo mode
Add a `demoMode` boolean.

Behavior in demo mode:
- load seeded values immediately on first render
- optionally hydrate with live data afterward
- never block the UI on live fetch completion

This improves prototype stability under time pressure and aligns with fail-safe dashboard behavior recommendations.[web:442]

## Suggested data shape

```ts
type FreshnessState = 'live' | 'snapshot' | 'unavailable';

type MobilityState = {
  freshness: {
    state: FreshnessState;
    updatedAt?: string;
    label: string;
  };
  summary: string;
  overallScore: number;
  transitFlow: {
    label: 'Good' | 'Moderate' | 'Poor';
    score: number;
    displayValue: string;
    helper: string;
  };
  disruptionLevel: {
    label: 'Low' | 'Moderate' | 'High';
    active: number;
    score: number;
    helper: string;
  };
  movingComfort: {
    label: 'Good' | 'Fair' | 'Limited';
    score: number;
    displayValue: string;
    helper: string;
  };
  notes: string[];
  recommendation?: string;
  prompts: string[];
};
```

## Suggested seed data

```ts
export const mobilitySeed: MobilityState = {
  freshness: {
    state: 'snapshot',
    updatedAt: '2026-06-06T10:45:00+02:00',
    label: 'Using latest available snapshot'
  },
  summary: 'Getting around feels mostly smooth today.',
  overallScore: 86.5,
  transitFlow: {
    label: 'Good',
    score: 91,
    displayValue: '91%',
    helper: 'Buses and trams are running frequently with few delays.'
  },
  disruptionLevel: {
    label: 'Low',
    active: 2,
    score: 80,
    helper: 'Only a few route issues are affecting travel.'
  },
  movingComfort: {
    label: 'Good',
    score: 85,
    displayValue: 'Light traffic',
    helper: 'Conditions are suitable for short trips, walking and cycling.'
  },
  notes: [
    'Minor delays reported around the main station corridor.',
    'Cycling conditions are better than usual this morning.',
    'Outer districts are moving more smoothly than the city center.'
  ],
  recommendation: 'Best for: short city trips and cycling.',
  prompts: [
    'Will getting around be easy today?',
    'Are there disruptions I should know?',
    'Is it a good day to cycle?'
  ]
};
```

## Suggested utility logic

```ts
function clampScore(value: number) {
  return Math.max(0, Math.min(100, value));
}

function transitScore(label: 'Good' | 'Moderate' | 'Poor', raw?: number) {
  if (typeof raw === 'number') return clampScore(raw);
  if (label === 'Good') return 90;
  if (label === 'Moderate') return 65;
  return 35;
}

function disruptionScore(active: number) {
  if (active === 0) return 100;
  if (active <= 2) return 80;
  if (active <= 4) return 60;
  if (active <= 6) return 40;
  return 20;
}

function comfortScore(label: 'Good' | 'Fair' | 'Limited') {
  if (label === 'Good') return 85;
  if (label === 'Fair') return 60;
  return 35;
}

function overallMobilityScore(args: {
  transit: number;
  disruptions: number;
  comfort: number;
}) {
  return 0.5 * args.transit + 0.3 * args.disruptions + 0.2 * args.comfort;
}

function mobilitySummary(score: number) {
  if (score >= 80) return 'Getting around feels mostly smooth today.';
  if (score >= 65) return 'Getting around is manageable today, with a few local slowdowns.';
  if (score >= 50) return 'Getting around may take a bit longer today in some areas.';
  return 'Getting around feels more difficult than usual today.';
}
```

## Acceptance criteria
The mobility screen is done when:
- it closely matches the approved design
- the three cards are visually and logically consistent
- the summary is derived from explicit logic
- the map loads in either full or fallback state
- Ask Elbe appears consistently and returns state-based answers
- desktop and mobile both work well
- there is no unhandled blank state
- the page demos cleanly even when live data is unavailable

Stable and coherent beats fully live but flaky.[web:442]

---

## Copy-paste Antigravity prompt

```md
Implement the `/mobility` screen for the Magdeburg Pulse Smart City dashboard.

Use the approved visual language already established in the product:
- calm civic feel
- warm off-white background
- muted teal accent
- rounded white cards
- thin subtle borders
- gentle shadow
- clean sans-serif type
- polished but understated public-sector UI

This page is NOT a route planner and NOT an operations console. It is a public civic mobility overview page that answers one question:

**How easy is it to get around Magdeburg today?**

## Build requirements
- Framework: use the existing app stack
- Route: `/mobility`
- Match the latest approved mockup as closely as possible
- Desktop first, but ensure strong mobile stacking behavior
- Prioritize implementation fidelity and stable demo behavior over ambitious live complexity
- Use seeded fallback data wherever a live integration would risk breaking the page

## Required sections in exact order
1. top navigation
2. page heading block
3. top summary sentence
4. freshness label
5. three metric cards
6. map card
7. “What this means today” card
8. Ask Elbe strip
9. Local notes card

## Heading content
- Eyebrow: `City pulse`
- Title: `Mobility`
- Subtitle: `How easy is it to get around Magdeburg today?`

## Freshness behavior
Show one of these labels near the summary:
- `Updated X min ago`
- `Using latest available snapshot`
- `Live data temporarily unavailable`

Logic:
- live success within last 10 min => `Updated X min ago`
- fallback snapshot => `Using latest available snapshot`
- no usable live status => `Live data temporarily unavailable`

## Three cards
Card 1: Transit flow
- label: `Transit flow`
- visible state labels allowed: `Good | Moderate | Poor`
- show a score or percentage such as `91%`
- helper copy should explain service regularity

Card 2: Disruption level
- label: `Disruption level`
- visible state labels allowed: `Low | Moderate | High`
- show active disruptions count such as `2 active`
- helper copy should explain whether route issues are minor or significant

Card 3: Moving comfort
- label: `Moving comfort`
- visible state labels allowed: `Good | Fair | Limited`
- show short descriptor such as `Light traffic`
- helper copy should explain travel comfort for walking, cycling, or short trips

Desktop layout:
- 3 equal cards in one row

Mobile layout:
- cards stack vertically

## Core derived logic
Do NOT hardcode the summary sentence independently. Derive it from the card state using the following logic.

### Score mappings
Transit flow score:
- if a raw numeric value exists, clamp it to 0–100
- otherwise map label to score:
  - Good = 90
  - Moderate = 65
  - Poor = 35

Disruption score from active disruption count:
- 0 => 100
- 1–2 => 80
- 3–4 => 60
- 5–6 => 40
- 7+ => 20

Moving comfort score:
- Good = 85
- Fair = 60
- Limited = 35

### Overall score formula
overall = 0.5 * transit + 0.3 * disruption + 0.2 * comfort

### Summary mapping
- 80–100 => `Getting around feels mostly smooth today.`
- 65–79 => `Getting around is manageable today, with a few local slowdowns.`
- 50–64 => `Getting around may take a bit longer today in some areas.`
- below 50 => `Getting around feels more difficult than usual today.`

This summary must always stay aligned with the cards.

## Source priority
Use this strict precedence:
1. live GTFS-RT / live status data
2. cached or preprocessed snapshot data
3. seeded demo JSON

Rules:
- if live works, use it
- if live fails, fall back silently
- if both live and cached fail, use seeded demo data
- never leave the primary cards blank if any fallback exists

## Demo mode
Add `demoMode` support.

In demo mode:
- load seeded values immediately
- optionally hydrate with live data after render
- never block first paint on a network request

## Map card
Use Leaflet.

Purpose:
- civic context map only
- not a planner
- not a complex GIS interface

Render:
1. light basemap
2. Magdeburg district boundaries
3. 2–4 curated mobility corridors
4. 0–4 disruption markers if available
5. optional tiny hotspot dots only if trivial

Keep out:
- filter drawer
- complex layer switcher
- route search
- full realtime vehicle positions unless already trivial
- geolocation requirements

Map interactions:
- allow pan and zoom
- one tooltip style only
- clicking a marker shows a short note

If live map details are missing but static geometry exists:
- still render district boundaries and corridors

If map content fails entirely:
- render a styled fallback panel with:
  - `Map details are temporarily unavailable.`
  - `Summary indicators are still up to date.`

## “What this means today” card
Short derived explanatory copy from current state.

Structure:
- sentence 1: natural-language explanation of current overall mobility condition
- sentence 2: one practical implication or recommendation
- optional sentence 3: one disruption or corridor qualifier

Allow exactly one recommendation such as:
- `Best for: short city trips and cycling.`
- `Allow extra time near central corridors.`
- `Movement is smoother in outer districts than in the center.`

## Ask Elbe strip
Include an inline assistant strip titled `Ask Elbe`.
Use the approved minimal icon consistently.

Prompt chips:
- `Will getting around be easy today?`
- `Are there disruptions I should know?`
- `Is it a good day to cycle?`

Behavior:
- clicking a chip opens a small panel, drawer, modal, or inline answer block
- each chip returns a templated answer derived from current page state
- do NOT implement a full LLM chat dependency for this prototype

Examples:
- ease question => use summary + recommendation
- disruption question => use disruption count + top disruption note
- cycle question => use moving comfort + comfort rationale

## Local notes card
Title: `Local notes`
Show exactly 3 short notes.

Priority:
1. disruption note
2. comfort note
3. corridor/district context note

Rules:
- derive notes if easy
- otherwise use seeded fallback notes
- each note must be one short sentence
- if no disruption notes exist, include `No major disruption notes right now.`

## Empty and degraded states
Implement explicit fallback states.

Case A — live data works:
- normal page
- freshness label shows `Updated X min ago`

Case B — live unavailable but fallback exists:
- use fallback values
- freshness label shows `Using latest available snapshot`

Case C — no usable live or cached data:
- use seeded demo values
- freshness label shows `Live data temporarily unavailable`

Case D — no disruption items:
- disruption card shows low/0 active
- local notes include `No major disruption notes right now.`

Case E — map unavailable:
- replace map with styled fallback card
- cards and summary remain visible

Case F — partial data:
- if one metric source is missing, use fallback for that metric only
- do not blank the whole page because one sub-source failed

## State enums
Use these exact visible labels only:

```ts
type TransitLabel = 'Good' | 'Moderate' | 'Poor';
type DisruptionLabel = 'Low' | 'Moderate' | 'High';
type ComfortLabel = 'Good' | 'Fair' | 'Limited';
```

## Suggested TS utilities
Use or adapt this logic:

```ts
function clampScore(value: number) {
  return Math.max(0, Math.min(100, value));
}

function transitScore(label: 'Good' | 'Moderate' | 'Poor', raw?: number) {
  if (typeof raw === 'number') return clampScore(raw);
  if (label === 'Good') return 90;
  if (label === 'Moderate') return 65;
  return 35;
}

function disruptionScore(active: number) {
  if (active === 0) return 100;
  if (active <= 2) return 80;
  if (active <= 4) return 60;
  if (active <= 6) return 40;
  return 20;
}

function comfortScore(label: 'Good' | 'Fair' | 'Limited') {
  if (label === 'Good') return 85;
  if (label === 'Fair') return 60;
  return 35;
}

function overallMobilityScore({ transit, disruptions, comfort }: { transit: number; disruptions: number; comfort: number; }) {
  return 0.5 * transit + 0.3 * disruptions + 0.2 * comfort;
}

function mobilitySummary(score: number) {
  if (score >= 80) return 'Getting around feels mostly smooth today.';
  if (score >= 65) return 'Getting around is manageable today, with a few local slowdowns.';
  if (score >= 50) return 'Getting around may take a bit longer today in some areas.';
  return 'Getting around feels more difficult than usual today.';
}
```

## Acceptance criteria
The page is complete when:
- it visually matches the approved mockup closely
- the top summary is derived from explicit logic
- cards, summary, and notes are logically consistent
- the map either loads correctly or falls back gracefully
- Ask Elbe is present and state-aware
- mobile layout is polished
- there are no broken or blank states
- the page demos reliably even if live data fails

If a live feature risks breaking the page, replace it with seeded demo data and keep the UI polished.
Stable and coherent beats fully live but flaky.
```
