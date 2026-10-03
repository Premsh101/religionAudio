# Story Corpus Roadmap

## Current status

Dedicated corpus collections already created:

| Category | Corpus | Status |
|---|---|---|
| Ghost / supernatural | data/story-corpus/ghost | Started |
| Crime / detective | data/story-corpus/crime | Started |
| Thriller / suspense | data/story-corpus/thriller | Started |
| Children / family | data/story-corpus/children | Started |

All four collections target Hindi (hi), English (en), Arabic (ar) and Urdu (ur).

## Remaining high-priority story categories

### 1. Mythology
Core religious and mythological narratives.

Coverage:
- Hindu
- Buddhist
- Jain
- Greek
- Roman
- Norse
- Egyptian
- Mesopotamian
- Celtic
- Persian / Zoroastrian
- Chinese
- Japanese
- African traditions
- Indigenous traditions where open or permission-cleared sources exist

Story types:
- creation stories
- gods and goddesses
- heroes
- divine encounters
- origin narratives
- cosmological stories
- sacred quests

Priority: VERY HIGH

### 2. Folklore & Legends
Traditional stories that are not necessarily mythology.

Coverage:
- Indian regional folklore
- Arab folklore
- Persian folklore
- Central Asian folklore
- European folklore
- African folklore
- East Asian folklore
- Southeast Asian folklore
- Latin American folklore

Subcategories:
- legends
- trickster tales
- supernatural folklore
- origin legends
- village tales
- wisdom folklore

Priority: VERY HIGH

### 3. Moral Tales & Fables
Short stories with a clear lesson.

Coverage:
- Panchatantra
- Hitopadesha
- Jataka tales
- Aesop
- Kalila wa Dimna
- Jain moral stories
- Buddhist moral stories
- Sufi teaching tales
- regional Indian moral tales
- African and Asian animal fables

Priority: VERY HIGH

### 4. Epics & Heroic Sagas
Long-form narrative material.

Coverage:
- Ramayana
- Mahabharata
- Puranic heroic narratives
- Iliad
- Odyssey
- Beowulf
- Norse sagas
- Shahnameh
- regional heroic traditions

Recommended implementation:
Store the full canonical or openly licensed work separately, then create story-level episodes from chapters or books.

Priority: VERY HIGH

### 5. Adventure & Quest
Story-first adventure independent of thriller/crime.

Subcategories:
- treasure hunt
- lost city
- sea voyage
- mountain journey
- wilderness survival
- magical quest
- pilgrimage journey
- heroic journey
- exploration

Priority: HIGH

### 6. Historical Stories
Narratives connected to documented historical people or events.

Subcategories:
- kings and kingdoms
- battles
- discoveries
- migrations
- ancient civilizations
- medieval history
- cultural encounters
- historical mysteries

Important:
Keep historical fact, legend and later tradition explicitly separated with evidence metadata.

Priority: HIGH

### 7. Biographies & Life Stories
Lives of important religious, cultural and historical figures.

Coverage:
- prophets
- saints
- sages
- philosophers
- reformers
- spiritual teachers
- poets
- historical leaders
- scientists and inventors where relevant

Story format:
- childhood
- turning point
- major event
- teaching
- legacy

Priority: HIGH

### 8. Parables & Wisdom Stories
Short narrative teachings.

Coverage:
- Buddhist parables
- Jain teachings
- Hindu wisdom stories
- Sufi tales
- Christian parables
- Jewish wisdom traditions
- Sikh teaching narratives
- Zen stories
- regional wisdom tales

Priority: HIGH

### 9. Festival Stories
Stories explaining the origin, significance or cultural memory of festivals.

Coverage examples:
- Diwali
- Holi
- Navratri
- Janmashtami
- Ram Navami
- Ganesh Chaturthi
- Buddha Purnima
- Mahavir Jayanti
- Eid traditions
- Ramadan stories
- Christmas
- Easter
- Hanukkah
- Passover
- Vaisakhi
- Gurpurab
- Nowruz
- regional festivals

Each narrative should be marked as scriptural, traditional, historical, folkloric or modern cultural account.

