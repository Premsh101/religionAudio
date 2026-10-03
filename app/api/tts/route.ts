import { createHash } from "node:crypto";
import { NextRequest } from "next/server";
import { buildTTSRequest, getNarrationPlan, normalizeVoiceGender } from "../../../lib/narration";
import { audioObjectExists, audioPublicUrl, storeAudioAt } from "../../../lib/audio-storage";

export const dynamic="force-dynamic";

// Bump when voices/profiles change so old cached audio is not reused for new settings.
const CACHE_VERSION="v2";

/**
 * Returns {url} for narrated text. The audio is generated once, stored (R2 in production) under a key
 * derived from the text + language + style + voice, and every later request for the same text streams the stored file.
 */
export async function POST(request:NextRequest){
  const body=await request.json().catch(()=>({}));
  const text=typeof body.text==="string"?body.text.trim().slice(0,6000):"";
  const profile=getNarrationPlan(typeof body.profile==="string"?body.profile:"default").profile;
  const language=typeof body.language==="string"&&/^[a-z]{2}(-[a-z]{2})?$/i.test(body.language)?body.language.toLowerCase():"en";
  const voiceGender=normalizeVoiceGender(body.voice);
  if(!text)return Response.json({error:"Text is required."},{status:400});

  const hash=createHash("sha256").update([CACHE_VERSION,text,language,profile,voiceGender||"default"].join("\n")).digest("hex");
  const key=`tts-cache/${hash.slice(0,2)}/${hash}.mp3`;
  if(await audioObjectExists(key))return Response.json({url:audioPublicUrl(key),cached:true,profile});

  const service=process.env.TTS_SERVICE_URL||"http://localhost:8010";
  try{
    const response=await fetch(`${service}/synthesize`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(buildTTSRequest(text,profile,language,voiceGender,"mp3")),cache:"no-store"});
    if(!response.ok)return Response.json({error:"Narration service error."},{status:502});
    const result=await response.json();
    if(!result.audio_url)return Response.json({error:"TTS service returned no audio URL."},{status:502});
    const audio=await fetch(`${service}${result.audio_url}`,{cache:"no-store"});
    if(!audio.ok)return Response.json({error:"Audio generation failed."},{status:502});
    const stored=await storeAudioAt(key,Buffer.from(await audio.arrayBuffer()),"mp3");
    return Response.json({url:audioPublicUrl(stored.storageKey),cached:false,profile});
  }catch{return Response.json({error:"Self-hosted TTS service is unavailable."},{status:503});}
}
