# Audio pipeline

`POST /api/audio/plan` accepts text, narration profile and language and returns deterministic audiobook segments.

The planner keeps each segment small enough for local TTS, estimates a timeline, and preserves sequence order. Generation/storage is intentionally separate from planning so a failed TTS request can be retried for one segment only.

Next implementation layer: create an `AudioAsset`, synthesize each segment through `TTS_SERVICE_URL`, upload the resulting WAV/MP3 to persistent storage, then create `AudioSegment` rows linked to passages or story scenes.
