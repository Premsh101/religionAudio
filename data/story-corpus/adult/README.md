# Adult Romance Stories (18+)

This collection contains **actual adult romance story text** in English, Hindi, Arabic and Urdu.

## Audience and content rating

- **18+ only.** Every record carries `"contentRating": "ADULT"` and `"ageBand": "18+"`.
- **Age-gated in the app.** These stories must only be surfaced to verified adult listeners and must never appear in children's, family or general recommendation surfaces.
- **Mature but non-explicit.** The stories deal with desire, longing, seduction, jealousy, adultery and forbidden love, but contain no explicit sexual acts and no graphic description of sex. Intimacy is conveyed through suggestion, atmosphere and emotion, and scenes fade out.
- Every record lists specific `contentWarnings` (for example "adultery", "suicide", "execution by immurement (legend)").

## Hard editorial rules

- No minors in any romantic or sensual context. Where a source is ambiguous, the retelling states that the characters are adults; source stories in which a romantic lead is a minor (for example several Tale of Genji episodes, Layla and Majnun's childhood, Qamar al-Zaman's age in the Nights, the traditional age of Heloise) were deliberately excluded.
- No non-consensual content presented approvingly. Coercion (Adham Khan's pursuit of Roopmati, the love potion in Tristan) is named in the warnings and never romanticised.
- No deities, prophets, saints, gurus or other sacred religious figures, and no scripture.
- No communal or religious inflammatory framing. Bajirao and Mastani and Anarkali are told with neutral historical context; family and court opposition is described without assigning blame to any community.

## Editorial standard

Every record is a repository-authored **ORIGINAL_FAITHFUL_RETELLING** of a famous romance from literature, history or legend. The plots follow their sources; the wording is newly written for the corpus and does not reproduce any modern copyrighted translation.

Each record separates its layers in `evidenceType` and `evidenceNote`:

- **Documented history**: events attested in chronicles or ancient biographies (Bajirao and Mastani, Antony and Cleopatra).
- **History with legend**: a historical core with later romantic tradition (Roopmati and Baz Bahadur, Yang Guifei, Paolo and Francesca, Jamil and Buthayna).
- **Literature with a historical core**: a literary work built around real people (Khosrow and Shirin).
- **Literature or legend**: no historical claim (Tristan and Iseult, the frame story of Bilhana's Chaurapanchashika).
- **Legend with disputed basis**: popular legend whose historicity is contested (Anarkali).

## Current first-production set

10 stories are included:

1. Fifty Stanzas of a Thief: Bilhana and the Princess
2. The Pavilion Above the Valley: Roopmati and Baz Bahadur
3. The General and the Rider: Bajirao and Mastani
4. Pomegranate Blossom: The Legend of Anarkali
5. The Portrait and the Spring: Khosrow and Shirin
6. The Valley of Baghid: Jamil and Buthayna
7. The Lychee Road: Emperor Xuanzong and Yang Guifei
8. The Golden Barge: Antony and Cleopatra
9. The Cup on the Becalmed Sea: Tristan and Iseult
10. That Day We Read No Further: Paolo and Francesca

## Rights and source policy

The repository stores original retellings rather than modern copyrighted translations. Source references (Wikipedia, Project Gutenberg, LacusCurtius) are kept for historical and literary verification and are registered in `data/sources/registry.json`.

Before commercial publication, human review is required for:
- content rating and age-gate placement
- the accuracy of history / legend / literature labels
- names and transliteration (Sanskrit, Persian, Arabic, Chinese, Italian)
- Arabic and Urdu language quality
- pronunciation and TTS suitability for mature narration
- sensitivity review of Bajirao-Mastani and Anarkali

## Files

- `stories.json` — multilingual story text, content rating, warnings and evidence metadata
- `manifest.json` — inventory, content rating and language completeness
- `translation-status.json` — multilingual readiness tracking
- `GEOGRAPHY.md` — cultural and geographic coverage
