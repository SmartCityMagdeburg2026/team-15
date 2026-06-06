# Environment Screen Spec + Logic Block + Implementation Prompt

Updated implementation specification for the Magdeburg Pulse Environment screen, including recommended datasource usage, derived logic rules, fallback behavior, and a copy-paste implementation prompt for Antigravity. The design follows a public-facing civic pattern: minimal, understandable, and focused on how the city feels rather than a technical admin dashboard. The hackathon brief emphasizes public data, understandable visualization, and visible source usage, while the user’s preferred direction is minimal, civic, and not chart-heavy.[file:457][cite:475]

## Environment screen implementation spec

### Goal
Build one production-looking public-facing Environment page for the Smart City dashboard.

This is **not** a technical sustainability reporting dashboard and **not** a sensor operations console. It should answer one citizen-facing question:

**How healthy and comfortable does Magdeburg feel today?**

The page should match the established product feel:
- calm civic look
- warm off-white background
- muted green accents
- rounded white cards
- thin borders
- soft shadows
- clean sans-serif typography
- Ask Elbe integrated consistently
- more breathable and slightly softer than the Mobility screen

### Route
`/environment`

### Recommended stack
- Next.js / React / TypeScript
- Tailwind or CSS modules
- Leaflet for map display if map is included
- Open-Meteo Air Quality API for live air-quality conditions.[web:493][web:497]
- Open-Meteo Forecast API for outdoor comfort signals like apparent temperature and wind.[web:508][web:496]
- OpenStreetMap / Overpass-derived static layers for parks and green-space overlays.[web:512][web:514][web:517]

### Page sections in order
1. Top navigation
2. Page heading block
3. Summary sentence
4. Freshness label
5. Three metric cards
6. Main environment map card
7. “What this means today” card
8. Ask Elbe inline strip
9. Local notes card
10. Footer / principles strip if not already global

### Heading block
Content:
- Eyebrow: `City pulse`
- Title: `Environment`
- Subtitle: `How healthy and comfortable does Magdeburg feel today?`

### Top summary sentence
This sentence must be derived from explicit scoring logic and must not be manually written ad hoc.

Allowed summary phrases:
- `The city feels fairly healthy and comfortable today.`
- `Environmental conditions feel mostly manageable today.`
- `Environmental conditions feel mixed across the city today.`
- `Some areas may feel less comfortable than usual today.`

### Freshness label
Show a small freshness label near the top summary.

Allowed states:
- `Updated X min ago`
- `Using latest available snapshot`
- `Live data temporarily unavailable`

Logic:
- live air/weather fetch success within last 10 min → `Updated X min ago`
- fallback snapshot in use → `Using latest available snapshot`
- no usable live status → `Live data temporarily unavailable`

## Recommended datasource plan

### Air quality
Primary source:
- Open-Meteo Air Quality API because it provides air-quality variables and AQI-oriented outputs suitable for a fast public prototype.[web:493][web:503]

Fallback:
- seeded snapshot JSON

### Urban comfort
Primary source:
- Open-Meteo Forecast API using apparent temperature, temperature, wind, and precipitation-related conditions to create a human-centered outdoor comfort score.[web:508][web:496]

Fallback:
- seeded weather comfort snapshot

### Green access
Primary source:
- OpenStreetMap / Overpass static or preprocessed green-space layers using tags such as `leisure=park` and related greenery geometry.[web:512][web:514][web:517]

Fallback:
- seeded district-level label such as `Strong`, `Moderate`, or `Uneven`

### What not to depend on for V1
- live noise feeds
- detailed biodiversity indicators
- full GIS green-coverage computation at runtime

Strategic noise maps exist, but they are generally not convenient live citizen-facing feeds for a quick prototype and should only be used if already available in the repo.[web:513][web:518]

## Metric cards
Exactly 3 cards.

### Card A — Air quality
Fields:
- label: `Air quality`
- value label: `Good | Fair | Poor`
- display value: AQI-oriented value or short readable descriptor
- helper text

