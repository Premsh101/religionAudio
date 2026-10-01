# ReligionAudio local TTS

This service is the local, engine-agnostic TTS boundary used by the Next.js app.

## Local development

```bash
cd tts-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8010
```

The current implementation returns a deterministic silent WAV placeholder. This is deliberate: it lets the application, audio player, profile selection and Coolify networking be tested without a paid API.

## KVM production

Deploy this directory as a separate Coolify service. Set `TTS_OUTPUT_DIR` to persistent storage if generated audio is temporarily stored locally. Install an open local engine behind `/synthesize` when the GPU/CPU budget has been validated. The Next.js contract does not need to change.

Recommended progression:

1. Kokoro for efficient general narration.
2. Chatterbox only where expressive narration is worth the extra compute.
3. Browser speech only as an emergency client-side fallback.

Do not put provider API keys in the web container for local narration.
