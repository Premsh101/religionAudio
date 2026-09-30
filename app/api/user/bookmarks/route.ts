import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "../../../../lib/server/prisma";
import { getCurrentSessionUser } from "../../../../lib/server/session";

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

  const targetType=body?.targetType;
  const targetKey=typeof body?.targetKey==="string"?body.targetKey.trim():"";
  if(!targetKey || (targetType!=="work" && targetType!=="story")){
    return NextResponse.json({error:"targetType and targetKey are required."},{status:400});
  }

  let field:"workId"|"storyId";
  let targetId:string;
  if(targetType==="work"){
    const work=await prisma.work.findUnique({where:{slug:targetKey},select:{id:true}});
    if(!work) return NextResponse.json({error:"Work not found."},{status:404});
    field="workId";
    targetId=work.id;
  }else{
    const story=await prisma.story.findUnique({where:{slug:targetKey},select:{id:true}});
    if(!story) return NextResponse.json({error:"Story not found."},{status:404});
    field="storyId";
    targetId=story.id;
  }

  const existing=await prisma.bookmark.findFirst({where:{userId:user.id,[field]:targetId}});
  if(existing){
    await prisma.bookmark.delete({where:{id:existing.id}});
    return NextResponse.json({bookmarked:false});
  }

  const bookmark=await prisma.bookmark.create({
    data:{userId:user.id,[field]:targetId,note:typeof body?.note==="string"?body.note.trim()||null:null}
  });
  return NextResponse.json({bookmarked:true,bookmark},{status:201});
}