Suggested helper copy:
- `Air conditions are suitable for most outdoor activity.`
- `Air conditions are acceptable, though some spots may feel less fresh.`
- `Air quality is weaker today in some parts of the city.`

### Card B — Urban comfort
Fields:
- label: `Urban comfort`
- value label: `Comfortable | Mixed | Stressed`
- display value: e.g. `Mild`, `Warm midday`, `Heat building`
- helper text

Suggested helper copy:
- `Outdoor conditions feel comfortable for walking and everyday time outside.`
- `Conditions are manageable, though sunnier or exposed areas may feel warmer.`
- `Heat or exposure may make outdoor conditions less comfortable today.`

### Card C — Green access
Fields:
- label: `Green access`
- value label: `Strong | Moderate | Uneven`
- display value: e.g. `Nearby in most districts`
- helper text

Suggested helper copy:
- `Parks and greener areas are easy to reach in many parts of the city.`
- `Green access is decent overall, but not equally distributed.`
- `Access to greener areas feels more uneven across districts.`

Desktop layout:
- 3 equal cards in one row

Mobile layout:
- cards stacked vertically

## Logic block

### Source priority
Use a strict precedence order:
1. Live Open-Meteo air/weather data[web:493][web:508]
2. Static or preprocessed OSM/repo environment layers[web:512][web:514]
3. Seeded demo JSON

Rules:
- live data should drive Air quality and Urban comfort when available
- static data should drive map structure and Green access context
- seeded data should fill any missing metric or note
- the page must never blank the main cards if a fallback exists

### Allowed state enums
Use fixed enums only.

```ts
export type AirLabel = 'Good' | 'Fair' | 'Poor';
export type ComfortLabel = 'Comfortable' | 'Mixed' | 'Stressed';
export type GreenLabel = 'Strong' | 'Moderate' | 'Uneven';
```

### Card scoring
Convert visible card states into 0–100 scores.

#### Air quality score
Preferred:
- use a normalized AQI / European AQI style output if available

Fallback mapping:
- Good = 85
- Fair = 60
- Poor = 35

#### Urban comfort score
Derive from apparent temperature, wind, precipitation, and broad exposure logic if desired.

Fallback mapping:
- Comfortable = 85
- Mixed = 60
- Stressed = 35

#### Green access score
This is primarily contextual/static for V1.

Fallback mapping:
- Strong = 80
- Moderate = 60
- Uneven = 40

### Overall environment score
Use one explicit weighted formula:

\[
overall = 0.45 \times air + 0.35 \times comfort + 0.20 \times green
\]

Weighting rationale:
- Air quality = 45% because it is the clearest public health signal.[web:482][web:493]
- Urban comfort = 35% because apparent comfort strongly shapes lived experience outdoors.[web:508][web:489]
- Green access = 20% because it matters for wellbeing and resilience, but changes less dynamically day-to-day.[web:479][web:478]

### Summary mapping
Map the overall score to the top summary sentence.

- 80–100 → `The city feels fairly healthy and comfortable today.`
- 65–79 → `Environmental conditions feel mostly manageable today.`
- 50–64 → `Environmental conditions feel mixed across the city today.`
- below 50 → `Some areas may feel less comfortable than usual today.`

### “What this means today” logic
This card should explain current conditions in natural language.

Structure:
- sentence 1: plain-language interpretation of overall conditions
- sentence 2: one practical implication or recommendation
- optional sentence 3: one area-based qualifier

Examples by state:
- Strong day → `Outdoor conditions should feel fairly comfortable in much of the city. Time outside, walking and short park visits remain practical options.`
- Manageable day → `Conditions are generally manageable today, though some exposed or busier areas may feel less pleasant. Greener and shaded areas may feel more comfortable.`
- Mixed day → `Environmental conditions vary more across the city today. It may be worth preferring greener or less exposed areas where possible.`
- Weaker day → `Some parts of the city may feel warmer, less fresh, or less comfortable than usual. Extra care may be sensible during peak outdoor hours.`

