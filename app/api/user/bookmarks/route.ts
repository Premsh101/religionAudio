import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "../../../../lib/server/prisma";
import { getCurrentSessionUser } from "../../../../lib/server/session";

const fields=["workId","passageId","storyId"] as const;

export async function GET(){
  const user=await getCurrentSessionUser();
  if(!user) return NextResponse.json({error:"Sign in required."},{status:401});
  const prisma=getPrisma();
  if(!prisma) return NextResponse.json({error:"Database is not configured."},{status:503});

  const bookmarks=await prisma.bookmark.findMany({
    where:{userId:user.id},
    include:{
      work:{select:{id:true,title:true,slug:true}},
      passage:{select:{id:true,reference:true,text:true,workId:true}},
      story:{select:{id:true,title:true,slug:true}}
    },
    orderBy:{createdAt:"desc"},
    take:100
  });
  return NextResponse.json({bookmarks});
}

export async function POST(request:NextRequest){
  const user=await getCurrentSessionUser();
  if(!user) return NextResponse.json({error:"Sign in required."},{status:401});
  const prisma=getPrisma();
  if(!prisma) return NextResponse.json({error:"Database is not configured."},{status:503});

  let body:any;
  try{ body=await request.json(); }catch{ return NextResponse.json({error:"Invalid JSON."},{status:400}); }

  const selected=fields.filter(field=>typeof body?.[field]==="string" && body[field].trim());
  if(selected.length!==1) return NextResponse.json({error:"Choose exactly one bookmark target."},{status:400});
  const field=selected[0];
  const targetId=String(body[field]).trim();

  const exists=await prisma.bookmark.findFirst({where:{userId:user.id,[field]:targetId}});
  if(exists){
    await prisma.bookmark.delete({where:{id:exists.id}});
    return NextResponse.json({bookmarked:false});
  }

  if(field==="workId" && !(await prisma.work.findUnique({where:{id:targetId},select:{id:true}}))) return NextResponse.json({error:"Work not found."},{status:404});
  if(field==="passageId" && !(await prisma.passage.findUnique({where:{id:targetId},select:{id:true}}))) return NextResponse.json({error:"Passage not found."},{status:404});
  if(field==="storyId" && !(await prisma.story.findUnique({where:{id:targetId},select:{id:true}}))) return NextResponse.json({error:"Story not found."},{status:404});

  const bookmark=await prisma.bookmark.create({
    data:{userId:user.id,[field]:targetId,note:typeof body?.note==="string"?body.note.trim()||null:null},
  });
  return NextResponse.json({bookmarked:true,bookmark},{status:201});
}
