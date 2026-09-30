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
  const targetSlug=typeof body?.targetSlug==="string"?body.targetSlug.trim():"";
  const sequence=Math.max(1,Math.round(Number(body?.sequence)||1));
  const progressPercent=clampPercent(Number(body?.progressPercent)||0);
  const positionMs=Math.max(0,Math.round(Number(body?.positionMs)||0));
  const completed=Boolean(body?.completed);

  if(!targetId && !targetSlug) return NextResponse.json({error:"targetId or targetSlug is required."},{status:400});
  if(kind!=="work" && kind!=="story") return NextResponse.json({error:"kind must be work or story."},{status:400});

  if(kind==="work"){
    const work=targetId
      ? await prisma.work.findUnique({where:{id:targetId},select:{id:true}})
      : await prisma.work.findUnique({where:{slug:targetSlug},select:{id:true}});
    if(!work) return NextResponse.json({error:"Work not found."},{status:404});

    const progress=await prisma.workProgress.upsert({
      where:{userId_workId:{userId:user.id,workId:work.id}},
      update:{currentSequence:sequence,progressPercent,positionMs,completedAt:completed?new Date():null},
      create:{userId:user.id,workId:work.id,currentSequence:sequence,progressPercent,positionMs,completedAt:completed?new Date():null}
    });
    return NextResponse.json({progress});
  }

  const story=targetId
    ? await prisma.story.findUnique({where:{id:targetId},select:{id:true}})
    : await prisma.story.findUnique({where:{slug:targetSlug},select:{id:true}});
  if(!story) return NextResponse.json({error:"Story not found."},{status:404});

  const progress=await prisma.storyProgress.upsert({
    where:{userId_storyId:{userId:user.id,storyId:story.id}},
    update:{currentScene:sequence,progressPercent,positionMs,completedAt:completed?new Date():null},
    create:{userId:user.id,storyId:story.id,currentScene:sequence,progressPercent,positionMs,completedAt:completed?new Date():null}
  });
  return NextResponse.json({progress});
}