### Recommendation logic
Allow exactly one soft recommendation in the explanatory card or notes.

Examples:
- `Best for: short walks and time in greener areas.`
- `Greener and shaded areas may feel more comfortable around midday.`
- `Busier exposed corridors may feel less pleasant later in the day.`

## Map logic

### Purpose
The map is a civic environmental context map, not a technical sensor map.

### Requirements
Default layers:
1. light basemap
2. Magdeburg district boundaries
3. park / green-space overlay
4. 2–4 highlighted greener or cooler corridors
5. 2–4 warmer or more exposed zones if available
6. optional air-quality hotspot markers only if easy

### What stays out
- no sensor control panel
- no complex environmental layer switcher
- no dense legend wall
- no raw charts inside the map
- no attempt to show every data source at once

### Map interactions
- pan and zoom allowed
- one tooltip style only
- click highlighted zone → short readable note
- keep controls minimal

### Green layer handling
Use preprocessed park/green geometry if available. OSM parks and green areas are appropriate for a calm public-facing map layer.[web:514][web:499]

### Map fallback logic
If static geometry loads but live air/weather data does not, still render the environmental context map.

If the map fails entirely, show a styled fallback card with:
- `Map details are temporarily unavailable.`
- `The environment summary is still available.`

## Notes logic

### Local notes card
Show exactly 3 short notes.

Priority order:
1. air-quality note
2. comfort / heat note
3. green-space / district note

Rule:
- derive notes if easy
- otherwise use seeded notes
- each note must be short and single-sentence

Default seeded notes:
- `Air feels fresher away from busier central corridors.`
- `Greener and shaded areas may feel more comfortable around midday.`
- `Access to parks is stronger in some districts than others.`

If there is no special air event, keep the note calm rather than empty.

## Ask Elbe logic

### Scope
Ask Elbe on this screen should be logic-backed, not a full LLM feature dependency.

### Visible copy
Title:
- `Ask Elbe`

Prompt chips:
- `Is it a good day to spend time outside?`
- `Which areas feel greener or calmer today?`
- `Should I expect heat or poor air anywhere?`

### Behavior
Clicking a chip should open a small inline panel, drawer, or modal and return a templated answer derived from current page state.

Examples:
- outside question → use overall summary + recommendation
- greener/calmer question → use green-access note + area hint
- heat/air question → use air + comfort note

If interaction time is short, revealing a small answer block directly below the strip is acceptable.

## Fallback and degraded states

### Case A — Live data works
- normal page
- freshness label shows `Updated X min ago`

### Case B — Live unavailable, fallback snapshot exists
- use snapshot values
- show `Using latest available snapshot`

### Case C — No usable live or snapshot values
- use seeded demo values
- show `Live data temporarily unavailable`

### Case D — No map overlays available
- keep the card shell with fallback copy
- preserve cards, summary, and notes

### Case E — Partial data
- if air or comfort is missing, use seeded values for only that metric
- do not blank the whole page because one source fails

## Demo mode
Add `demoMode` support.

Behavior in demo mode:
- load seeded values immediately on first render
- optionally hydrate with live data afterward
- never block first paint on live fetch completion

## Suggested data shape

