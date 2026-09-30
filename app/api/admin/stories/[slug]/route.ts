import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "../../../../../lib/server/prisma";
import { getCurrentSessionUser } from "../../../../../lib/server/session";

function canEdit(role:string){
  return role==="ADMIN" || role==="EDITOR";
}
const allowedStatuses=["DRAFT","REVIEW","PUBLISHED","ARCHIVED"];
const allowedProfiles=["DEFAULT","SCRIPTURE","MYTHOLOGY","FOLKLORE","GHOST","KIDS","MORAL_TALE"];
const allowedIntensity=["GENTLE","ADVENTUROUS","SPOOKY","DARK"];

export async function PATCH(request:NextRequest,{params}:{params:Promise<{slug:string}>}){
  const user=await getCurrentSessionUser();
  if(!user || !canEdit(user.role)) return NextResponse.json({error:"Editor access required."},{status:403});

  const prisma=getPrisma();
  if(!prisma) return NextResponse.json({error:"Database is not configured."},{status:503});

  const {slug}=await params;
  let body:any;
  try{body=await request.json()}catch{return NextResponse.json({error:"Invalid JSON."},{status:400})}

  const current=await prisma.story.findUnique({where:{slug}});
  if(!current) return NextResponse.json({error:"Story not found."},{status:404});

  const nextStatus=allowedStatuses.includes(body?.status)?body.status:current.status;
  const data:any={
    title:typeof body?.title==="string"?body.title.trim().slice(0,160):current.title,
    summary:typeof body?.summary==="string"?body.summary.trim().slice(0,1000)||null:current.summary,
    body:typeof body?.body==="string"?body.body.trim().slice(0,100000):current.body,
    narrationProfile:allowedProfiles.includes(body?.narrationProfile)?body.narrationProfile:current.narrationProfile,
    intensity:allowedIntensity.includes(body?.intensity)?body.intensity:current.intensity,
    status:nextStatus,
    publishedAt:nextStatus==="PUBLISHED"?(current.publishedAt||new Date()):null
  };

  const story=await prisma.story.update({where:{slug},data});
  return NextResponse.json({story});
}