Priority: HIGH

### 10. Rituals & Customs
Story-driven explanations of religious and cultural practices.

Examples:
- why a ritual is performed
- origin traditions
- wedding customs
- funeral customs
- pilgrimage practices
- fasting traditions
- prayer traditions
- seasonal customs

Best format:
A short factual explanation plus an optional traditional story.

Priority: MEDIUM-HIGH

### 11. Sacred Places & Pilgrimage Stories
Place-based storytelling.

Coverage:
- temples
- mosques
- churches
- synagogues
- monasteries
- gurudwaras
- shrines
- caves
- mountains
- rivers
- pilgrimage routes

Story subtypes:
- foundation legend
- miracle tradition
- historical event
- pilgrimage experience
- archaeological account

The current Place model already supports this category directly.

Priority: MEDIUM-HIGH

### 12. Romance & Love Stories
A major general-story genre currently missing.

Coverage:
- legendary couples
- tragic love
- devotional love
- folk romances
- historical romances
- classical epics
- Sufi love narratives

Traditions to investigate:
- Heer-Ranjha
- Sohni-Mahiwal
- Laila-Majnun
- Shirin-Farhad
- Sassi-Punnu
- regional Indian romances

Use audience metadata carefully.

Priority: MEDIUM-HIGH

### 13. War & Courage Stories
Stories centered on conflict, sacrifice, strategy and courage.

Coverage:
- historical battles
- heroic resistance
- warrior legends
- non-graphic courage stories
- military leadership narratives
- survival during conflict

Separate documented history from later heroic tradition.

Priority: MEDIUM

### 14. Survival & Disaster Stories
High-engagement narrative category.

Subcategories:
- survival at sea
- wilderness
- famine
- natural disasters
- lost travelers
- rescue
- endurance

For real events, distinguish eyewitness or documented history from later retelling.

Priority: MEDIUM

### 15. Friendship, Family & Relationships
Stories designed for family listening.

Subcategories:
- parent and child
- siblings
- friendship
- loyalty
- sacrifice
- forgiveness
- reconciliation
- community

Priority: MEDIUM

### 16. Inspirational / Resilience Stories
Character-driven stories about overcoming adversity.

Subcategories:
- poverty to success
- courage
- education
- kindness
- perseverance
- ethical decisions

Avoid turning inspirational storytelling into unsupported biographies.

Priority: MEDIUM

## Categories that should not become separate ContentType values yet

These are better represented as subcategories, themes, tags or filters:

- romance
- adventure
- survival
- war
- friendship
- family
- mystery
- psychological
- fantasy
- comedy
- tragedy
- travel
- treasure hunt
- hero
- trickster
- animal story
- bedtime
- devotional
- origin story

The ContentType should remain focused on the semantic kind of content; genre and theme can be represented separately.

## Recommended build order

After the four collections already started:

Mythology -> Folklore & Legends -> Moral Tales & Fables -> Epics & Heroic Sagas -> Adventure -> Historical Stories -> Biographies -> Parables/Wisdom -> Festival Stories -> Sacred Places -> Rituals -> Romance -> War/Courage -> Survival -> Family/Relationships -> Inspirational

## Multilingual rule

Every story ultimately needs:
1. canonical/source language
2. English
3. Hindi
4. Arabic
5. Urdu

Use one canonical source edition. Do not translate a summary into another language and label it as the full story. Use source-locked translation followed by semantic QA.

## Rights rule

For every category record:
- exact source edition
- source URL
- author or tradition
- publication date where known
- underlying-work rights
- scan/transcription rights
- translation rights
- jurisdiction notes

For oral and traditional stories, identify the tradition and source edition instead of implying one universally authoritative wording.

## Target corpus scale

Practical first production target:
- 50+ stories per major category
- 20+ stories per secondary category
- 100+ stories for mythology, folklore and moral/fable collections
- long works split into chapter or episode-level stories where editorially appropriate

At four publication languages, this creates a substantially larger listening catalogue without requiring four independently sourced copies of every narrative.