```ts
type FreshnessState = 'live' | 'snapshot' | 'unavailable';

type EnvironmentState = {
  freshness: {
    state: FreshnessState;
    updatedAt?: string;
    label: string;
  };
  summary: string;
  overallScore: number;
  airQuality: {
    label: 'Good' | 'Fair' | 'Poor';
    score: number;
    displayValue: string;
    helper: string;
  };
  urbanComfort: {
    label: 'Comfortable' | 'Mixed' | 'Stressed';
    score: number;
    displayValue: string;
    helper: string;
  };
  greenAccess: {
    label: 'Strong' | 'Moderate' | 'Uneven';
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
export const environmentSeed: EnvironmentState = {
  freshness: {
    state: 'snapshot',
    updatedAt: '2026-06-06T10:45:00+02:00',
    label: 'Using latest available snapshot'
  },
  summary: 'The city feels fairly healthy and comfortable today.',
  overallScore: 80.75,
  airQuality: {
    label: 'Good',
    score: 84,
    displayValue: 'Good air conditions',
    helper: 'Air conditions are suitable for most outdoor activity.'
  },
  urbanComfort: {
    label: 'Comfortable',
    score: 83,
    displayValue: 'Mild outdoors',
    helper: 'Outdoor conditions feel comfortable for walking and everyday time outside.'
  },
  greenAccess: {
    label: 'Moderate',
    score: 60,
    displayValue: 'Nearby in many districts',
    helper: 'Green access is decent overall, though not equally distributed.'
  },
  notes: [
    'Air feels fresher away from busier central corridors.',
    'Greener and shaded areas may feel more comfortable around midday.',
    'Access to parks is stronger in some districts than others.'
  ],
  recommendation: 'Best for: short walks and time in greener areas.',
  prompts: [
    'Is it a good day to spend time outside?',
    'Which areas feel greener or calmer today?',
    'Should I expect heat or poor air anywhere?'
  ]
};
```

## Suggested utility logic

```ts
function clampScore(value: number) {
  return Math.max(0, Math.min(100, value));
}

function airScore(label: 'Good' | 'Fair' | 'Poor', raw?: number) {
  if (typeof raw === 'number') return clampScore(raw);
  if (label === 'Good') return 85;
  if (label === 'Fair') return 60;
  return 35;
}

function comfortScore(label: 'Comfortable' | 'Mixed' | 'Stressed') {
  if (label === 'Comfortable') return 85;
  if (label === 'Mixed') return 60;
  return 35;
}

function greenScore(label: 'Strong' | 'Moderate' | 'Uneven') {
  if (label === 'Strong') return 80;
  if (label === 'Moderate') return 60;
  return 40;
}

function overallEnvironmentScore(args: {
  air: number;
  comfort: number;
  green: number;
}) {
  return 0.45 * args.air + 0.35 * args.comfort + 0.20 * args.green;
}

function environmentSummary(score: number) {
  if (score >= 80) return 'The city feels fairly healthy and comfortable today.';
  if (score >= 65) return 'Environmental conditions feel mostly manageable today.';
  if (score >= 50) return 'Environmental conditions feel mixed across the city today.';
  return 'Some areas may feel less comfortable than usual today.';
}
```

## Acceptance criteria
The Environment screen is done when:
- it visually matches the agreed product family while feeling a bit softer/greener than Mobility
- the three cards are visually and logically consistent
- the summary is explicitly derived from the scoring logic
- the map either loads environmental context or falls back gracefully
- Ask Elbe appears consistently and returns state-based answers
- desktop and mobile both work well
- there are no blank degraded states
- the page demos cleanly even if live air/weather data fails

Stable and understandable beats ambitious but fragile.[file:457][web:493][web:508]

---

## Copy-paste Antigravity prompt

