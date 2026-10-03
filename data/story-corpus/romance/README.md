# Romance & Love Stories

This collection contains **actual romance and love story text** in English, Hindi, Arabic and Urdu.

## Editorial standard

Every record is a repository-authored **ORIGINAL_FAITHFUL_RETELLING**. The wording is newly written for the corpus and does not reproduce a modern copyrighted translation. Plots follow the named source; nothing is invented.

Romance records are explicitly separated into:

- **Scriptural narratives**: love stories found in sacred texts (Genesis; the Qur'anic layer of Yusuf).
- **Classical literature**: stories given their form by a named poet or dramatist (Nizami, Jami, Kalidasa).
- **Folk romances**: qissas and ballads sung in Punjab, Sindh, Balochistan and Rajasthan.
- **Devotional love**: bhakti, where the beloved is God (Mirabai), with history and hagiography kept apart.
- **Mixed-layer stories**: where scripture and later poetry meet (Yusuf and Zulaikha), each layer is named in the text and in `evidenceNote`.

## Audience and tone

- All stories are non-explicit and family-appropriate. Temptation, marriage and wedding-night scenes are described modestly.
- Tragic endings (Layla and Majnun, Heer and Ranjha, Shirin and Farhad, Sohni and Mahiwal, Sassi and Punnu) are told gently, without graphic detail. Deaths are never shown as romantic ideals to imitate.
- Most records are tagged `12+`; scriptural and devotional records that suit younger listeners are `10+`.
- Childhood marriage (Dhola and Maru) is named as a custom of its era that is no longer accepted.

## Current first-production set

10 romance stories are included:

1. Layla and Majnun: The Poet Who Loved Too Much
2. Heer and Ranjha: The Flute by the Chenab
3. Shirin and Farhad: The Mountain of Bisotun
4. Sohni and Mahiwal: The Clay Pot on the River
5. Sassi and Punnu: Footprints in the Desert
6. Jacob and Rachel: Fourteen Years of Love
7. Yusuf and Zulaikha: From Scripture to Sufi Poem
8. Shakuntala and the Lost Ring
9. Mirabai: The Princess Who Loved Krishna
10. Dhola and Maru: The Song That Crossed the Desert

Nala and Damayanti, Savitri and Satyavan, and Orpheus and Eurydice already exist in `data/story-corpus/mythology` and are not duplicated here.

## Rights and source policy

The repository stores original retellings rather than modern copyrighted translations. Source references are retained for verification and are registered in `data/sources/registry.json`. Short quotations come only from public-domain texts (King James Version, a 16th-century pada of Mirabai) or, in the Arabic text only, from the Qur'an verbatim.

Before commercial publication, human review is required for:
- theology and religious terminology (especially the Qur'anic layer of Yusuf and Zulaikha)
- names and transliteration across four scripts
- regional variants of the folk romances
- Arabic and Urdu language quality
- pronunciation and TTS suitability
- age-band suitability of tragic endings

## Files

- `stories.json`: actual multilingual romance stories and evidence metadata
- `manifest.json`: inventory and language completeness
- `translation-status.json`: multilingual readiness tracking
- `GEOGRAPHY.md`: regional and tradition coverage
