import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "../../../../lib/server/prisma";
import { getCurrentSessionUser } from "../../../../lib/server/session";
import { normalizeIdentifier, validatePassword } from "../../../../lib/auth";
import { RULES, hit, isLimited, reset, tooManyRequests } from "../../../../lib/server/rate-limit";

export const dynamic="force-dynamic";

/** The bootstrap admin's password comes from ADMIN_PASSWORD on every deploy, so changing it here wouldn't stick. */
function isEnvManagedAdmin(email:string|null){
  const configured=(process.env.ADMIN_EMAIL||"").trim().replace(/^(["'])(.*)\1$/,"$2").trim();
  if(!configured||!email||!(process.env.ADMIN_PASSWORD||"").trim())return false;
  const normalized=normalizeIdentifier(configured);
  return normalized.type==="email"&&normalized.value===email.toLowerCase();
}

export async function POST(request:NextRequest){
  const session=await getCurrentSessionUser();
  if(!session)return NextResponse.json({error:"Please log in again.",code:"signed_out"},{status:401});
  const prisma=getPrisma();
  if(!prisma)return NextResponse.json({error:"Database is unavailable."},{status:503});

  const blocked=await isLimited(RULES.passwordChangePerUser,session.id);
  if(!blocked.ok)return tooManyRequests(blocked,"Too many incorrect attempts.");

  const {currentPassword,newPassword}=await request.json().catch(()=>({}));
  if(typeof currentPassword!=="string"||typeof newPassword!=="string")return NextResponse.json({error:"Both passwords are required."},{status:400});
  if(!validatePassword(newPassword))return NextResponse.json({error:"Password must be 8-128 characters.",code:"bad_password"},{status:400});

  const user=await prisma.user.findUnique({where:{id:session.id},select:{id:true,email:true,passwordHash:true,isActive:true}});
  if(!user||!user.isActive)return NextResponse.json({error:"Please log in again.",code:"signed_out"},{status:401});
  if(isEnvManagedAdmin(user.email))return NextResponse.json({error:"This admin password is managed by ADMIN_PASSWORD in Coolify.",code:"managed"},{status:409});

  if(!(await bcrypt.compare(currentPassword,user.passwordHash))){
    await hit(RULES.passwordChangePerUser,session.id);
    return NextResponse.json({error:"Your current password is incorrect.",code:"wrong_current"},{status:400});
  }
  await prisma.user.update({where:{id:user.id},data:{passwordHash:await bcrypt.hash(newPassword,12)}});
  await reset(RULES.passwordChangePerUser,session.id);
  return NextResponse.json({ok:true});
}
