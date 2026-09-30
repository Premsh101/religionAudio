import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "../../../../lib/server/prisma";
import { getCurrentSessionUser } from "../../../../lib/server/session";

function canEdit(role:string){
  return role==="ADMIN" || role==="EDITOR";
}

function clean(value:unknown,max=20000){
  return typeof value==="string" ? value.trim().slice(0,max) : "";
}

export async function GET(){
  const user=await getCurrentSessionUser();
  if(!user || !canEdit(user.role)) return NextResponse.json({error:"Editor access required."},{status:403});

  const prisma=getPrisma();
  if(!prisma) return NextResponse.json({error:"Database is not configured."},{status:503});

  const stories=await prisma.story.findMany({
    orderBy:{updatedAt:"desc"},
    select:{
      id:true,title:true,slug:true,type:true,audience:true,status:true,publishedAt:true,
      language:true,summary:true,body:true,narrationProfile:true,intensity:true,contentWarnings:true,
      source:{select:{id:true,name:true,url:true,rightsStatus:true}}
    }
  });
  return NextResponse.json({stories});
}

export async function POST(request:NextRequest){
  const user=await getCurrentSessionUser();
  if(!user || !canEdit(user.role)) return NextResponse.json({error:"Editor access required."},{status:403});

  const prisma=getPrisma();
  if(!prisma) return NextResponse.json({error:"Database is not configured."},{status:503});

  let body:any;
  try{body=await request.json()}catch{return NextResponse.json({error:"Invalid JSON."},{status:400})}

  const title=clean(body?.title,160);
  const slug=clean(body?.slug,160).toLowerCase();
  const storyBody=clean(body?.body,100000);
  if(!title || !slug || !storyBody) return NextResponse.json({error:"Title, slug and body are required."},{status:400});
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return NextResponse.json({error:"Slug must use lowercase letters, numbers and hyphens."},{status:400});

  const allowedTypes=["STORY","MYTHOLOGY","FOLKLORE","GHOST_STORY","MORAL_TALE"];
  const allowedAudiences=["KIDS","FAMILY","TEENS","ADULTS","RESEARCH"];
  const allowedProfiles=["DEFAULT","SCRIPTURE","MYTHOLOGY","FOLKLORE","GHOST","KIDS","MORAL_TALE"];
  const allowedIntensity=["GENTLE","ADVENTUROUS","SPOOKY","DARK"];
  const type=allowedTypes.includes(body?.type)?body.type:"STORY";
  const audience=allowedAudiences.includes(body?.audience)?body.audience:"FAMILY";
  const narrationProfile=allowedProfiles.includes(body?.narrationProfile)?body.narrationProfile:"DEFAULT";
  const intensity=allowedIntensity.includes(body?.intensity)?body.intensity:"GENTLE";
  const requestedStatus=["DRAFT","REVIEW","PUBLISHED","ARCHIVED"].includes(body?.status)?body.status:"DRAFT";

  const existing=await prisma.story.findUnique({where:{slug},select:{id:true}});
  if(existing) return NextResponse.json({error:"A story with this slug already exists."},{status:409});

  const story=await prisma.story.create({
    data:{
      title,slug,type,audience,
      language:clean(body?.language,20)||"en",
      ageMin:Number.isFinite(Number(body?.ageMin))?Number(body.ageMin):null,
      ageMax:Number.isFinite(Number(body?.ageMax))?Number(body.ageMax):null,
      summary:clean(body?.summary,1000)||null,
      body:storyBody,
      narrationProfile,
      intensity,
      status:requestedStatus,
      publishedAt:requestedStatus==="PUBLISHED"?new Date():null,
      contentWarnings:Array.isArray(body?.contentWarnings)?body.contentWarnings.filter((v:unknown)=>typeof v==="string").slice(0,20):[]
    }
  });
  return NextResponse.json({story},{status:201});
}