```md
Implement the `/environment` screen for the Magdeburg Pulse Smart City dashboard.

Use the established visual language of the product:
- calm civic feel
- warm off-white background
- muted green accents
- rounded white cards
- subtle borders
- gentle shadows
- clean sans-serif typography
- polished but restrained public-sector interface

This page is NOT a technical sustainability reporting dashboard and NOT a sensor operations console. It is a public-facing civic page that answers one question:

**How healthy and comfortable does Magdeburg feel today?**

The page should feel slightly softer and greener than the Mobility screen, but clearly part of the same product family.

## Build requirements
- Framework: use the existing app stack
- Route: `/environment`
- Match the latest approved style and product direction
- Desktop first, but ensure polished mobile stacking behavior
- Prioritize stable demo behavior over ambitious live complexity
- Use seeded fallback data wherever a live integration risks breaking the page

## Required sections in exact order
1. top navigation
2. page heading block
3. top summary sentence
4. freshness label
5. three metric cards
6. environment map card
7. “What this means today” card
8. Ask Elbe strip
9. Local notes card

## Heading content
- Eyebrow: `City pulse`
- Title: `Environment`
- Subtitle: `How healthy and comfortable does Magdeburg feel today?`

## Freshness behavior
Show one of these labels near the summary:
- `Updated X min ago`
- `Using latest available snapshot`
- `Live data temporarily unavailable`

Logic:
- live air/weather success within last 10 min => `Updated X min ago`
- fallback snapshot => `Using latest available snapshot`
- no usable live status => `Live data temporarily unavailable`

## Three cards
Card 1: Air quality
- label: `Air quality`
- visible state labels allowed: `Good | Fair | Poor`
- show an AQI-oriented or readable descriptor
- helper copy should explain how suitable outdoor conditions feel

Card 2: Urban comfort
- label: `Urban comfort`
- visible state labels allowed: `Comfortable | Mixed | Stressed`
- show short descriptor such as `Mild outdoors` or `Warm midday`
- helper copy should describe overall outdoor comfort

Card 3: Green access
- label: `Green access`
- visible state labels allowed: `Strong | Moderate | Uneven`
- show descriptor such as `Nearby in many districts`
- helper copy should describe how easy greener areas are to reach

Desktop layout:
- 3 equal cards in one row

Mobile layout:
- cards stack vertically

## Datasource plan
Use this source strategy:
- Open-Meteo Air Quality API for air-quality conditions
- Open-Meteo Forecast API for urban comfort conditions
- preprocessed OSM/repo green-space and district geometry for the map
- seeded fallback JSON for any missing metric, note, or explanatory copy

Do NOT depend on live noise feeds or detailed biodiversity computation for V1.

## Core derived logic
Do NOT hardcode the summary sentence independently. Derive it from the card state using the following logic.

### Score mappings
Air quality score:
- if a raw normalized value exists, clamp it to 0–100
- otherwise map label to score:
  - Good = 85
  - Fair = 60
  - Poor = 35

Urban comfort score:
- Comfortable = 85
- Mixed = 60
- Stressed = 35

Green access score:
- Strong = 80
- Moderate = 60
- Uneven = 40

### Overall score formula
overall = 0.45 * air + 0.35 * comfort + 0.20 * green

### Summary mapping
- 80–100 => `The city feels fairly healthy and comfortable today.`
- 65–79 => `Environmental conditions feel mostly manageable today.`
- 50–64 => `Environmental conditions feel mixed across the city today.`
- below 50 => `Some areas may feel less comfortable than usual today.`

This summary must always stay aligned with the cards.

## Source priority
Use this strict precedence:
1. live air/weather data
2. cached or preprocessed static environment layers
3. seeded demo JSON

Rules:
- live should drive Air quality and Urban comfort if available
- static layers should drive map structure and Green access context
- seeded data should fill any gaps
- never leave the primary cards blank if any fallback exists

## Demo mode
Add `demoMode` support.

In demo mode:
- load seeded values immediately
- optionally hydrate with live data after render
- never block first paint on a network request

## Map card
Use a calm civic environment map.

Purpose:
- civic environmental context map only
- not a technical sensor map
- not a GIS-heavy exploration tool

Render:
1. light basemap
2. Magdeburg district boundaries
3. park / green-space overlay
4. 2–4 highlighted greener or cooler corridors
5. 2–4 warmer or more exposed zones if available
6. optional air-quality hotspots only if trivial

Keep out:
- complex environmental layer switcher
- raw charts in the map
- dense technical legends
- every possible sensor overlay

Map interactions:
- allow pan and zoom
- one tooltip style only
- clicking a highlighted area shows a short readable note

If static geometry exists but live air/weather details are missing:
- still render boundaries and green-space context

If map content fails entirely:
- render a styled fallback panel with:
  - `Map details are temporarily unavailable.`
  - `The environment summary is still available.`

## “What this means today” card
Short derived explanatory copy from current state.

Structure:
- sentence 1: natural-language explanation of current overall environmental conditions
- sentence 2: one practical implication or recommendation
- optional sentence 3: one area-based qualifier

Allow exactly one soft recommendation such as:
- `Best for: short walks and time in greener areas.`
- `Greener and shaded areas may feel more comfortable around midday.`
- `Busier exposed corridors may feel less pleasant later in the day.`

## Ask Elbe strip
Include an inline assistant strip titled `Ask Elbe`.
Use the approved minimal icon consistently.

Prompt chips:
- `Is it a good day to spend time outside?`
- `Which areas feel greener or calmer today?`
- `Should I expect heat or poor air anywhere?`

Behavior:
- clicking a chip opens a small panel, drawer, modal, or inline answer block
- each chip returns a templated answer derived from current page state
- do NOT implement a full LLM dependency for this prototype

Examples:
- outside question => use summary + recommendation
- greener/calmer question => use green-access note + area hint
- heat/air question => use air + comfort note

## Local notes card
Title: `Local notes`
Show exactly 3 short notes.

Priority:
1. air-quality note
2. comfort / heat note
3. green-space / district note

Rules:
- derive notes if easy
- otherwise use seeded fallback notes
- each note must be one short sentence

Suggested fallback notes:
- `Air feels fresher away from busier central corridors.`
- `Greener and shaded areas may feel more comfortable around midday.`
- `Access to parks is stronger in some districts than others.`

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

Case D — no map overlays available:
- replace map details with styled fallback copy
- cards, summary, and notes remain visible

Case E — partial data:
- if one metric is missing, use fallback for that metric only
- do not blank the whole page because one sub-source failed

## State enums
Use these exact visible labels only:

```ts
type AirLabel = 'Good' | 'Fair' | 'Poor';
type ComfortLabel = 'Comfortable' | 'Mixed' | 'Stressed';
type GreenLabel = 'Strong' | 'Moderate' | 'Uneven';
```

## Suggested TS utilities
Use or adapt this logic:

```ts
function clampScore(value: number) {
  return Math.max(0, Math.min(100, value));
}

