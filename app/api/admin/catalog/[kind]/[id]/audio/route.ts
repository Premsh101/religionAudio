import { NextRequest, NextResponse } from "next/server";
import { parseKind, requireEditor } from "../../../../../../../lib/server/admin";
import { NARRATION_VOICES, audioSummary, cellsFor, narrationLanguagesFor, queueNarrations, type NarrationLanguage } from "../../../../../../../lib/server/narration-plan";
import type { VoiceGender } from "../../../../../../../lib/narration";

export const dynamic="force-dynamic";
export const maxDuration=60;

/** Queue narration for one story or book: every available language and voice, or just the one asked for. */
export async function POST(request:NextRequest,{params}:{params:Promise<{kind:string;id:string}>}){
  const ctx=await requireEditor();
  if("error" in ctx)return ctx.error;
  const {kind:rawKind,id}=await params;
  const kind=parseKind(rawKind);
  if(!kind)return NextResponse.json({error:"Unknown item type."},{status:400});
  const {prisma}=ctx;
  const item=kind==="story"
    ?await prisma.story.findUnique({where:{id},select:{language:true,translations:true}})
    :await prisma.work.findUnique({where:{id},select:{language:true}});
  if(!item)return NextResponse.json({error:"Not found."},{status:404});
  const available=narrationLanguagesFor(item);
  const body=await request.json().catch(()=>({}));
  const languages=typeof body.language==="string"?available.filter(l=>l===body.language):available;
  const voices=(typeof body.voice==="string"?NARRATION_VOICES.filter(v=>v===body.voice):NARRATION_VOICES) as VoiceGender[];
  if(!languages.length||!voices.length)return NextResponse.json({error:"That language or voice isn't available for this item."},{status:400});
  try{
    const queued=await queueNarrations(prisma,kind,id,languages as NarrationLanguage[],voices);
    return NextResponse.json({queued,audio:cellsFor(await audioSummary(prisma,{kind,id}),kind,id,available)});
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:"Could not queue narration."},{status:400});
  }
}
