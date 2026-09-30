# Narration Architecture

Narration is a first-class content property. A voice is the speaker identity; a profile is how that voice performs the material.

## Profiles

**Scripture** — slower, calm, deliberate, respectful; no cinematic effects.

**Mythology** — warm cinematic delivery with controlled emotion.

**Local folklore** — intimate oral-storytelling cadence, more pauses and anticipation.

**Ghost stories** — slower, tense and atmospheric; long pauses; never present the paranormal story as scientifically verified.

**Kids** — warm, clear, energetic and friendly; avoid an exaggerated cartoon voice.

**Moral tales** — bright, easy-to-follow delivery with slightly longer pauses around the lesson.

## Free self-hosted TTS strategy

1. Piper: lightweight local baseline. The Piper software is MIT licensed, but each voice model carries its own licence and must be checked before commercial use.
2. Chatterbox: expressive optional engine. The current project exposes emotion/exaggeration controls and multilingual models, with Hindi support documented in its multilingual release. Use licensed reference voices only.
3. Browser SpeechSynthesis: zero-cost development fallback when the local service is unavailable. It is not the production narration engine because voice availability and expressive controls vary by device/browser.

## Production rule

Never make a single voice responsible for every genre. Configure voice identity + narration profile + language independently.

Recommended record:

voice_id, owner, licence, language, permitted_genres, reference_audio, attribution, expiry_review_date.

## Audio generation

Text -> semantic chunks -> narration profile -> selected TTS engine -> chunk audio -> controlled silence -> master audio -> timestamps -> object storage.

For scripture, timestamps should map to verse IDs. For stories, timestamps should map to scene/paragraph IDs.

## Suggested engine selection

- Scripture: Piper or a licensed professional recording; optional Chatterbox only for explanatory narration.
- Mythology: Chatterbox preferred when expressive hardware is available; Piper fallback.
- Folklore/Ghost: Chatterbox preferred with a licensed narrator reference clip; Piper fallback plus pause shaping.
- Kids: Chatterbox or Piper depending language/voice quality.
