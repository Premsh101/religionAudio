import hashlib
import json
import os
import re
import shutil
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

_KOKORO_PIPELINES = {}
_CHATTERBOX_MODELS = {}

BASE = Path(__file__).parent
AUDIO_DIR = Path(os.getenv("AUDIO_DIR", "/data/audio"))
MODEL_DIR = Path(os.getenv("PIPER_MODEL_DIR", "/models"))
PROFILES = json.loads((BASE / "profiles.json").read_text(encoding="utf-8"))
AUDIO_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="ReligionAudio Local TTS", version="0.2.0")
app.mount("/audio", StaticFiles(directory=AUDIO_DIR), name="audio")


class TTSRequest(BaseModel):
    text: str = Field(min_length=1, max_length=12000)
    language: str = "en"
    profile: str = "default"
    voice: str | None = None
    reference_audio: str | None = None
    engine: str | None = None
    speed: float | None = Field(default=None, ge=0.5, le=1.5)
    rate: float | None = Field(default=None, ge=0.5, le=1.5)
    pause_ms: int | None = Field(default=None, ge=0, le=3000)
    pitch: float | None = Field(default=None, ge=-2, le=2)
    emotion: str | None = None
    instructions: str | None = None
    voice_gender: str | None = None  # "female" | "male"; falls back to the profile's default_gender
    format: str = Field(default="wav", pattern="^(wav|mp3)$")
    # Pause to leave at the end of the file, so the next part of a long narration follows naturally.
    trail: str | None = Field(default=None, pattern="^(paragraph|sentence|none)$")


# Bump when the way audio is assembled changes, so cached files from the old method are not reused.
PIPELINE_VERSION = "2"
SILENCE_THRESHOLD = 10 ** (-45 / 20)  # -45 dBFS
EDGE_PAD_S = 0.03
FADE_S = 0.008
LEAD_IN_S = 0.08
TARGET_RMS = 10 ** (-20 / 20)
PEAK_LIMIT = 10 ** (-1 / 20)


def normalize_text(text: str) -> str:
    """Tidy punctuation so the voice reads full stops, commas and paragraph breaks naturally."""
    text = text.replace("\r\n", "\n").replace("...", "…")
    text = re.sub(r"\s+--\s+", " — ", text)
    paragraphs = []
    for paragraph in re.split(r"\n\s*\n", text):
        p = re.sub(r"\s+", " ", paragraph).strip()
        if not p:
            continue
        # A heading or verse without closing punctuation would run straight into the next paragraph.
        if re.search(r"[\w\u0900-\u097F\u0600-\u06FF]$", p):
            p += "।" if re.search(r"[\u0900-\u097F]", p[-12:]) else "."
        paragraphs.append(p)
    return "\n\n".join(paragraphs)


def sentences_of(paragraph: str, limit: int = 600) -> list[str]:
    sentences = [s.strip() for s in re.split(r"(?<=[.!?।؟…])\s+|(?<=[.!?।؟…][\"'”’)\]])\s+", paragraph) if s.strip()]
    out: list[str] = []
    for sentence in sentences:
        if len(sentence) <= limit:
            out.append(sentence)
            continue
        current, size = [], 0
        for word in sentence.split():
            if current and size + len(word) + 1 > limit:
                out.append(" ".join(current))
                current, size = [], 0
            current.append(word)
            size += len(word) + 1
        if current:
            out.append(" ".join(current))
    return out


