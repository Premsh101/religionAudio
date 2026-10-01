import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "../../../lib/server/prisma";

export const dynamic="force-dynamic";

export async function GET(request:NextRequest){
  const q=(request.nextUrl.searchParams.get("q")||"").trim().slice(0,120);
  const prisma=getPrisma();
  if(!prisma) return NextResponse.json({places:[]});
  const where=q?{OR:[{name:{contains:q,mode:"insensitive"}},{region:{contains:q,mode:"insensitive"}},{country:{contains:q,mode:"insensitive"}},{traditionalSignificance:{contains:q,mode:"insensitive"}}]}:{};
  const rows=await prisma.place.findMany({where,take:100,orderBy:{name:"asc"},select:{id:true,name:true,slug:true,country:true,region:true,latitude:true,longitude:true,placeType:true,traditionalSignificance:true,historicalSignificance:true,archaeologicalEvidence:true,uncertaintyNotes:true,source:{select:{name:true,url:true,license:true,rightsStatus:true}}}});
  return NextResponse.json({places:rows});
}
