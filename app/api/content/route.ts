import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "../../../lib/server/prisma";

export const dynamic="force-dynamic";

export async function GET(request:NextRequest){
  const q=(request.nextUrl.searchParams.get("q")||"").trim().slice(0,120);
  const type=(request.nextUrl.searchParams.get("type")||"").trim();
  const audience=(request.nextUrl.searchParams.get("audience")||"").trim();
  const prisma=getPrisma();
  if(!prisma) return NextResponse.json({items:[]});
  const where:any={};
  if(type) where.type=type;
  if(audience) where.audience=audience;
  if(q) where.OR=[{title:{contains:q,mode:"insensitive"}},{summary:{contains:q,mode:"insensitive"}},{body:{contains:q,mode:"insensitive"}}];
  const items=await prisma.contentItem.findMany({where,take:100,orderBy:{updatedAt:"desc"},select:{id:true,title:true,slug:true,type:true,audience:true,ageMin:true,ageMax:true,language:true,summary:true,evidenceLens:true,rightsStatus:true,work:{select:{title:true,slug:true}},passage:{select:{reference:true}},source:{select:{name:true,url:true,license:true}}}});
  return NextResponse.json({items});
}
