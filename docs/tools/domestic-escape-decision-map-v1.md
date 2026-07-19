# Domestic Escape Decision Map — Dataset and Product Contract v1

Status: research and implementation-ready schema, non-live
Owner: Hook the Horizon
Work ID: HTH-WORI-2026-07-18-05

## Product job
Recommend a trip shape from constraints before naming destinations. The tool must not imply that one destination is universally best.

## Inputs
- origin region or nearest major airport, optional
- total door-to-door time tolerance
- trip length
- transport modes accepted
- budget band and price sensitivity
- desired trip shape
- temperature and weather tolerance
- crowd tolerance
- mobility and accessibility requirements
- driving tolerance
- booking lead time
- activity intensity
- food, water, culture, nature or event emphasis
- solo, couple, family or group context
- passport/border preference; v1 defaults to domestic United States only

## Trip-shape taxonomy
- Car-Free City Reset
- Food-Led Long Weekend
- Cool-Weather Reading Retreat
- Low-Logistics Nature Reset
- Water-and-Weather Window
- Event-Anchored Escape
- Shoulder-Season Recovery Trip
- Scenic Drive with One Strong Base
- Low-Crowd Weekday Itinerary
- Family Logistics Without a Military Campaign

## Dataset fields
### Identity
- destination_id
- destination_name
- state_or_territory
- region
- geographic scope

### Access
- nearest airports and current-check date
- rail/bus availability and current-check date
- typical transfer mode, not guaranteed duration
- car-free feasibility classification
- driving and seasonal-road caveats

### Timing
- suitable season bands
- heat, cold, storm, wildfire, hurricane, snow or flood exposure flags
- crowd pattern as sourced or explicitly inferred
- minimum practical stay
- booking lead-time band

### Experience
- trip-shape matches
- primary activities
- indoor fallback quality
- food/culture/nature balance
- evening activity level
- quietness and sensory considerations

### Cost
- relative cost band with methodology and checked date
- major cost drivers
- free/low-cost experience availability
- no unsupported exact total-trip price

### Accessibility and safety
- source-backed accessibility notes only
- mobility friction points
- responsible current authority links
- urgent-condition check sources
- no generic `safe destination` score

### Evidence and maintenance
- source URLs
- source type
- checked_at
- valid_until or review_due
- confidence
- unresolved fields
- commercial relationship

## Matching logic
Hard exclusions run before scoring: domestic scope, travel-time ceiling, inaccessible required mode, closed season, or current material hazard. Remaining destinations score against trip shape, logistics, weather tolerance, cost band and crowd preference. Unknown material fields lower confidence and create a confirmation step.

## Output
- recommended trip shape;
- up to three candidate destinations only when minimum data completeness is met;
- why each candidate fits;
- reasons it may not fit;
- booking and current-check sequence;
- packing and timing prompts;
- contextual publication routes.

## Conversion
Primary: email/save a trip brief and planning timeline.
Secondary: route to destination intelligence, timing, packing and travel-safety content.

Sister routes:
- Salty and Clever for food-led itineraries
- Tangled Thistle for destination gatherings
- Vanity or Vice for preparation systems
- Room for Drama for temporary lodging functionality

## Seasonal hub refresh
Refresh the shoulder-season domestic escape hub with:
- trip-shape selector as the first action;
- current conditions and closure-check architecture;
- clear checked dates;
- lead-magnet CTA and saved-result return path;
- contextual food, gathering and preparation routes;
- stale-data and temporarily unavailable states.

## GOV-DISCLAIMER-ARCH-001
Reusable Hook the Horizon policy carries broad travel and professional-boundary language.
Contextual notice:
> Conditions, prices, schedules, closures, permits and safety guidance change. Confirm current information with the responsible operator or authority before booking or departure.

Keep wildfire, hurricane, flood, storm, road, trail, evacuation, health, border and urgent warnings directly in affected records.

## Dataset example
```json
{
  "destination_id": "us-example-001",
  "destination_name": "Example",
  "scope": "city|region|park",
  "trip_shapes": [],
  "access": {},
  "season_bands": [],
  "hazard_flags": [],
  "relative_cost": {"band": null, "method": "", "checked_at": ""},
  "accessibility": {"notes": [], "sources": []},
  "evidence": [],
  "review_due": "",
  "confidence": "low|medium|high",
  "unresolved": []
}
```

## Acceptance criteria
- no destination appears without evidence, checked date and limitations;
- no generic safety rating;
- current material hazard blocks recommendation and points to authority;
- travel time and cost are ranges or classes with assumptions;
- accessible by keyboard and screen reader;
- results available without email submission;
- test fixtures cover car-free, low-budget, mobility-sensitive, weather-averse, solo and family cases;
- seasonal hub acquisition and return routing specified.

## Not authorized
No publication, booking integration, affiliate activation, deployment or collection of precise live location.