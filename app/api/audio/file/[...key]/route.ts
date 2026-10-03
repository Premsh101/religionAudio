import { NextRequest } from "next/server";
import { readStoredAudio } from "../../../../../lib/audio-storage";

export const dynamic="force-dynamic";

export async function GET(request:NextRequest,{params}:{params:Promise<{key:string[]}>}){
 try{
  const {key}=await params;const storageKey=key.join("/");
  const data=await readStoredAudio(storageKey);
  const type=storageKey.endsWith(".mp3")?"audio/mpeg":storageKey.endsWith(".ogg")?"audio/ogg":storageKey.endsWith(".json")?"application/json":"audio/wav";
  return new Response(data,{headers:{"content-type":type,"cache-control":"public, max-age=31536000, immutable","accept-ranges":"bytes"}});
 }catch{return new Response("Audio not found",{status:404})}
}