def tidy_wave(wave: "np.ndarray", rate: int) -> "np.ndarray":
    """Trim the engine's own leading/trailing silence (we add measured pauses instead) and soften the edges."""
    wave = np.asarray(wave, dtype=np.float32)
    if wave.ndim > 1:
        wave = wave.mean(axis=1)
    loud = np.flatnonzero(np.abs(wave) > SILENCE_THRESHOLD)
    if loud.size:
        pad = int(rate * EDGE_PAD_S)
        wave = wave[max(0, loud[0] - pad): min(len(wave), loud[-1] + pad)]
    fade = min(int(rate * FADE_S), len(wave) // 4)
    if fade > 1:
        ramp = np.linspace(0.0, 1.0, fade, dtype=np.float32)
        wave = wave.copy()
        wave[:fade] *= ramp
        wave[-fade:] *= ramp[::-1]
    return wave


def silence(rate: int, ms: int) -> "np.ndarray":
    return np.zeros(int(rate * ms / 1000), dtype=np.float32)


def level(wave: "np.ndarray") -> "np.ndarray":
    """Even loudness across every part of a narration, without clipping."""
    voiced = wave[np.abs(wave) > SILENCE_THRESHOLD]
    if not voiced.size:
        return wave
    rms = float(np.sqrt(np.mean(voiced ** 2)))
    peak = float(np.max(np.abs(wave)))
    gain = min(TARGET_RMS / max(rms, 1e-6), PEAK_LIMIT / max(peak, 1e-6))
    return (wave * gain).astype(np.float32)


def pause_after(text: str, profile: dict, paragraph_end: bool = False) -> int:
    base = int(profile["pause_ms"])
    if paragraph_end:
        return int(profile.get("paragraph_pause_ms", base * 2))
    end = text.rstrip().rstrip("\"'”’)")
    if end.endswith(("…", "...", "—", "--")):
        # Trailing off / cut-off lines carry the suspense in ghost, mystery and thriller profiles.
        return int(base * float(profile.get("suspense_factor", 1.3)))
    if end.endswith(("!", "?", "।", "؟")):
        return int(base * 1.35)
    if end.endswith("."):
        return base
    if end.endswith((",", ";", ":")):
        return int(base * 0.45)
    return int(base * 0.75)


def profile_key(name: str) -> str:
    return (name or "default").strip().lower().replace("_", "-")


def resolve_voice(req: "TTSRequest", profile: dict) -> str | None:
    if req.voice:
        return req.voice
    language = req.language.lower()
    voices = profile.get("voices") or {}
    choice = voices.get(language) or voices.get(language.split("-")[0])
    if isinstance(choice, dict):
        gender = (req.voice_gender or profile.get("default_gender") or "female").lower()
        return choice.get(gender) or choice.get("female") or next(iter(choice.values()), None)
    return choice


def encode_mp3(source: Path, output: Path) -> None:
    import subprocess
    proc = subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(source), "-ac", "1", "-codec:a", "libmp3lame", "-b:a", "64k", str(output)],
        stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False,
    )
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.decode("utf-8", errors="ignore"))


def resolve_profile(req: TTSRequest) -> dict:
    profile = dict(PROFILES.get(profile_key(req.profile), PROFILES["default"]))
    if req.engine:
        profile["engine"] = req.engine
    if req.speed is not None:
        profile["speed"] = req.speed
    elif req.rate is not None:
        profile["speed"] = req.rate
    if req.pause_ms is not None:
        profile["pause_ms"] = req.pause_ms
    return profile


def piper_generate(text: str, language: str, voice: str | None, speed: float, output: Path) -> None:
    model = voice or os.getenv(f"PIPER_VOICE_{language.upper()}")
    if not model:
        raise RuntimeError(f"No Piper voice configured for {language}.")
    model_path = Path(model)
    if not model_path.is_absolute():
        model_path = MODEL_DIR / model
    config_path = Path(str(model_path) + ".json")
    if not model_path.exists() or not config_path.exists():
        raise RuntimeError(f"Piper model/config not found: {model_path}")
    import subprocess
    proc = subprocess.run(
        ["piper","--model",str(model_path),"--config",str(config_path),
         "--length_scale",str(1.0 / speed),"--output_file",str(output)],
        input=text.encode("utf-8"), stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False,
    )
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.decode("utf-8", errors="ignore"))


