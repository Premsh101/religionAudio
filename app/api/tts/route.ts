import { NextRequest } from "next/server";

export async function POST(request: NextRequest){
  const service=process.env.TTS_SERVICE_URL || "http://localhost:8010";
  const body=await request.json();
  const response=await fetch(`${service}/synthesize`,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(body),
    cache:"no-store"
  });
  if(!response.ok){
    return new Response(await response.text(),{status:response.status,headers:{"Content-Type":"application/json"}});
  }
  const result=await response.json();
  const audio=await fetch(`${service}${result.audio_url}`,{cache:"no-store"});
  if(!audio.ok || !audio.body) return new Response("Audio generation failed",{status:502});
  return new Response(audio.body,{status:200,headers:{"Content-Type":audio.headers.get("content-type")||"audio/wav","Cache-Control":"no-store"}});
}
