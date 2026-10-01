import { NextRequest } from "next/server";
import { buildTTSRequest } from "../../../lib/narration";

export const dynamic="force-dynamic";

export async function POST(request:NextRequest){
  const body=await request.json();
  const text=typeof body.text==="string"?body.text.trim().slice(0,30000):"";
  const profile=typeof body.profile==="string"?body.profile:"default";
  const language=typeof body.language==="string"?body.language:"en";
  if(!text)return Response.json({error:"Text is required."},{status:400});
  const service=process.env.TTS_SERVICE_URL||"http://localhost:8010";
  const payload=buildTTSRequest(text,profile,language);
  try{
    const response=await fetch(`${service}/synthesize`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload),cache:"no-store"});
    if(!response.ok)return new Response(await response.text(),{status:response.status,headers:{"Content-Type":"application/json"}});
    const result=await response.json();
    if(!result.audio_url)return Response.json({error:"TTS service returned no audio URL."},{status:502});
    const audio=await fetch(`${service}${result.audio_url}`,{cache:"no-store"});
    if(!audio.ok||!audio.body)return new Response("Audio generation failed",{status:502});
    return new Response(audio.body,{status:200,headers:{"Content-Type":audio.headers.get("content-type")||"audio/wav","Cache-Control":"no-store","X-Narration-Profile":profile}});
  }catch{return Response.json({error:"Self-hosted TTS service is unavailable."},{status:503});}
}
