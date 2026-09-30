import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getPrisma } from "../../../../lib/server/prisma";
import { createSessionToken, normalizeIdentifier, validateIdentifier, validatePassword } from "../../../../lib/auth";

export async function POST(request:NextRequest){
  const {identifier,password,displayName}=await request.json();
  if(typeof identifier!=="string"||typeof password!=="string"){
    return NextResponse.json({error:"Email/phone and password are required."},{status:400});
  }
  if(!validateIdentifier(identifier)) return NextResponse.json({error:"Enter a valid email address or phone number."},{status:400});
  if(!validatePassword(password)) return NextResponse.json({error:"Password must be 8-128 characters."},{status:400});

  const prisma=getPrisma();
  if(!prisma) return NextResponse.json({error:"Database is not configured yet."},{status:503});

  const normalized=normalizeIdentifier(identifier);
  const existing=await prisma.user.findFirst({
    where:normalized.type==="email"?{email:normalized.value}:{phone:normalized.value}
  });
  if(existing) return NextResponse.json({error:"An account already exists with this email/phone."},{status:409});

  const user=await prisma.user.create({
    data:{
      displayName:typeof displayName==="string"&&displayName.trim()?displayName.trim():null,
      email:normalized.type==="email"?normalized.value:null,
      phone:normalized.type==="phone"?normalized.value:null,
      passwordHash:await bcrypt.hash(password,12)
    },
    select:{id:true,displayName:true,email:true,phone:true,role:true}
  });

  const token=await createSessionToken(user);
  const response=NextResponse.json({user},{status:201});
  response.cookies.set("religion_audio_session",token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:60*60*24*30});
  return response;
}
