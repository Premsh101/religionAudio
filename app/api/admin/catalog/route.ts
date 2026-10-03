import { NextResponse } from "next/server";
import { requireEditor } from "../../../../lib/server/admin";
import { coverUrl, needsTitle } from "../../../../lib/server/ai/covers";
import { vertexConfigured } from "../../../../lib/server/ai/vertex";
import { textAiConfigured } from "../../../../lib/server/ai/text";
import { audioSummary, cellsFor, narrationLanguagesFor } from "../../../../lib/server/narration-plan";

export const dynamic="force-dynamic";

/** Everything awaiting review or already live: stories and books with status and cover. */
export async function GET(){
  const ctx=await requireEditor();
  if("error" in ctx)return ctx.error;
  const {prisma}=ctx;
  const [stories,works]=await Promise.all([
    prisma.story.findMany({orderBy:{updatedAt:"desc"},select:{id:true,slug:true,title:true,type:true,audience:true,language:true,status:true,summary:true,matureContent:true,collection:true,translations:true,publishedAt:true,updatedAt:true,coverImageKey:true,coverUpdatedAt:true}}),
    prisma.work.findMany({orderBy:{updatedAt:"desc"},select:{id:true,slug:true,title:true,language:true,status:true,summary:true,edition:true,publishedAt:true,updatedAt:true,coverImageKey:true,coverUpdatedAt:true,religion:{select:{name:true}},_count:{select:{passages:true}}}})
  ]);
  const audio=await audioSummary(prisma);
  const items=[
    ...stories.map(s=>({kind:"story" as const,id:s.id,slug:s.slug,title:s.title,subtitle:s.summary||"",tag:s.type.replace(/_/g," ").toLowerCase(),audience:s.audience.toLowerCase(),language:s.language,status:s.status,href:"/stories/"+s.slug,mature:s.matureContent,collection:s.collection,languages:["en",...Object.keys((s.translations as Record<string,string>|null)||{}).filter(k=>/^[a-z]{2}$/.test(k)&&k!=="en")],coverUrl:coverUrl(s.coverImageKey),coverUpdatedAt:s.coverUpdatedAt,updatedAt:s.updatedAt,needsTitle:needsTitle(s.title),audio:cellsFor(audio,"story",s.id,narrationLanguagesFor(s))})),
    ...works.map(w=>({kind:"work" as const,id:w.id,slug:w.slug,title:w.title,subtitle:w.summary||w.edition||"",tag:w.religion?.name||"scripture",audience:"all ages",language:w.language,status:w.status,href:"/read/"+w.slug,coverUrl:coverUrl(w.coverImageKey),coverUpdatedAt:w.coverUpdatedAt,updatedAt:w.updatedAt,needsTitle:needsTitle(w.title),passages:w._count.passages,audio:cellsFor(audio,"work",w.id,narrationLanguagesFor(w))}))
  ].sort((a,b)=>b.updatedAt.getTime()-a.updatedAt.getTime());
  return NextResponse.json({items,aiConfigured:textAiConfigured(),imageConfigured:vertexConfigured()},{headers:{"cache-control":"no-store"}});
}
