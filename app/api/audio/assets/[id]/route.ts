import { NextResponse } from "next/server";
import { getPrisma } from "../../../../../lib/server/prisma";
import { audioPublicUrl } from "../../../../../lib/audio-storage";
import { hasAdultConsent } from "../../../../../lib/server/adult";

export const dynamic="force-dynamic";

export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 const prisma=getPrisma();
 if(!prisma)return NextResponse.json({error:"DATABASE_URL is not configured."},{status:503});
 const {id}=await params;
 const asset=await prisma.audioAsset.findUnique({
   where:{id},
   select:{id:true,title:true,status:true,totalSegments:true,durationMs:true,language:true,voiceId:true,narrationProfile:true,engine:true,story:{select:{title:true,slug:true,status:true,matureContent:true}},work:{select:{title:true,slug:true,status:true}},content:{select:{title:true,slug:true}},segments:{orderBy:{sequence:"asc"},select:{id:true,sequence:true,startMs:true,endMs:true,storageKey:true,transcript:true}}}
 });
 if(!asset)return NextResponse.json({error:"Audio asset not found."},{status:404});
 const isPublic=asset.story?.status==="PUBLISHED" || asset.work?.status==="PUBLISHED" || Boolean(asset.content);
 if(!isPublic)return NextResponse.json({error:"Audio asset is not public."},{status:403});
 if(asset.story?.matureContent&&!(await hasAdultConsent()))return NextResponse.json({error:"Confirm you are 18 or older to listen."},{status:403});
 if(asset.status==="FAILED")return NextResponse.json({error:"Narration could not be generated.",status:asset.status},{status:409});
 // While generating, return the parts that are already stored so playback can start immediately.
 return NextResponse.json({
   asset:{id:asset.id,title:asset.title,status:asset.status,totalSegments:asset.totalSegments,durationMs:asset.durationMs,language:asset.language,voice:asset.voiceId,narrationProfile:asset.narrationProfile,engine:asset.engine},
   segments:asset.segments.filter(segment=>segment.storageKey).map(segment=>({...segment,url:audioPublicUrl(segment.storageKey!)}))
 },{headers:{"cache-control":asset.status==="READY"?"public, max-age=300":"no-store"}});
}
