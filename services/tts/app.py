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


def narration_segments(text: str, limit: int = 1800) -> list[str]:
    paragraphs = [part.strip() for part in re.split(r"\n\s*\n", text) if part.strip()]
    segments: list[str] = []
    for paragraph in paragraphs:
        sentences = [part.strip() for part in re.split(r"(?<=[.!?।؟])\s+", paragraph) if part.strip()]
        for sentence in sentences:
            if len(sentence) <= limit:
                segments.append(sentence)
                continue
            words = sentence.split()
            current, size = [], 0
            for word in words:
                if current and size + len(word) + 1 > limit:
                    segments.append(" ".join(current))
                    current, size = [], 0
                current.append(word)
                size += len(word) + 1
            if current:
                segments.append(" ".join(current))
    return segments


def pause_after(text: str, profile: dict) -> int:
    base = int(profile["pause_ms"])
    if text.rstrip().endswith(("!", "?", "।", "؟")):
        return int(base * 1.35)
    if text.rstrip().endswith((".", "…")):
        return base
    if text.rstrip().endswith(","):
        return int(base * 0.45)
    return int(base * 0.75)


def resolve_profile(req: TTSRequest) -> dict:
    profile = dict(PROFILES.get(req.profile, PROFILES["default"]))
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


def kokoro_generate(text: str, language: str, voice: str | None, speed: float, output: Path) -> None:
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
    audio_parts = []
    for _, _, audio in pipeline(text, voice=selected_voice, speed=speed, split_pattern=r"\n+"):
        if audio is not None:
            audio_parts.append(audio.numpy())
    if not audio_parts:
        raise RuntimeError("Kokoro produced no audio")
    sf.write(str(output), np.concatenate(audio_parts), 24000)


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


def add_silence(files: list[tuple[Path,int]], output: Path) -> None:
    waves, sample_rate = [], None
    for index, (path, pause_ms) in enumerate(files):
        data, rate = sf.read(path, dtype="float32")
        if data.ndim > 1:
            data = data.mean(axis=1)
        sample_rate = sample_rate or rate
        waves.append(data)
        if index < len(files) - 1:
            waves.append(np.zeros(int((sample_rate or rate) * pause_ms / 1000), dtype=np.float32))
    if not waves:
        raise RuntimeError("No generated audio")
    sf.write(output, np.concatenate(waves), sample_rate or 22050)


@app.get("/health")
def health():
    return {"ok": True, "engines": ["kokoro","piper","chatterbox"], "profiles": list(PROFILES)}


def cache_key(req: TTSRequest, profile: dict, resolved_engine: str) -> str:
    raw = "\n".join([
        req.text, req.language, req.profile, req.voice or "", req.reference_audio or "",
        resolved_engine, str(profile.get("speed")), str(profile.get("exaggeration")),
        str(profile.get("cfg_weight")), str(profile.get("pause_ms"))
    ])
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


@app.post("/synthesize")
def synthesize(req: TTSRequest):
    profile = resolve_profile(req)
    preferred_engine = profile["engine"]
    key = cache_key(req, profile, preferred_engine)
    destination = AUDIO_DIR / f"{key}.wav"
    if destination.exists():
        return {"audio_url":f"/audio/{destination.name}","profile":req.profile,"engine":preferred_engine,"parts":1,"pause_profile_ms":profile["pause_ms"],"cached":True}

    work = Path(tempfile.mkdtemp(prefix="religion-tts-"))
    generated: list[tuple[Path,int]] = []
    used_engines: set[str] = set()
    try:
        segments = narration_segments(req.text)
        for index, part in enumerate(segments):
            output = work / f"{index:04d}.wav"
            engine = preferred_engine

            if engine in ("chatterbox","auto") and (engine == "chatterbox" or req.reference_audio):
                try:
                    chatterbox_generate(part, req.language, req.reference_audio, profile["exaggeration"], profile["cfg_weight"], output)
                    used_engines.add("chatterbox")
                except Exception:
                    try:
                        kokoro_generate(part, req.language, req.voice, profile["speed"], output)
                        used_engines.add("kokoro")
                    except Exception:
                        piper_generate(part, req.language, req.voice, profile["speed"], output)
                        used_engines.add("piper")
            elif engine in ("auto","kokoro"):
                try:
                    kokoro_generate(part, req.language, req.voice, profile["speed"], output)
                    used_engines.add("kokoro")
                except Exception:
                    piper_generate(part, req.language, req.voice, profile["speed"], output)
                    used_engines.add("piper")
            else:
                piper_generate(part, req.language, req.voice, profile["speed"], output)
                used_engines.add("piper")

            generated.append((output, pause_after(part, profile)))

        add_silence(generated, destination)
        actual_engine = "+".join(sorted(used_engines)) or preferred_engine
        return {"audio_url":f"/audio/{destination.name}","profile":req.profile,"engine":actual_engine,"parts":len(generated),"pause_profile_ms":profile["pause_ms"],"cached":False}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        shutil.rmtree(work, ignore_errors=True)
