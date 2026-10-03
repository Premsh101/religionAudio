import { NextResponse } from "next/server";
import { getPrisma } from "../../../lib/server/prisma";

export const dynamic="force-dynamic";

export async function GET(){
  const prisma=getPrisma();
  if(!prisma) return NextResponse.json({stories:[]});

  const stories=await prisma.story.findMany({
    where:{status:"PUBLISHED",matureContent:false},
    orderBy:{publishedAt:"desc"},
    take:50,
    select:{
      title:true,slug:true,type:true,audience:true,ageMin:true,ageMax:true,summary:true,
      narrationProfile:true,intensity:true,publishedAt:true,
      source:{select:{name:true,license:true,rightsStatus:true}}
    }
  });
  return NextResponse.json({stories});
}
