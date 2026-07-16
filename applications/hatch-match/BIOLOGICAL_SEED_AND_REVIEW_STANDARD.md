# Hatch Match biological seed and review standard

Status: draft implementation control  
Application: `HTH-HM-001 Hatch Match`  
Release posture: no biological record is public or recommendation-eligible until it passes this standard.

## Required record fields

Each insect, non-insect forage, life-stage, or pattern-fit record must include:

- stable record ID and version;
- common label and scientific classification only to the level supported by evidence;
- life stage;
- broad region and water-type applicability;
- seasonal and time-of-day bands;
- water-temperature range only when sourced and reviewed;
- observable body, wing, tail, movement, rise-form, and water-column cues;
- likely lookalikes and disconfirming cues;
- source IDs from the governed source ledger;
- evidence state and limitations;
- reviewer name, review date, expiry date, and review scope;
- conservation, sensitive-species, and location-disclosure classification;
- publication state: `pending_review`, `approved_preview`, `approved_public`, `rejected`, or `do_not_publish`.

## Evidence separation

Do not merge these evidence classes into one universal claim:

1. Published regional calendar or reference.
2. Current official environmental data.
3. Direct user observation.
4. Contributor or guide observation.
5. Classic pattern history or convention.
6. Laboratory or material evidence.
7. Model inference.

A regional calendar can establish plausibility, not a verified current hatch. A user observation can establish what the user saw, not universal regional occurrence.

## Review gates

A record becomes `approved_preview` only when:

- at least one source is identified and current enough for its claim;
- the record has observable confirmation and disconfirmation cues;
- regional and seasonal limits are explicit;
- lookalikes and uncertainty are documented;
- exact location is absent;
- the reviewer records scope and expiry;
- any pattern connection distinguishes history, practice, and observed outcome.

A record becomes `approved_public` only after biological/editorial review and application-specific preview QA. The first seed set should remain small and representative rather than broad and weakly reviewed.

## Initial seed queue

The first reviewed seed set should cover a deliberately bounded group of profiles sufficient to test the interface and reasoning model. Until qualified review occurs, repository examples remain synthetic test fixtures and must carry `test_fixture_only` or `pending_review` state.

## Negative evidence

The data model must preserve:

- expected profile not observed;
- observed traits conflict with the candidate;
- source is stale or regionally inapplicable;
- pattern or presentation test produced no response;
- environmental conditions fall outside the reviewed range;
- identification remains ambiguous.

Negative and inconclusive records must not be discarded merely because they do not support a recommendation.
