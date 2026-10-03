# Story Corpus Roadmap

## Current status

Dedicated corpus collections already created (conventions, rights labels and extraction markers are
documented in `data/story-corpus/README.md`):

| Category | Corpus | Status |
|---|---|---|
| Ghost / supernatural | data/story-corpus/ghost | Started (12 records) |
| Crime / detective | data/story-corpus/crime | Started (18 records) |
| Thriller / suspense | data/story-corpus/thriller | Started (14 records; 2 tagged ADVENTURE) |
| Children / family | data/story-corpus/children | Started (18 records) |
| Mythology | data/story-corpus/mythology | Started (28 records; Bhagavad-Gita tagged SCRIPTURE) |
| Folklore & legends | data/story-corpus/folklore | Started (36 records) |
| Moral tales & fables | data/story-corpus/moral-tales | Started (40 records: Hitopadesha, Jataka, Oriental Tales, Thousand and One Days) |
| Epics & heroic sagas | data/story-corpus/epics | Started (materialized multilingual episodes in stories.json) |
| Rituals & customs | data/story-corpus/rituals | Started (12 records; en/hi/ar/ur text present; NEEDS_HUMAN_REVIEW) |
| Sacred places & pilgrimage | data/story-corpus/sacred-places | Started (12 records; en/hi/ar/ur text present; NEEDS_HUMAN_REVIEW) |
| Romance & love stories | data/story-corpus/romance | Started (10 records: scriptural, classical, folk and devotional love; category ROMANCE) |
| Friendship, family & relationships | data/story-corpus/friendship-family | Started (10 records; category FRIENDSHIP_FAMILY) |
| War & courage | data/story-corpus/war-courage | Started (9 records; ORIGINAL_FAITHFUL_RETELLING in en/hi/ar/ur; category WAR_COURAGE) |
| Survival & disaster | data/story-corpus/survival | Started (9 records; ORIGINAL_FAITHFUL_RETELLING in en/hi/ar/ur; category SURVIVAL) |
| Inspirational & resilience | data/story-corpus/inspirational | Started (9 records; ORIGINAL_FAITHFUL_RETELLING in en/hi/ar/ur; category INSPIRATIONAL) |
| Adult romance (18+, age-gated, non-explicit) | data/story-corpus/adult | Started (10 records; contentRating ADULT, no sacred figures) |

All collections target Hindi (hi), English (en), Arabic (ar) and Urdu (ur).

## Gaps in the started collections

- Mythology: Persian/Zoroastrian, Mesopotamian, Chinese, Japanese, African and Indigenous traditions;
  Jain narratives. A scripture collection would let the Bhagavad-Gita leave the mythology manifest.
- Folklore: Arab, Persian, Central Asian, Southeast Asian and Latin American folklore; more Hindi and
  Arabic source-language tales (Singhasan Battisi still needs a verified open edition).
- Moral tales: Panchatantra (Ryder's 1925 translation is not on Project Gutenberg; no verified open
  English edition yet), Jain and Sufi teaching tales, African and Asian animal fables.
- Epics: Iliad, Odyssey, Beowulf, Norse sagas, Shahnameh and regional heroic traditions. R. C. Dutt's
  condensed Mahabharata in verse is on Project Gutenberg (#19630, not yet catalogued); his Ramayana
  volume was not found there.
- Arabic: only nights 1-~102 and the closing Ma'ruf tale of One Thousand and One Nights are
  transcribed on ar.wikisource; The City of Brass and The Ebony Horse need another open edition.

## Remaining high-priority story categories

### 1. Adventure & Quest
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

### 2. Historical Stories
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

### 3. Biographies & Life Stories
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

### 4. Parables & Wisdom Stories
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

### 5. Festival Stories
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

### 6. Rituals & Customs
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

Status: STARTED — 12 records in data/story-corpus/rituals (Hinduism 2, Islam 2, Judaism 2,
Christianity 2, Sikhism 1, Buddhism 1, Jainism 1, Zoroastrianism 1). Gaps: wedding, naming and
funeral customs; fasting traditions; regional variants.

### 7. Sacred Places & Pilgrimage Stories
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

Status: STARTED — 12 records in data/story-corpus/sacred-places (Buddhism 3, Hinduism 2, Islam 2,
shared Jewish/Muslim/Christian site 1, Sikhism 1, Jainism 1, Christianity 1, Zoroastrianism 1).
Gaps: rivers, caves, mountains and pilgrimage routes; Africa, East Asia and the Americas.

### 8. Romance & Love Stories
Status: STARTED (10 records in data/story-corpus/romance: Layla-Majnun, Heer-Ranjha, Shirin-Farhad,
Sohni-Mahiwal, Sassi-Punnu, Jacob-Rachel, Yusuf-Zulaikha, Shakuntala, Mirabai, Dhola-Maru).

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

### 9. War & Courage Stories
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

Status: STARTED — 9 records in data/story-corpus/war-courage (non-graphic; history, scripture and legend separated).

### 10. Survival & Disaster Stories
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

Status: STARTED — 9 records in data/story-corpus/survival (scriptural floods side by side; documented modern rescues).

### 11. Friendship, Family & Relationships
Stories designed for family listening.

Status: STARTED (10 records in data/story-corpus/friendship-family: Krishna-Sudama, David-Jonathan,
Ruth-Naomi, Damon-Pythias, Rama-Bharata, Joseph and his brothers, Shravan Kumar, the Hijra companionship,
Guru Angad, Karna-Duryodhana).

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

### 12. Inspirational / Resilience Stories
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

Status: STARTED — 9 records in data/story-corpus/inspirational (documented biographies, labelled legends, myth checks).

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

After the eight collections already started:

Adventure -> Historical Stories -> Biographies -> Parables/Wisdom -> Festival Stories -> Sacred Places -> Rituals -> Romance -> War/Courage -> Survival -> Family/Relationships -> Inspirational

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