def kokoro_chunks(text: str, language: str, voice: str | None, speed: float) -> tuple[list[tuple[str, "np.ndarray"]], int]:
    """A whole paragraph in one call: Kokoro phrases the sentences together, which sounds far more natural
    than reading each sentence on its own. Returns (text, audio) per phrase group and the sample rate."""
    try:
        from kokoro import KPipeline
    except Exception as exc:
        raise RuntimeError("Kokoro is not installed") from exc

    lang_code = {"en":"a","en-us":"a","en-gb":"b","hi":"h","fr":"f","es":"e","it":"i","pt":"p","ja":"j","zh":"z"}.get(language.lower())
    if not lang_code:
        raise RuntimeError(f"Kokoro language is not configured for {language}")
    selected_voice = voice or os.getenv(f"KOKORO_VOICE_{language.upper()}")
    if not selected_voice:
        selected_voice = {"a":"af_heart","b":"bf_emma","h":"hf_alpha","f":"ff_siwis","e":"ef_dora","i":"if_sara","p":"pf_dora","j":"jf_alpha","z":"zf_xiaobei"}.get(lang_code)
    if not selected_voice:
        raise RuntimeError(f"No Kokoro voice configured for {language}")
    pipeline = _KOKORO_PIPELINES.get(lang_code)
    if pipeline is None:
        pipeline = KPipeline(lang_code=lang_code)
        _KOKORO_PIPELINES[lang_code] = pipeline
    chunks: list[tuple[str, np.ndarray]] = []
    for graphemes, _, audio in pipeline(text, voice=selected_voice, speed=speed, split_pattern=r"\n+"):
        if audio is not None:
            data = audio.numpy() if hasattr(audio, "numpy") else np.asarray(audio)
            chunks.append((str(graphemes or ""), data))
    if not chunks:
        raise RuntimeError("Kokoro produced no audio")
    return chunks, 24000


def file_chunks(make, text: str, work: Path, tag: str) -> tuple[list[tuple[str, "np.ndarray"]], int]:
    """Engines that write files (Chatterbox, Piper) are fed one sentence at a time."""
    chunks, rate = [], None
    for index, sentence in enumerate(sentences_of(text)):
        output = work / f"{tag}-{index:04d}.wav"
        make(sentence, output)
        data, r = sf.read(output, dtype="float32")
        rate = rate or r
        chunks.append((sentence, data))
    if not chunks:
        raise RuntimeError("No text to narrate")
    return chunks, rate or 22050


def chatterbox_generate(text: str, language: str, reference_audio: str | None, exaggeration: float, cfg_weight: float, output: Path) -> None:
    try:
        import torch
        import torchaudio as ta
        from chatterbox.mtl_tts import ChatterboxMultilingualTTS
    except Exception as exc:
        raise RuntimeError("Chatterbox is not installed") from exc
    device = "cuda" if torch.cuda.is_available() else "cpu"
    cache_key = f"{device}:{language}"
    model = _CHATTERBOX_MODELS.get(cache_key)
    if model is None:
        model = ChatterboxMultilingualTTS.from_pretrained(device=device)
        _CHATTERBOX_MODELS[cache_key] = model
    kwargs = {"language_id":language,"exaggeration":exaggeration,"cfg_weight":cfg_weight}
    if reference_audio:
        kwargs["audio_prompt_path"] = reference_audio
    wav = model.generate(text, **kwargs)
    ta.save(str(output), wav, model.sr)


@app.get("/health")
def health():
    return {"ok": True, "engines": ["kokoro","piper","chatterbox"], "profiles": list(PROFILES)}


def cache_key(req: TTSRequest, profile: dict, resolved_engine: str, voice: str | None) -> str:
    raw = "\n".join([
        req.text, req.language, profile_key(req.profile), voice or "", req.reference_audio or "",
        resolved_engine, str(profile.get("speed")), str(profile.get("exaggeration")),
        str(profile.get("cfg_weight")), str(profile.get("pause_ms")),
        str(profile.get("paragraph_pause_ms")), str(profile.get("suspense_factor")), req.format,
        req.trail or "", PIPELINE_VERSION
    ])
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def engine_order(preferred: str, has_reference: bool) -> list[str]:
    if preferred == "chatterbox" or (preferred == "auto" and has_reference):
        return ["chatterbox", "kokoro", "piper"]
    if preferred in ("auto", "kokoro"):
        return ["kokoro", "piper"]
    return ["piper"]


