import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "../../../../lib/server/prisma";
import { getCurrentSessionUser } from "../../../../lib/server/session";

function clamp(value:number){return Math.max(0,Math.min(100,Math.round(value)));}

export async function GET(request:NextRequest){
  const user=await getCurrentSessionUser();
  if(!user)return NextResponse.json({error:"Sign in required."},{status:401});
  const assetId=request.nextUrl.searchParams.get("assetId")?.trim()||"";
  if(!assetId)return NextResponse.json({error:"assetId is required."},{status:400});
  const prisma=getPrisma();
  if(!prisma)return NextResponse.json({error:"Database is not configured."},{status:503});
  const progress=await prisma.audioPlaybackProgress.findUnique({
    where:{userId_audioAssetId:{userId:user.id,audioAssetId:assetId}}
  });
  if(progress)return NextResponse.json({progress});
  // No position for this narration yet: continue from the same story/book in the other voice, if any.
  const asset=await prisma.audioAsset.findUnique({where:{id:assetId},select:{storyId:true,workId:true}});
  const target=asset?.storyId?{storyId:asset.storyId}:asset?.workId?{workId:asset.workId}:null;
  const sibling=target?await prisma.audioPlaybackProgress.findFirst({
    where:{userId:user.id,completedAt:null,audioAsset:target},
    orderBy:{updatedAt:"desc"}
  }):null;
  return NextResponse.json({progress:sibling,fromOtherVoice:Boolean(sibling)});
}

export async function POST(request:NextRequest){
  const user=await getCurrentSessionUser();
  if(!user)return NextResponse.json({error:"Sign in required."},{status:401});
  const prisma=getPrisma();
  if(!prisma)return NextResponse.json({error:"Database is not configured."},{status:503});
  let body:any;
  try{body=await request.json()}catch{return NextResponse.json({error:"Invalid JSON."},{status:400})}
  const assetId=typeof body?.assetId==="string"?body.assetId.trim():"";
  if(!assetId)return NextResponse.json({error:"assetId is required."},{status:400});
  const currentSequence=Math.max(1,Math.round(Number(body?.currentSequence)||1));
  const positionMs=Math.max(0,Math.round(Number(body?.positionMs)||0));
  const progressPercent=clamp(Number(body?.progressPercent)||0);
  const completed=Boolean(body?.completed);
  const asset=await prisma.audioAsset.findUnique({where:{id:assetId},select:{id:true}});
  if(!asset)return NextResponse.json({error:"Audio asset not found."},{status:404});
  const progress=await prisma.audioPlaybackProgress.upsert({
    where:{userId_audioAssetId:{userId:user.id,audioAssetId:assetId}},
    update:{currentSequence,positionMs,progressPercent,completedAt:completed?new Date():null},
    create:{userId:user.id,audioAssetId:assetId,currentSequence,positionMs,progressPercent,completedAt:completed?new Date():null}
  });
  return NextResponse.json({progress});
}
