# Hatch Match biological seed and review standard

Application: `HTH-HM-001`  
Status: active proportional control

## Operating rule

Hatch Match development is autonomous. Records, tests, previews, taxonomy, source updates, and ordinary corrections do not require generic human approval. Review is record-specific and risk-based.

A biological record may enter preview recommendations when it has:

- a stable ID and version;
- a source ID and review date;
- a broad region and water-type scope;
- life-stage and observable confirmation cues;
- at least one disconfirming cue or lookalike note;
- a freshness or expiry rule;
- no exact location or vulnerable-water disclosure;
- an evidence state and limitations;
- a publication state.

## Publication states

- `test_fixture_only` — synthetic or deliberately nonpublic logic fixture;
- `approved_preview` — sufficient for bounded preview use;
- `approved_public` — sufficient for ordinary public application use;
- `pending_review` — incomplete but usable for research and drafting;
- `rejected` — not suitable;
- `do_not_publish` — blocked by evidence, conservation, privacy, or safety risk.

## Proportional checks

The record can be reviewed by the implementing AI against current primary and authoritative sources. A separate human reviewer is required only when the record would:

- assert firsthand field observation or personal testing;
- expose exact or sensitive location data;
- affect vulnerable species or waters with plausible conservation harm;
- make a regulation, safety, or professional claim beyond approved boundaries;
- remain materially uncertain after source reconciliation.

The narrow exception applies only to the affected record. It does not pause taxonomy work, interface work, source ingestion, tests, or unrelated records.

## Evidence separation

Keep these evidence classes distinct:

1. regional calendar or reference;
2. current official environmental data;
3. direct user observation;
4. contributor or guide observation;
5. classic pattern history or practice;
6. laboratory or material evidence;
7. model inference.

A regional calendar establishes plausibility, not a verified current hatch. An observation establishes what was seen, not universal occurrence.

## Required negative evidence

Preserve:

- expected profile not observed;
- traits that conflict with the candidate;
- stale or regionally inapplicable sources;
- unsuccessful or inconclusive field tests;
- conditions outside the reviewed range;
- unresolved identification ambiguity.

Negative evidence is part of the intelligence record and must not be discarded because it weakens a recommendation.
