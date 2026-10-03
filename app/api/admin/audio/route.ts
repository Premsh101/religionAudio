import { NextRequest, NextResponse } from "next/server";
import { requireEditor } from "../../../../lib/server/admin";
import { audioSummary, cellsFor, narrationLanguagesFor, queueNarrations } from "../../../../lib/server/narration-plan";

export const dynamic="force-dynamic";
export const maxDuration=300;

type Scope="published"|"review"|"all";
const statusesFor=(scope:Scope)=>scope==="published"?["PUBLISHED"]:scope==="review"?["DRAFT","REVIEW"]:["DRAFT","REVIEW","PUBLISHED"];

async function loadItems(prisma:NonNullable<Awaited<ReturnType<typeof requireEditor>>["prisma"]>,scope:Scope){
  const status={in:statusesFor(scope) as ("DRAFT"|"REVIEW"|"PUBLISHED")[]};
  const [stories,works]=await Promise.all([
    prisma.story.findMany({where:{status},select:{id:true,language:true,translations:true}}),
    prisma.work.findMany({where:{status},select:{id:true,language:true}}),
  ]);
  return [...stories.map(s=>({kind:"story" as const,id:s.id,languages:narrationLanguagesFor(s)})),...works.map(w=>({kind:"work" as const,id:w.id,languages:narrationLanguagesFor(w)}))];
}

/** Narration status for every item (polled by the Studio while audio is being generated) plus queue size. */
export async function GET(request:NextRequest){
  const ctx=await requireEditor();
  if("error" in ctx)return ctx.error;
  const {prisma}=ctx;
  const items=await loadItems(prisma,"all");
  const map=await audioSummary(prisma);
  const audio=Object.fromEntries(items.map(i=>[`${i.kind}:${i.id}`,cellsFor(map,i.kind,i.id,i.languages)]));
  const [queued,processing,failedJobs]=await Promise.all([
    prisma.audioJob.count({where:{status:"QUEUED"}}),prisma.audioJob.count({where:{status:"PROCESSING"}}),prisma.audioJob.count({where:{status:"FAILED"}}),
  ]);
  void request;
  return NextResponse.json({audio,queue:{queued,processing,failedJobs}},{headers:{"cache-control":"no-store"}});
}

/** Queue every missing narration (all available languages, female and male) for published, in-review or all items. */
export async function POST(request:NextRequest){
  const ctx=await requireEditor();
  if("error" in ctx)return ctx.error;
  const {prisma}=ctx;
  const body=await request.json().catch(()=>({}));
  const scope:Scope=body.scope==="review"||body.scope==="all"?body.scope:"published";
  const items=await loadItems(prisma,scope);
  let queued=0,failed=0;
  for(const item of items){
    try{queued+=await queueNarrations(prisma,item.kind,item.id,item.languages)}catch{failed++}
  }
  return NextResponse.json({queued,items:items.length,failed});
}
