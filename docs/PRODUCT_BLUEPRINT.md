# Product Blueprint

## Experience principle
ReligionAudio should feel like a discovery product rather than a document repository.

Primary loop:
**Discover a story -> listen -> read -> explore related people/places/texts -> ask AI -> inspect sources**

## Content lanes
### Sacred Texts
Primary texts, translations and licensed/public-domain editions.

### Stories
Narrative retellings connected to traditions, scriptures or history.

### Mythology
Traditional mythology, with the source tradition explicitly labelled.

### Local Folklore
Regional stories, oral traditions and community legends.

### Ghost Stories
Folklore/paranormal stories presented as stories and cultural beliefs, not as verified scientific facts.

### Moral Tales
Short child-friendly stories with a lesson and optional discussion questions.

### History & Scholarship
Historical context, archaeology and academic perspectives.

### Sacred Places
Sites connected to religions, traditions, stories, pilgrimage and history.

## Audience modes
- Kids: short episodes, simpler language, parent controls, gentle visuals, no frightening material by default.
- Family: listen together, discussion prompts and "what does the tradition say?" cards.
- Teens: richer stories plus source exploration.
- Adults: full texts, commentaries, advanced AI and comparative exploration.
- Research: original language, editions, citations, source metadata and scholarly notes.

## AI answer contract
Every answer should expose the lens used:
1. Text — what the retrieved primary/secondary text says.
2. Tradition — how a named tradition/commentator understands it.
3. Scholarship — historical/textual/archaeological evidence.
4. Science — empirical evidence where an empirical question exists.

Rules:
- Do not invent verses or citations.
- Do not present mythology or religious belief as established scientific fact.
- Do not silently merge traditions.
- Show uncertainty and scholarly disagreement.
- Keep AI-generated explanation visually distinct from primary text.
- Link every factual answer to source records.

## Content object
Each item should eventually contain:
id, title, slug, content_type, religion, tradition, audience, age_range,
language, original_language, summary, body, source_ids, rights_status,
evidence_status, related_text_ids, related_story_ids, related_person_ids,
related_place_ids, audio_ids, cover_asset_id, reviewer_status, created_at, updated_at.

## Sacred place object
name, alternate_names, country, region, coordinates, place_type,
religions, traditions, traditional_significance, historical_significance,
archaeological_evidence, uncertainty_notes, source_ids, image_asset_ids,
audio_ids, story_ids, text_ids.

## First editorial collection
Launch with a carefully rights-reviewed starter collection instead of scraping the whole web:
- 20-30 foundational text collections/editions
- 50-100 original stories/retellings with provenance
- 100-200 regional folklore entries
- 50-100 child-friendly moral/mythology stories
- 500 important sacred/historical places
- 50-100 people/events/concepts connecting the collection

## Engineering sequence
1. UI shell and design system
2. Database/content schemas
3. Library and story routes
4. Reader and audio player
5. Search
6. Sacred places
7. Source/rights admin
8. RAG retrieval and citation engine
9. Science/evidence mode
10. multilingual and mobile polish
