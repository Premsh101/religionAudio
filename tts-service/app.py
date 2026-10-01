import base64, io, os, uuid, wave
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

app=FastAPI(title="ReligionAudio Local TTS")
OUT=Path(os.getenv("TTS_OUTPUT_DIR","/tmp/religion-audio")); OUT.mkdir(parents=True,exist_ok=True)

class Request(BaseModel):
    text:str=Field(min_length=1,max_length=30000)
    language:str="en"
    profile:str="default"
    engine:str="browser"
    rate:float=1.0
    pitch:float=0.0
    pause_ms:int=250
    emotion:str="neutral"
    instructions:str=""

@app.get("/health")
def health(): return {"ok":True,"engines":["browser"],"profiles":["scripture","mythology","folklore","ghost","kids","moral-tale"]}

@app.post("/synthesize")
def synthesize(req:Request):
    # The service boundary is intentionally engine-agnostic. Install Kokoro/Chatterbox
    # behind this endpoint on the KVM without changing the Next.js application contract.
    # Until a local model is installed, return a deterministic silent WAV so health and
    # pipeline tests can run without paid APIs.
    sample_rate=22050; seconds=max(1,min(3,len(req.text)//120+1)); frames=b"\x00\x00"*(sample_rate*seconds)
    buf=io.BytesIO()
    with wave.open(buf,"wb") as w:
        w.setnchannels(1);w.setsampwidth(2);w.setframerate(sample_rate);w.writeframes(frames)
    name=f"{uuid.uuid4().hex}.wav"; (OUT/name).write_bytes(buf.getvalue())
    return {"audio_url":f"/audio/{name}","engine":"browser","profile":req.profile,"duration_seconds":seconds,"placeholder":True}

@app.get("/audio/{name}")
def audio(name:str):
    target=(OUT/name).resolve()
    if target.parent!=OUT.resolve() or not target.exists(): raise HTTPException(404,"Audio not found")
    return FileResponse(target,media_type="audio/wav")