function airScore(label: 'Good' | 'Fair' | 'Poor', raw?: number) {
  if (typeof raw === 'number') return clampScore(raw);
  if (label === 'Good') return 85;
  if (label === 'Fair') return 60;
  return 35;
}

function comfortScore(label: 'Comfortable' | 'Mixed' | 'Stressed') {
  if (label === 'Comfortable') return 85;
  if (label === 'Mixed') return 60;
  return 35;
}

function greenScore(label: 'Strong' | 'Moderate' | 'Uneven') {
  if (label === 'Strong') return 80;
  if (label === 'Moderate') return 60;
  return 40;
}

function overallEnvironmentScore({ air, comfort, green }: { air: number; comfort: number; green: number; }) {
  return 0.45 * air + 0.35 * comfort + 0.20 * green;
}

function environmentSummary(score: number) {
  if (score >= 80) return 'The city feels fairly healthy and comfortable today.';
  if (score >= 65) return 'Environmental conditions feel mostly manageable today.';
  if (score >= 50) return 'Environmental conditions feel mixed across the city today.';
  return 'Some areas may feel less comfortable than usual today.';
}
```

## Acceptance criteria
The page is complete when:
- it visually matches the approved product family
- it feels slightly greener/softer than Mobility
- the top summary is derived from explicit logic
- cards, summary, and notes are logically consistent
- the map either loads correctly or falls back gracefully
- Ask Elbe is present and state-aware
- mobile layout is polished
- there are no broken or blank states
- the page demos reliably even if live data fails

If a live feature risks breaking the page, replace it with seeded demo data and keep the UI polished.
Stable and understandable beats ambitious but fragile.
```