@app.post("/synthesize")
def synthesize(req: TTSRequest):
    profile = resolve_profile(req)
    preferred_engine = profile["engine"]
    if req.voice_gender and not req.reference_audio and preferred_engine == "chatterbox":
        # Chatterbox has no built-in male/female speakers; honour the listener's choice with Kokoro voices.
        preferred_engine = "kokoro"
    voice = resolve_voice(req, profile)
    key = cache_key(req, profile, preferred_engine, voice)
    destination = AUDIO_DIR / f"{key}.{req.format}"
    if destination.exists():
        return {"audio_url":f"/audio/{destination.name}","profile":req.profile,"engine":preferred_engine,"parts":1,"pause_profile_ms":profile["pause_ms"],"cached":True}

    work = Path(tempfile.mkdtemp(prefix="religion-tts-"))
    try:
        paragraphs = [p for p in normalize_text(req.text).split("\n\n") if p.strip()]
        if not paragraphs:
            raise RuntimeError("No text to narrate")

        def synth(engine: str, text: str, tag: str):
            if engine == "kokoro":
                return kokoro_chunks(text, req.language, voice, profile["speed"])
            if engine == "chatterbox":
                return file_chunks(lambda t, out: chatterbox_generate(t, req.language, req.reference_audio, profile["exaggeration"], profile["cfg_weight"], out), text, work, tag)
            return file_chunks(lambda t, out: piper_generate(t, req.language, req.voice, profile["speed"], out), text, work, tag)

        # The engine is chosen once, on the first paragraph, and kept for the whole file:
        # switching engines mid-story would change the voice between sentences.
        engine, first, errors = None, None, []
        for candidate in engine_order(preferred_engine, bool(req.reference_audio)):
            try:
                first = synth(candidate, paragraphs[0], "p0000")
                engine = candidate
                break
            except Exception as exc:
                errors.append(f"{candidate}: {exc}")
        if engine is None or first is None:
            raise RuntimeError("; ".join(errors) or "No TTS engine available")

        rate = first[1]
        pieces: list[np.ndarray] = [silence(rate, int(LEAD_IN_S * 1000))]
        for p_index, paragraph in enumerate(paragraphs):
            chunks, chunk_rate = first if p_index == 0 else synth(engine, paragraph, f"p{p_index:04d}")
            if chunk_rate != rate:
                raise RuntimeError("Engine returned an unexpected sample rate")
            for c_index, (text, wave) in enumerate(chunks):
                pieces.append(tidy_wave(wave, rate))
                paragraph_end = c_index == len(chunks) - 1
                last = paragraph_end and p_index == len(paragraphs) - 1
                if not last:
                    pieces.append(silence(rate, pause_after(text or paragraph, profile, paragraph_end)))
        # Pause carried into the next part of a long narration.
        if req.trail == "paragraph":
            pieces.append(silence(rate, pause_after(paragraphs[-1], profile, True)))
        elif req.trail == "sentence":
            pieces.append(silence(rate, pause_after(paragraphs[-1], profile, False)))
        else:
            pieces.append(silence(rate, 250))

        audio = level(np.concatenate(pieces))
        if req.format == "mp3":
            joined = work / "joined.wav"
            sf.write(joined, audio, rate)
            encode_mp3(joined, destination)
        else:
            sf.write(destination, audio, rate)
        return {"audio_url":f"/audio/{destination.name}","profile":req.profile,"engine":engine,"parts":len(paragraphs),"pause_profile_ms":profile["pause_ms"],"voice":voice,"cached":False}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        shutil.rmtree(work, ignore_errors=True)
