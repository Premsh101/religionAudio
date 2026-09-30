import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getPrisma } from "../../../../lib/server/prisma";
import { createSessionToken, normalizeIdentifier, validateIdentifier } from "../../../../lib/auth";

export async function POST(request:NextRequest){
  const {identifier,password}=await request.json();
  if(typeof identifier!=="string"||typeof password!=="string") return NextResponse.json({error:"Email/phone and password are required."},{status:400});
  if(!validateIdentifier(identifier)) return NextResponse.json({error:"Enter a valid email address or phone number."},{status:400});

  const prisma=getPrisma();
  if(!prisma) return NextResponse.json({error:"Database is not configured yet."},{status:503});

  const normalized=normalizeIdentifier(identifier);
  const user=await prisma.user.findFirst({
    where:normalized.type==="email"?{email:normalized.value}:{phone:normalized.value}
  });
  if(!user || !user.isActive || !(await bcrypt.compare(password,user.passwordHash))){
    return NextResponse.json({error:"Incorrect email/phone or password."},{status:401});
  }

  const sessionUser={id:user.id,displayName:user.displayName,email:user.email,phone:user.phone};
  const token=await createSessionToken(sessionUser);
  const response=NextResponse.json({user:sessionUser});
  response.cookies.set("religion_audio_session",token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:60*60*24*30});
  return response;
}
