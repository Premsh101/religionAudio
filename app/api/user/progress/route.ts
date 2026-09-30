import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "../../../../lib/server/prisma";
import { getCurrentSessionUser } from "../../../../lib/server/session";

function clampPercent(value:number){
  return Math.max(0,Math.min(100,Math.round(value)));
}

export async function GET(){
  const user=await getCurrentSessionUser();
  if(!user) return NextResponse.json({error:"Sign in required."},{status:401});

  const prisma=getPrisma();
  if(!prisma) return NextResponse.json({error:"Database is not configured."},{status:503});

  const [works,stories]=await Promise.all([
    prisma.workProgress.findMany({
      where:{userId:user.id},
      include:{work:{select:{id:true,title:true,slug:true}}},
      orderBy:{updatedAt:"desc"},
      take:20
    }),
    prisma.storyProgress.findMany({
      where:{userId:user.id},
      include:{story:{select:{id:true,title:true,slug:true,summary:true}}},
      orderBy:{updatedAt:"desc"},
      take:20
    })
  ]);

  return NextResponse.json({works,stories});
}

export async function POST(request:NextRequest){
  const user=await getCurrentSessionUser();
  if(!user) return NextResponse.json({error:"Sign in required."},{status:401});

  const prisma=getPrisma();
  if(!prisma) return NextResponse.json({error:"Database is not configured."},{status:503});

  let body:any;
  try{ body=await request.json(); }catch{ return NextResponse.json({error:"Invalid JSON."},{status:400}); }

  const kind=body?.kind;
  const targetId=typeof body?.targetId==="string"?body.targetId.trim():"";
  const sequence=Math.max(1,Math.round(Number(body?.sequence)||1));
  const progressPercent=clampPercent(Number(body?.progressPercent)||0);
  const positionMs=Math.max(0,Math.round(Number(body?.positionMs)||0));
  const completed=Boolean(body?.completed);

  if(!targetId || (kind!=="work" && kind!=="story")){
    return NextResponse.json({error:"kind and targetId are required."},{status:400});
  }

  if(kind==="work"){
    const work=await prisma.work.findUnique({where:{id:targetId},select:{id:true}});
    if(!work) return NextResponse.json({error:"Work not found."},{status:404});
    const progress=await prisma.workProgress.upsert({
      where:{userId_workId:{userId:user.id,workId:targetId}},
      update:{currentSequence:sequence,progressPercent,positionMs,completedAt:completed?new Date():null},
      create:{userId:user.id,workId:targetId,currentSequence:sequence,progressPercent,positionMs,completedAt:completed?new Date():null}
    });
    return NextResponse.json({progress});
  }

  const story=await prisma.story.findUnique({where:{id:targetId},select:{id:true}});
  if(!story) return NextResponse.json({error:"Story not found."},{status:404});
  const progress=await prisma.storyProgress.upsert({
    where:{userId_storyId:{userId:user.id,storyId:targetId}},
    update:{currentScene:sequence,progressPercent,positionMs,completedAt:completed?new Date():null},
    create:{userId:user.id,storyId:targetId,currentScene:sequence,progressPercent,positionMs,completedAt:completed?new Date():null}
  });
  return NextResponse.json({progress});
}
